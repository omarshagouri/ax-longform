// Long Form — independent Remotion chapter renderer.
// Native canvas: 1920x1080. This service never calls or modifies Shorts services.
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia, renderStill } from "@remotion/renderer";
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
    authClientPromise = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/drive"] }).getClient();
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

async function driveUploadVideo(filePath, filename, folderId) {
  if (!folderId || !String(folderId).trim()) throw new Error("folder_id is required for direct Drive upload");
  const client = await getAuthClient();
  const metadata = { name: filename, mimeType: "video/mp4", parents: [String(folderId).trim()] };
  const size = fs.statSync(filePath).size;
  // Resumable upload sends the MP4 as a stream, not in an HTTP response to Make.
  const session = await client.request({
    url: "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id,name,webViewLink",
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8", "X-Upload-Content-Type": "video/mp4", "X-Upload-Content-Length": String(size) },
    data: metadata,
  });
  const location = session.headers?.location;
  if (!location) throw new Error("Drive did not return a resumable upload URL");
  const uploaded = await client.request({
    url: location, method: "PUT",
    headers: { "Content-Type": "video/mp4", "Content-Length": String(size) },
    data: fs.createReadStream(filePath),
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });
  const id = uploaded.data?.id;
  if (!id) throw new Error("Drive upload succeeded without a file ID");
  return { file_id: id, filename: uploaded.data?.name || filename, drive_url: uploaded.data?.webViewLink || `https://drive.google.com/file/d/${id}/view` };
}

async function durationSec(buf) {
  try { return (await parseBuffer(buf)).format.duration || 0; } catch { return 0; }
}

function parseBeat(b, i, fps, cursor) {
  const durSec = parseFloat(String(b.duration)) || 3;
  const durationFrames = Math.max(1, Math.round(durSec * fps));
  const beat = Number(b.beat) || i + 1;
  const id = String(b.card_id || b.visual_id || "").trim();
  const isCard = id.startsWith("VC-LF-");
  const isAnimation = id.startsWith("VA-LF-");
  if (!isCard && !isAnimation) {
    throw new Error(`beat ${beat}: long-form renderer accepts VC-LF-* cards or VA-LF-* animations (got ${id})`);
  }
  let props = {};
  const v = b.values;
  if (typeof v === "string") {
    try { props = JSON.parse(v || "{}"); }
    catch { throw new Error(`beat ${beat}: values is not valid JSON for ${id}`); }
  } else if (v && typeof v === "object") {
    props = v;
  }
  return {
    beat,
    track: isAnimation ? "anim" : "card",
    component: id,
    props,
    startFrame: cursor,
    durationFrames,
  };
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

    // Optional per-animation background image from Drive.
    // Visual Plan may pass values.backgroundFileId and backgroundOpacity.
    if (item.track === "anim" && item.props && item.props.backgroundFileId) {
      const bgId = String(item.props.backgroundFileId || "").trim();
      if (bgId) {
        const { name } = await driveDownload(bgId, path.join(ASSETS, `${safe}_bg_${item.beat}`));
        item.props = { ...item.props, backgroundSrc: `${BASE}/assets/${name}` };
      }
    }

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

async function renderThumbnail({ background_base64, headline, subhead = "", series = "BATTERY INTELLIGENCE", logo_file_id = "", output_name = "thumbnail.png" }) {
  if (!background_base64) throw new Error("background_base64 is required");
  if (!headline) throw new Error("headline is required");

  const safe = String(output_name || "thumbnail.png").replace(/[^A-Za-z0-9._-]/g, "_");
  const bgName = `thumb_bg_${Date.now()}.png`;
  const bgPath = path.join(ASSETS, bgName);
  fs.writeFileSync(bgPath, Buffer.from(background_base64, "base64"));

  let logoSrc = "";
  const logoId = String(logo_file_id || "").trim();
  if (logoId) {
    const { name } = await driveDownload(logoId, path.join(ASSETS, `thumb_logo_${Date.now()}`));
    logoSrc = `${BASE}/assets/${name}`;
  }

  const serveUrl = await getServeUrl();
  const inputProps = {
    backgroundSrc: `${BASE}/assets/${bgName}`,
    logoSrc,
    series,
    headline,
    subhead,
  };
  const composition = await selectComposition({ serveUrl, id: "AXThumbnail", inputProps });
  const out = path.join("/tmp", safe.endsWith(".png") ? safe : `${safe}.png`);
  await renderStill({ composition, serveUrl, output: out, inputProps, imageFormat: "png" });

  const b64 = fs.readFileSync(out).toString("base64");
  fs.unlinkSync(out);
  try { fs.unlinkSync(bgPath); } catch {}
  return { filename: path.basename(out), file_base64: b64, width: 1280, height: 720 };
}

async function renderManifest(manifest) {
  const serveUrl = await getServeUrl();
  const safe = String(manifest.video_id || "chapter").replace(/[^A-Za-z0-9_-]/g, "");
  const out = path.join("/tmp", `${safe}.mp4`);
  const composition = await selectComposition({ serveUrl, id: "AXLongForm", inputProps: { manifest } });
  await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: out, inputProps: { manifest } });
  const b64 = fs.readFileSync(out).toString("base64");
  fs.unlinkSync(out);
  return { filename: `${safe}.mp4`, file_base64: b64 };
}

