import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "qa-card-stills");
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const modText = fs.readFileSync(path.join(__dirname, "qa_cards.mjs"), "utf8");
const canonicalMatch = modText.match(/const canonical = ([\s\S]*?)\.map\(\(\[id,durationSec,values\]\)/);
if (!canonicalMatch) throw new Error("Could not extract canonical cases");
const canonicalArray = Function("return " + canonicalMatch[1])();

const stressMatch = modText.match(/const stressOverride = (\{[\s\S]*?\n\});\n\nconst stress =/);
if (!stressMatch) throw new Error("Could not extract stress overrides");
const stressOverride = Function("return " + stressMatch[1])();

const canonical = canonicalArray.map(([id,durationSec,values]) => ({id,durationSec,values}));
const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src", "index.ts") });

async function renderCase(test, outName, frame) {
  const durationFrames = Math.max(1, Math.round(test.durationSec * 30));
  const manifest = {
    video_id: "QA-" + test.id,
    fps: 30,
    width: 1920,
    height: 1080,
    audio: [],
    timeline: [{
      beat: 1,
      component: test.id,
      props: test.values,
      src: "",
      startFrame: 0,
      durationFrames,
      track: "card",
    }],
  };
  const inputProps = { manifest };
  const composition = await selectComposition({ serveUrl, id: "AmpCoreXLongForm", inputProps });
  await renderStill({
    composition,
    serveUrl,
    output: path.join(OUT, outName),
    inputProps,
    frame: Math.max(0, Math.min(durationFrames - 1, frame)),
    imageFormat: "png",
  });
}

for (const c of canonical) {
  await renderCase(c, c.id + "_canonical_1.5s.png", 45);
  await renderCase(c, c.id + "_canonical_final.png", Math.round(c.durationSec * 30) - 2);
  await renderCase({...c, values: stressOverride[c.id] || c.values}, c.id + "_stress_final.png", Math.round(c.durationSec * 30) - 2);
}
console.log("Rendered quick still QA for " + canonical.length + " cards.");
