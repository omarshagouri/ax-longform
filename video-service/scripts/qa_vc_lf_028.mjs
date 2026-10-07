import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ENTRY = path.join(ROOT, "src", "index.ts");
const OUT = path.join(ROOT, "qa-vc-lf-028");
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const cases = [
  {
    name: "canonical",
    values: {
      SERIES: "BATTERY INTELLIGENCE",
      HEADLINE: "LFP VS NMC",
      SUBHEAD: "The tradeoff hiding behind the dashboard",
    },
  },
  {
    name: "stress",
    values: {
      SERIES: "EV BATTERY INTELLIGENCE",
      HEADLINE: "WHAT YOUR DASHBOARD DOESN'T TELL YOU",
      SUBHEAD: "The hidden difference between displayed battery health and usable energy",
    },
  },
];

const serveUrl = await bundle({ entryPoint: ENTRY, webpackOverride: (config) => config });

for (const test of cases) {
  const durationFrames = 150;
  const manifest = {
    video_id: "QA-VC-LF-028-" + test.name,
    fps: 30,
    width: 1920,
    height: 1080,
    audio: [],
    timeline: [{
      beat: 1,
      component: "VC-LF-028",
      props: test.values,
      src: "",
      startFrame: 0,
      durationFrames,
      track: "card",
    }],
  };
  const inputProps = { manifest };
  const composition = await selectComposition({
    serveUrl,
    id: "AmpCoreXLongForm",
    inputProps,
  });

  const dir = path.join(OUT, test.name);
  fs.mkdirSync(dir, { recursive: true });

  const checkpoints = [
    ["t00_0.3s", 9],
    ["t01_0.6s", 18],
    ["t02_1.0s", 30],
    ["t03_1.5s", 45],
    ["t04_final", 148],
  ];

  for (const [name, frame] of checkpoints) {
    await renderStill({
      composition,
      serveUrl,
      output: path.join(dir, name + ".png"),
      inputProps,
      frame,
      imageFormat: "png",
    });
  }

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: path.join(dir, "VC-LF-028-" + test.name + ".mp4"),
    inputProps,
    concurrency: 2,
  });
}

console.log("Rendered VC-LF-028 canonical + stress QA");
