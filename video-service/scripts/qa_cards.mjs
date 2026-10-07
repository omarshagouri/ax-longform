import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ENTRY = path.join(ROOT, "src", "index.ts");
const OUT = path.join(ROOT, "qa-card-output");
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const canonical = [
  ["VC-LF-001",3,{"KICKER":"Capacity retained after 200,000 km","NUM":"87","PCT":"%"}],
  ["VC-LF-002",5,{"TITLE":"Energy density (Wh/kg)","VALUE_A":"220","LABEL_A":"NMC","VALUE_B":"160","LABEL_B":"LFP","SOURCE":"ILLUSTRATIVE, needs cited source"}],
  ["VC-LF-003",6,{"TAG":"Engineer's Note","STATEMENT":"In the field I see far more packs fade from heat than from fast charging.","ROLE":"Practicing battery engineer"}],
  ["VC-LF-004",7,{"KICKER":"Cold-weather range","HOOK":"Below freezing, an EV can temporarily lose a third of its range."}],
  ["VC-LF-005",4,{"BEAT_LINE":"Heat is the silent killer of lithium-ion cells."}],
  ["VC-LF-006",5,{"TERM":"State of Health (SoH)","DEFINITION":"Current usable capacity versus when the pack was new, shown as a percentage."}],
  ["VC-LF-007",6,{"WARNING_LINE":"Do not store at 100% in extreme heat","DETAIL":"High charge plus high temperature drives permanent capacity loss."}],
  ["VC-LF-008",7,{"CORRECT_LABEL":"Real cause","CORRECT_ITEM":"Sustained high temperature","WRONG_LABEL":"Not the cause","WRONG_ITEM":"Occasional fast charging"}],
  ["VC-LF-009",4,{"MYTH_LINE":"Fast charging always wrecks your battery.","FACT_LINE":"Thermal limits in the BMS keep the impact small for most drivers.","SOURCE":"omar shagouri"}],
  ["VC-LF-010",5,{"COL1_TITLE":"LFP","COL1_POINT":"Long cycle life, lower energy density","COL2_TITLE":"NMC","COL2_POINT":"Higher range, more heat-sensitive","COL3_TITLE":"","COL3_POINT":""}],
  ["VC-LF-011",3,{"HEADER":"Protect your battery","ITEM1":"Keep charge between 20 and 80%","ITEM2":"Avoid parking in extreme heat","ITEM3":"Precondition before fast charging","ITEM4":"Save 100% charges for trip days","REVEAL":"4"}],
  ["VC-LF-012",3,{"LOW_PCT":"20","HIGH_PCT":"80","CAPTION":"The everyday charge window that maximizes pack life"}],
  ["VC-LF-013",3,{"VALUE":"92%","METRIC_LABEL":"State of Health","SOURCE":"ILLUSTRATIVE, needs cited source"}],
  ["VC-LF-014",3,{"TEMP":"25°C","CAPTION":"The sweet spot for lithium-ion performance","SOURCE":"ILLUSTRATIVE, needs cited source"}],
  ["VC-LF-015",3,{"AMOUNT":"$115/kWh","LABEL":"Illustrative pack cost","SOURCE":"ILLUSTRATIVE, needs cited source"}],
  ["VC-LF-016",3,{"P1_YEAR":"0 yr","P1_LABEL":"100% capacity","P2_YEAR":"4 yr","P2_LABEL":"~95%","P3_YEAR":"8 yr","P3_LABEL":"~90%","P4_YEAR":"","P4_LABEL":""}],
  ["VC-LF-017",3,{"STEP1":"Collect","STEP2":"Discharge","STEP3":"Shred","STEP4":""}],
  ["VC-LF-018",3,{"ITEM1":"Heat","ITEM2":"High state of charge","ITEM3":"Fast-charge frequency","ITEM4":""}],
  ["VC-LF-019",3,{"QUOTE_TEXT":"Degradation is driven by time and temperature, not cycles alone.","SOURCE_NAME":"ILLUSTRATIVE, needs cited source"}],
  ["VC-LF-023",3,{"TITLE":"Range vs temperature","C1_LABEL":"25°C","C1_VALUE":"100","C2_LABEL":"0°C","C2_VALUE":"80","C3_LABEL":"15C","C3_VALUE":"90","SOURCE":"ILLUSTRATIVE, needs cited source"}],
  ["VC-LF-024",3,{"TITLE":"Capacity over time","PATH":"0,100 25,96 50,92 75,89 100,86","X_LABEL":"Years","Y_LABEL":"Capacity %","ANNOTATION":"Front-loaded, then gradual"}],
  ["VC-LF-025",3,{"USABLE_PCT":"80","TOP_BUFFER":"10","BOTTOM_BUFFER":"10","CAPTION":"Hidden buffers protect the cells you never see"}],
  ["VC-LF-020",3,{"TAG_TEXT":"CHAPTER 1"}],
  ["VC-LF-021",3,{"ROLE_TEXT":"Battery Engineer"}],
  ["VC-LF-022",4,{"CTA_LINE":"Subscribe for more battery intelligence"}],
  ["VC-LF-026",3,{"SOURCE_NAME":"Example source"}],
  ["VC-LF-027",2,{}],
  ["VC-LF-028",5,{"SERIES":"BATTERY INTELLIGENCE","HEADLINE":"LFP VS NMC","SUBHEAD":"The tradeoff hiding behind the dashboard"}],
  ["VC-LF-029",5.5,{"TITLE":"SAME CAR. DIFFERENT BATTERY.","LEFT_HEAD":"STANDARD RANGE","RIGHT_HEAD":"LONG RANGE","ROW1_LABEL":"CHEMISTRY","LEFT1":"LFP","RIGHT1":"NCA","ROW2_LABEL":"BODY","LEFT2":"MODEL 3","RIGHT2":"MODEL 3","ROW3_LABEL":"SOFTWARE","LEFT3":"TESLA","RIGHT3":"TESLA","SOURCE":"TEST"}],
  ["VC-LF-030",5,{"HOOK":"The dashboard can mislead you","DATA_LABEL":"Displayed health","DATA_VALUE":"88%","TAKEAWAY":"Usable energy can stay similar even when displayed SoH differs."}],
  ["VC-LF-031",5.5,{"TITLE":"DASHBOARD VS USABLE CAPACITY","LEFT_LABEL":"EV A","LEFT_SOH":"88","LEFT_USABLE":"49.2 kWh","RIGHT_LABEL":"EV B","RIGHT_SOH":"97","RIGHT_USABLE":"49.5 kWh","FOOTER":"Similar usable energy. Different displayed health.","SOURCE":"TEST"}],
].map(([id,durationSec,values]) => ({ id, durationSec, values }));