async function assembleApprovedChapters(video_id, chapters, endClipId, thumbnailFileId = "", folderId = "") {
  const safe = String(video_id || "video").replace(/[^A-Za-z0-9_-]/g, "");
  const normalized = [...chapters].map((x, i) => ({
    chapter: Number(x?.chapter) || i + 1,
    file_id: String(x?.file_id || "").trim(),
    review_status: String(x?.review_status || "").trim(),
  }));
  if (!normalized.length) throw new Error("need at least one approved chapter");
  const blocked = normalized.filter((x) => x.review_status !== "Approved");
  if (blocked.length) {
    throw new Error(`assembly blocked: every chapter must be Approved (blocked chapters: ${blocked.map((x) => x.chapter).join(", ")})`);
  }
  const missing = normalized.filter((x) => !x.file_id);
  if (missing.length) {
    throw new Error(`assembly blocked: missing chapter video file IDs (chapters: ${missing.map((x) => x.chapter).join(", ")})`);
  }
  const ordered = normalized.sort((a, b) => a.chapter - b.chapter);
  const chapterNums = ordered.map((x) => x.chapter);
  if (new Set(chapterNums).size !== chapterNums.length) {
    throw new Error("assembly blocked: duplicate chapter numbers found");
  }

  const inputs = [];
  const thumbId = String(thumbnailFileId || "").trim();
  // A one-second 1920x1080 silent intro. We encode an AAC silence track so that
  // the following chapters' audio begins at t=1s during MP4 concatenation.
  if (thumbId) {
    const { name } = await driveDownload(thumbId, path.join(ASSETS, `${safe}_assembly_thumbnail`));
    const thumbPath = path.join(ASSETS, name);
    const introPath = path.join("/tmp", `${safe}_thumbnail_intro.mp4`);
    const intro = spawnSync("ffmpeg", [
      "-y", "-loop", "1", "-framerate", "30", "-i", thumbPath,
      "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
      "-t", "1", "-map", "0:v:0", "-map", "1:a:0",
      "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,format=yuv420p",
      "-r", "30", "-c:v", "libx264", "-preset", "fast", "-crf", "18",
      "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
      "-movflags", "+faststart", "-shortest", introPath
    ], { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
    if (intro.status !== 0 || !fs.existsSync(introPath)) {
      throw new Error(`thumbnail intro generation failed: ${intro.stderr || intro.stdout || "unknown error"}`);
    }
    inputs.push(introPath);
  }
  for (let i = 0; i < ordered.length; i++) {
    const { name } = await driveDownload(
      ordered[i].file_id,
      path.join(ASSETS, `${safe}_assembly_ch_${String(ordered[i].chapter).padStart(2, "0")}_${i + 1}`)
    );
    inputs.push(path.join(ASSETS, name));
  }

  const endId = String(endClipId || "").trim();
  if (endId) {
    const { name } = await driveDownload(endId, path.join(ASSETS, `${safe}_assembly_endclip`));
    inputs.push(path.join(ASSETS, name));
  }

  const listPath = path.join("/tmp", `${safe}_concat.txt`);
  const out = path.join("/tmp", `${safe}_FINAL.mp4`);
  const listBody = inputs
    .map((p) => `file '${p.replace(/'/g, "'\\''")}'`)
    .join("\n");
  fs.writeFileSync(listPath, listBody);

  let ff = spawnSync("ffmpeg", [
    "-y", "-f", "concat", "-safe", "0", "-i", listPath,
    "-c", "copy", "-movflags", "+faststart", out
  ], { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });

  if (ff.status !== 0 || !fs.existsSync(out)) {
    ff = spawnSync("ffmpeg", [
      "-y", "-f", "concat", "-safe", "0", "-i", listPath,
      "-c:v", "libx264", "-preset", "fast", "-crf", "18",
      "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out
    ], { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
  }

  try { fs.unlinkSync(listPath); } catch {}
  if (ff.status !== 0 || !fs.existsSync(out)) {
    throw new Error(`ffmpeg assembly failed: ${ff.stderr || ff.stdout || "unknown error"}`);
  }

  try {
    const uploaded = await driveUploadVideo(out, `${safe}_FINAL.mp4`, folderId);
    return {
      ...uploaded,
      chapter_count: ordered.length,
      end_clip_included: Boolean(endId),
      thumbnail_intro_included: Boolean(thumbId),
      thumbnail_intro_seconds: thumbId ? 1 : 0,
    };
  } finally {
    try { fs.unlinkSync(out); } catch {}
  }
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
      visual_beats: manifest.timeline.length,
      card_beats: manifest.timeline.filter((x) => x.track === "card").length,
      animation_beats: manifest.timeline.filter((x) => x.track === "anim").length,
      audio_tracks: manifest.audio.length,
      ...(await renderManifest(manifest)),
    });
  } catch (e) { console.error(e); return res.status(500).json({ error: String(e?.stack || e) }); }
});

app.post("/thumbnail", async (req, res) => {
  if (!ok(req)) return res.status(401).json({ error: "bad api key" });
  try {
    return res.json({ status: "ok", ...(await renderThumbnail(req.body || {})) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e?.stack || e) });
  }
});

app.post("/assemble-video", async (req, res) => {
  if (!ok(req)) return res.status(401).json({ error: "bad api key" });
  const { video_id, chapters = [], end_clip_file_id = "", thumbnail_file_id = "", folder_id = "" } = req.body || {};
  if (!Array.isArray(chapters) || chapters.length === 0) {
    return res.status(400).json({ error: "need non-empty chapters[]" });
  }
  if (!String(folder_id).trim()) return res.status(400).json({ error: "folder_id is required" });
  try {
    return res.json({
      status: "ok",
      ...(await assembleApprovedChapters(video_id, chapters, end_clip_file_id, thumbnail_file_id, folder_id)),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e?.stack || e) });
  }
});

app.listen(PORT, () => console.log(`ax-longform-video listening on ${PORT}`));