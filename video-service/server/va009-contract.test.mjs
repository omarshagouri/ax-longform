import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../Animations/continuous.tsx", import.meta.url), "utf8");
const begin = src.indexOf("export const VALF009ThrottleGate:");
const end = src.indexOf("export const VALF010ThermalField:", begin);
const gate = begin >= 0 && end > begin ? src.slice(begin, end) : "";
const CONTRACT = "VA009_VISIBLE_FIRST_V2";

function needs(s) {
  assert.ok(gate.includes(s), CONTRACT + ": missing expected visual rule " + JSON.stringify(s));
}

test("VA009 actual frame clock, not the old full-beat reveal clock", () => {
  assert.ok(gate.length > 2000, CONTRACT + ": animation implementation not found");
  needs("const realFrame=useLFRealFrame()");
  assert.doesNotMatch(gate, /useLFRevealProgress\s*\(/);
  assert.doesNotMatch(gate, /useCurrentFrame\s*\(/);
  assert.doesNotMatch(gate, /staged\s*\(progress\s*,/);
});

test("VA009 all three labeled boxes visible at animation start", () => {
  needs("<NodeBox label={inputLabel}");
  needs("<NodeBox label={outputLabel}");
  needs("{gateLabel}");
  needs("REQUEST {Math.round(requestPct)}%");
  needs("ALLOWED {Math.round(allowedPct)}%");
  needs("height:620,opacity:1");
  assert.doesNotMatch(gate, /<NodeBox[^>]*opacity=\{/s);
  assert.match(src, /"VA-LF-009":\s*\{component:VALF009ThrottleGate/);
});

test("VA009 draw connections before starting moving dots", () => {
  needs("const inLine=reveal(.18,.50)");
  needs("const outLine=reveal(.56,.88)");
  needs("opacity={reveal(.66,.90)}");
  needs("opacity={reveal(1.14,1.40)}");
});