const stressOverride = {
  "VC-LF-001": {"KICKER":"Capacity retained after 320,000 kilometres of mixed real-world driving","NUM":"87","PCT":"%"},
  "VC-LF-002": {"TITLE":"Real-world energy density comparison at pack level","VALUE_A":"265","LABEL_A":"Nickel-rich chemistry","VALUE_B":"168","LABEL_B":"Lithium iron phosphate","SOURCE":"International Council on Clean Transportation — technical review 2026"},
  "VC-LF-003": {"TAG":"ENGINEER'S NOTE","STATEMENT":"A dashboard estimate can move even when the cell's physical capacity has barely changed, because the BMS is estimating usable energy rather than directly measuring chemistry health.","ROLE":"Battery systems engineer — field interpretation"},
  "VC-LF-004": {"KICKER":"Cold-weather battery behaviour","HOOK":"Low temperature can reduce available power and range before any permanent battery damage has occurred."},
  "VC-LF-005": {"BEAT_LINE":"The number on the dashboard is an estimate, not a laboratory capacity measurement."},
  "VC-LF-006": {"TERM":"Battery State of Health (SoH)","DEFINITION":"An estimate of remaining battery capability relative to a defined reference condition, often shaped by usable-energy limits, calibration, temperature and BMS logic."},
  "VC-LF-007": {"WARNING_LINE":"Do not confuse temporary cold-weather range loss with permanent battery degradation","DETAIL":"Temperature changes efficiency and available energy, while true capacity fade develops through longer-term electrochemical aging."},
  "VC-LF-008": {"CORRECT_LABEL":"Supported interpretation","CORRECT_ITEM":"Repeated high-temperature exposure can accelerate battery aging","WRONG_LABEL":"Overstated shortcut","WRONG_ITEM":"One fast-charging session permanently damages the pack"},
  "VC-LF-009": {"MYTH_LINE":"Every trip to 100% permanently damages an EV battery.","FACT_LINE":"Occasional full charges and repeated long-term high-SOC storage are not the same exposure pattern.","SOURCE":"AmpCoreX engineering explainer — source line stress test"},
  "VC-LF-010": {"COL1_TITLE":"LFP","COL1_POINT":"Lower energy density with strong cycle-life potential","COL2_TITLE":"NMC / NCA","COL2_POINT":"Higher energy density with chemistry-specific tradeoffs","COL3_TITLE":"Pack design","COL3_POINT":"Thermal control and BMS strategy can change the ownership experience"},
  "VC-LF-011": {"HEADER":"Four habits that reduce unnecessary battery stress","ITEM1":"Avoid leaving the vehicle at very high SOC for long hot periods","ITEM2":"Use battery preconditioning before high-power charging when available","ITEM3":"Follow the manufacturer guidance for your exact battery chemistry","ITEM4":"Treat occasional road-trip charging differently from repeated daily behaviour","REVEAL":"4"},
  "VC-LF-012": {"LOW_PCT":"15","HIGH_PCT":"90","CAPTION":"Illustrative operating window used to verify long caption fit and percentage spacing"},
  "VC-LF-013": {"VALUE":"97.5%","METRIC_LABEL":"Estimated State of Health after calibration","SOURCE":"Independent battery test report — long source-name stress test"},
  "VC-LF-014": {"TEMP":"−25°C","CAPTION":"Cold-cell charging limits depend on temperature, chemistry, SOC and BMS control","SOURCE":"Battery engineering reference — long source-name stress test"},
  "VC-LF-015": {"AMOUNT":"$1,250/kWh","LABEL":"Illustrative high-cost replacement scenario","SOURCE":"Market analysis source — long citation label stress test"},
  "VC-LF-016": {"P1_YEAR":"0 yr","P1_LABEL":"100% reference capacity","P2_YEAR":"3 yr","P2_LABEL":"First calibrated estimate","P3_YEAR":"6 yr","P3_LABEL":"Long-term trend point","P4_YEAR":"10 yr","P4_LABEL":"Extended ownership"},
  "VC-LF-017": {"STEP1":"Collect retired packs","STEP2":"Diagnose modules","STEP3":"Recover materials","STEP4":"Return materials to manufacturing"},
  "VC-LF-018": {"ITEM1":"Sustained high temperature","ITEM2":"Time at very high state of charge","ITEM3":"Repeated high-power charging exposure","ITEM4":"Calendar time and storage conditions"},
  "VC-LF-019": {"QUOTE_TEXT":"Battery degradation is not one mechanism. Temperature, time, state of charge and cycling conditions interact across the pack's life.","SOURCE_NAME":"Peer-reviewed battery aging literature — long attribution stress test"},
  "VC-LF-023": {"TITLE":"Real-world range retention across three temperatures","C1_LABEL":"Mild 25°C","C1_VALUE":"100","C2_LABEL":"Cold −10°C","C2_VALUE":"74","C3_LABEL":"Cool 5°C","C3_VALUE":"86","SOURCE":"Independent winter range dataset — long source-name stress test"},
  "VC-LF-024": {"TITLE":"Long-term usable capacity over ownership","PATH":"0,100 15,98 30,96 45,93 60,91 75,89 90,87 100,86","X_LABEL":"Ownership time","Y_LABEL":"Usable capacity (%)","ANNOTATION":"Early settling followed by a slower long-term decline"},
  "VC-LF-025": {"USABLE_PCT":"72","TOP_BUFFER":"14","BOTTOM_BUFFER":"14","CAPTION":"The driver sees the usable window, while the pack can reserve energy above and below it for protection and control."},
  "VC-LF-020": {"TAG_TEXT":"CHAPTER 12 — BATTERY HEALTH"},
  "VC-LF-021": {"ROLE_TEXT":"Senior Battery Systems Engineer"},
  "VC-LF-022": {"CTA_LINE":"Subscribe for engineering-grounded battery intelligence every week"},
  "VC-LF-026": {"SOURCE_NAME":"International Council on Clean Transportation — 2026 technical report"},
  "VC-LF-027": {},
  "VC-LF-028": {"SERIES":"EV BATTERY INTELLIGENCE","HEADLINE":"WHAT YOUR DASHBOARD DOESN'T TELL YOU","SUBHEAD":"The hidden difference between displayed battery health and usable energy"},
  "VC-LF-029": {"TITLE":"SAME VEHICLE PLATFORM. DIFFERENT BATTERY STRATEGY.","LEFT_HEAD":"STANDARD RANGE VERSION","RIGHT_HEAD":"LONG RANGE VERSION","ROW1_LABEL":"CELL CHEMISTRY","LEFT1":"LITHIUM IRON PHOSPHATE","RIGHT1":"NICKEL-RICH CHEMISTRY","ROW2_LABEL":"USABLE ENERGY","LEFT2":"57.5 kWh","RIGHT2":"75.0 kWh","ROW3_LABEL":"BMS STRATEGY","LEFT3":"DAILY-USE CALIBRATION","RIGHT3":"RANGE-OPTIMIZED WINDOW","SOURCE":"Manufacturer specifications and engineering analysis — stress test"},
  "VC-LF-030": {"HOOK":"The dashboard can change even when the cells have barely changed","DATA_LABEL":"Displayed battery health estimate","DATA_VALUE":"88.6%","TAKEAWAY":"Displayed SoH and measured usable energy can diverge because the BMS is estimating a managed battery system, not reading cell chemistry directly."},
  "VC-LF-031": {"TITLE":"DISPLAYED HEALTH VS REAL USABLE ENERGY","LEFT_LABEL":"Vehicle A — calibrated","LEFT_SOH":"88.6","LEFT_USABLE":"49.2 kWh usable","RIGHT_LABEL":"Vehicle B — recalibrated","RIGHT_SOH":"97.1","RIGHT_USABLE":"49.5 kWh usable","FOOTER":"Nearly identical usable energy can coexist with very different displayed health estimates.","SOURCE":"Illustrative engineering comparison — stress test"}
};

