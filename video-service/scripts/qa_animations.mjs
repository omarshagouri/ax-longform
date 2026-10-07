import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { bundle } from "@remotion/bundler";
import {
  renderMedia,
  renderStill,
  selectComposition,
} from "@remotion/renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ENTRY = path.join(ROOT, "src", "index.ts");
const OUT = path.join(ROOT, "qa-output");
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const cases = [
  {
    id: "VA-LF-001",
    durationFrames: 240,
    values: {
      title: "Gross capacity vs usable capacity",
      usablePct: 82,
      bufferPct: 18,
      usableLabel: "Usable",
      bufferLabel: "Reserve",
      footer: "Animation QA only",
    },
  },
  {
    id: "VA-LF-002",
    durationFrames: 240,
    values: {
      title: "Usable capacity change",
      beforeLabel: "Before",
      beforePct: 92,
      afterLabel: "After",
      afterPct: 84,
      deltaLabel: "−8 pts",
      footer: "Animation QA only",
    },
  },
  {
    id: "VA-LF-003",
    durationFrames: 270,
    values: {
      title: "Capacity trend",
      seriesALabel: "Observed",
      seriesA: [100, 98, 96, 94, 92, 90],
      seriesBLabel: "Reference",
      seriesB: [100, 99, 98, 97, 96, 95],
      xLabel: "Time",
      yLabel: "Capacity (%)",
      footer: "Animation QA only",
    },
  },
  {
    id: "VA-LF-004",
    durationFrames: 240,
    values: {
      title: "Charging control path",
      nodes: ["Charger", "BMS", "Pack", "Cells"],
      centerLabel: "Requested power is controlled by the vehicle",
      direction: "forward",
      footer: "Animation QA only",
    },
  },
  {
    id: "VA-LF-005",
    durationFrames: 270,
    values: {
      title: "Software timeline",
      milestones: [
        { label: "Baseline", value: "V1", tone: "white" },
        { label: "Update", value: "V2", tone: "teal" },
        { label: "Change", value: "V3", tone: "heat" },
        { label: "Validated", value: "V4", tone: "teal" },
      ],
      footer: "Animation QA only",
    },
  },
  {
    id: "VA-LF-006",
    durationFrames: 210,
    values: {
      title: "Fleet sample",
      value: 22700,
      decimals: 0,
      prefix: "",
      suffix: "+",
      label: "vehicles",
      tone: "teal",
      footer: "Animation QA only",
    },
  },
  {
    id: "VA-LF-007",
    durationFrames: 270,
    values: {
      title: "BMS strategy change",
      beforeLabel: "Before",
      afterLabel: "After",
      beforeItems: ["Fixed usable window", "Original calibration"],
      afterItems: ["Revised usable window", "Updated calibration"],
      footer: "Animation QA only",
    },
  },
];

const serveUrl = await bundle({
  entryPoint: ENTRY,
  webpackOverride: (config) => config,
});

for (const test of cases) {
  const inputProps = {
    animationId: test.id,
    values: test.values,
    durationFrames: test.durationFrames,
  };

  const composition = await selectComposition({
    serveUrl,
    id: "AmpCoreXAnimationPreview",
    inputProps,
  });

  const dir = path.join(OUT, test.id);
  fs.mkdirSync(dir, { recursive: true });

  const checkpoints = [
    { name: "t00_0.5s", frame: Math.min(test.durationFrames - 1, 15) },
    { name: "t01_1.5s", frame: Math.min(test.durationFrames - 1, 45) },
    { name: "t02_3.0s", frame: Math.min(test.durationFrames - 1, 90) },
    { name: "t03_mid", frame: Math.floor(test.durationFrames / 2) },
    { name: "t04_final", frame: test.durationFrames - 2 },
  ];

  for (const cp of checkpoints) {
    await renderStill({
      composition,
      serveUrl,
      output: path.join(dir, `${cp.name}.png`),
      inputProps,
      frame: cp.frame,
      imageFormat: "png",
    });
  }

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: path.join(dir, `${test.id}.mp4`),
    inputProps,
    concurrency: 2,
  });

  fs.writeFileSync(
    path.join(dir, "input.json"),
    JSON.stringify(test, null, 2)
  );
}

console.log(`Rendered ${cases.length} animations to ${OUT}`);
