// AmpCoreX Long Form — independent Remotion chapter renderer.
// Native canvas: 1920x1080. This service never calls or modifies Shorts services.
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import { GoogleAuth } from "google-auth-library";
import { parseBuffer } from "music-metadata";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ENTRY = path.join(ROOT, "src", "index.ts");
const API_KEY = process.env.LONGFORM_RENDER_API_KEY || "PLACEHOLDER_KEY";
const PORT = process.env.PORT || 8080;
const BASE = `http://127.0.0.1:${PORT}`;
const ASSETS = "/tmp/axlf-assets";
const WIDTH = 1920;
const HEIGHT = 1080;
fs.mkdirSync(ASSETS, { recursive: true });

const app = express();
app.use(express.json({ limit: "16mb" }));
app.use("/assets", express.static(ASSETS));

let serveUrlPromise = null;
const getServeUrl = () => {
  if (!serveUrlPromise) serveUrlPromise = bundle({ entryPoint: ENTRY });
  return serveUrlPromise;
};

let authClientPromise = null;
const getAuthClient = () => {
  if (!authClientPromise) {
    authClientPromise = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/drive.readonly"] }).getClient();
  }
  return authClientPromise;
};

async function driveDownload(fileId, destNoExt) {
  const client = await getAuthClient();
  const res = await client.request({
    url: `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`,
    responseType: "arraybuffer",
  });
  const buf = Buffer.from(res.data);
  const ct = String(res.headers?.["content-type"] || "");
  const ext = ct.includes("png") ? ".png" : ct.includes("jpeg") || ct.includes("jpg") ? ".jpg"
    : ct.includes("mp4") || ct.includes("video") ? ".mp4" : ct.includes("mpeg") || ct.includes("audio") ? ".mp3" : "";
  const dest = destNoExt + ext;
  fs.writeFileSync(dest, buf);
  return { buf, name: path.basename(dest) };
}

async function durationSec(buf) {
  try { return (await parseBuffer(buf)).format.duration || 0; } catch { return 0; }
}

function parseBeat(b, i, fps, cursor) {
  const durSec = parseFloat(String(b.duration)) || 3;
  const durationFrames = Math.max(1, Math.round(durSec * fps));
  const beat = Number(b.beat) || i + 1;
  const id = String(b.card_id || "").trim();
  if (!id.startsWith("VC-LF-")) throw new Error(`beat ${beat}: long-form renderer only accepts VC-LF-* cards (got ${id})`);
  let props = {};
  const v = b.values;
  if (typeof v === "string") { try { props = JSON.parse(v || "{}"); } catch { props = {}; } }
  else if (v && typeof v === "object") { props = v; }
  return { beat, track: "card", component: id, props, startFrame: cursor, durationFrames };
}

function coalesce(timeline) {
  const out = [];
  for (const item of timeline) {
    const prev = out[out.length - 1];
    const same = prev && prev.track === item.track && prev.component === item.component &&
      JSON.stringify(prev.props || {}) === JSON.stringify(item.props || {}) &&
      prev.startFrame + prev.durationFrames === item.startFrame;
    if (same) prev.durationFrames += item.durationFrames;
    else out.push({ ...item });
  }
  return out;
}

async function buildChapter(video_id, fps, beats, audioIds) {
  const safe = (video_id || "chapter").replace(/[^A-Za-z0-9_-]/g, "");
  let timeline = [];
  const audio = [];
  let cursor = 0;
  for (let i = 0; i < beats.length; i++) {
    const item = parseBeat(beats[i], i, fps, cursor);
    timeline.push(item);
    cursor += item.durationFrames;
  }
  timeline = coalesce(timeline);

  let acur = 0;
  for (let i = 0; i < (audioIds || []).length; i++) {
    const id = String(audioIds[i] || "").trim();
    if (!id) continue;
    const { buf, name } = await driveDownload(id, path.join(ASSETS, `${safe}_aud_${i + 1}`));
    const df = Math.max(1, Math.round((await durationSec(buf)) * fps));
    audio.push({ chapter: i + 1, src: `${BASE}/assets/${name}`, startFrame: acur, durationFrames: df });
    acur += df;
  }

  return { video_id: video_id || "chapter", fps, width: WIDTH, height: HEIGHT, timeline, audio };
}

async function renderManifest(manifest) {
  const serveUrl = await getServeUrl();
  const safe = String(manifest.video_id || "chapter").replace(/[^A-Za-z0-9_-]/g, "");
  const out = path.join("/tmp", `${safe}.mp4`);
  const composition = await selectComposition({ serveUrl, id: "AmpCoreXLongForm", inputProps: { manifest } });
  await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: out, inputProps: { manifest } });
  const b64 = fs.readFileSync(out).toString("base64");
  fs.unlinkSync(out);
  return { filename: `${safe}.mp4`, file_base64: b64 };
}

const ok = (req) => req.headers["x-api-key"] === API_KEY;

app.get("/", (_req, res) => res.json({ status: "ok", service: "ax-longform-video", width: WIDTH, height: HEIGHT, fps: 30 }));

app.post("/render-video", async (req, res) => {
  if (!ok(req)) return res.status(401).json({ error: "bad api key" });
  const manifest = req.body?.manifest ?? req.body;
  if (!manifest || !Array.isArray(manifest.timeline)) return res.status(400).json({ error: "need manifest.timeline[]" });
  manifest.width = WIDTH;
  manifest.height = HEIGHT;
  try { return res.json({ status: "ok", ...(await renderManifest(manifest)) }); }
  catch (e) { console.error(e); return res.status(500).json({ error: String(e?.stack || e) }); }
});

app.post(["/build-and-render", "/render-chapter"], async (req, res) => {
  if (!ok(req)) return res.status(401).json({ error: "bad api key" });
  const { video_id, fps = 30, beats, audio_file_ids = [] } = req.body || {};
  if (!Array.isArray(beats) || beats.length === 0) return res.status(400).json({ error: "need non-empty beats[]" });
  try {
    const F = Number(fps) || 30;
    const manifest = await buildChapter(video_id, F, beats, audio_file_ids);
    return res.json({
      status: "ok",
      card_beats: manifest.timeline.length,
      audio_tracks: manifest.audio.length,
      ...(await renderManifest(manifest)),
    });
  } catch (e) { console.error(e); return res.status(500).json({ error: String(e?.stack || e) }); }
});

app.listen(PORT, () => console.log(`ax-longform-video listening on ${PORT}`));