const stress = canonical.map((c) => ({
  ...c,
  values: stressOverride[c.id] || c.values,
}));

const serveUrl = await bundle({
  entryPoint: ENTRY,
  webpackOverride: (config) => config,
});

async function makeComposition(test) {
  const durationFrames = Math.max(1, Math.round(test.durationSec * 30));
  const manifest = {
    video_id: \`QA-\${test.id}\`,
    fps: 30,
    width: 1920,
    height: 1080,
    audio: [],
    timeline: [
      {
        beat: 1,
        component: test.id,
        props: test.values,
        src: "",
        startFrame: 0,
        durationFrames,
        track: "card",
      },
    ],
  };
  const inputProps = { manifest };
  const composition = await selectComposition({
    serveUrl,
    id: "AmpCoreXLongForm",
    inputProps,
  });
  return { composition, inputProps, durationFrames };
}

for (const test of canonical) {
  const { composition, inputProps, durationFrames } = await makeComposition(test);
  const dir = path.join(OUT, "canonical", test.id);
  fs.mkdirSync(dir, { recursive: true });

  const checkpoints = [
    ["t00_0.5s", Math.min(durationFrames - 1, 15)],
    ["t01_1.5s", Math.min(durationFrames - 1, 45)],
    ["t02_mid", Math.floor(durationFrames / 2)],
    ["t03_final", Math.max(0, durationFrames - 2)],
  ];

  for (const [name, frame] of checkpoints) {
    await renderStill({
      composition,
      serveUrl,
      output: path.join(dir, \`\${name}.png\`),
      inputProps,
      frame,
      imageFormat: "png",
    });
  }

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: path.join(dir, \`\${test.id}.mp4\`),
    inputProps,
    concurrency: 2,
  });

  fs.writeFileSync(path.join(dir, "input.json"), JSON.stringify(test, null, 2));
}

for (const test of stress) {
  const { composition, inputProps, durationFrames } = await makeComposition(test);
  const dir = path.join(OUT, "stress");
  fs.mkdirSync(dir, { recursive: true });

  for (const [name, frame] of [
    ["t01_1.5s", Math.min(durationFrames - 1, 45)],
    ["t02_final", Math.max(0, durationFrames - 2)],
  ]) {
    await renderStill({
      composition,
      serveUrl,
      output: path.join(dir, \`\${test.id}_\${name}.png\`),
      inputProps,
      frame,
      imageFormat: "png",
    });
  }
}

console.log(\`Rendered \${canonical.length} canonical cards with MP4s/checkpoints and \${stress.length} stress layouts to \${OUT}\`);
