import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../Animations/continuous.tsx", import.meta.url), "utf8");
const start = source.indexOf("export const VALF009ThrottleGate:");
const end = source.indexOf("export const VALF010ThermalField:", start);
const gate = start>=0 && end>start ? source.slice(start,end) : "";
const CONTRACT = "VA009_TOPOLOGY_FIRST_V3";
const requireToken = token => assert.ok(gate.includes(token), CONTRACT+": missing "+token);

test("VA009 has exactly one canonical registered renderer",()=>{
 assert.ok(gate.length>4000);
 assert.match(source, /"VA-LF-009":\s*\{component:VALF009ThrottleGate/);
});
test("VA009 draws complete input, gate and output from its first frame",()=>{
 requireToken("<NodeBox label={inputLabel}");
 requireToken("{gateLabel}");
 requireToken("<NodeBox label={outputLabel}");
 requireToken("width:W,height:620,opacity:1");
 requireToken("REQUEST {Math.round(requestPct)}%");
 requireToken("ALLOWED {Math.round(allowedPct)}%");
 assert.doesNotMatch(gate,/useLFRevealProgress\s*\(/);
 assert.doesNotMatch(gate,/useLFPacedFrame\s*\(/);
 assert.doesNotMatch(gate,/staged\s*\(\s*progress\s*,/);
});
test("VA009 gates packet movement behind all labelled nodes",()=>{
 requireToken("const frame=useLFRealFrame()");
 requireToken("incomingVisible=seconds>=1.20");
 requireToken("outgoingVisible=seconds>=1.60");
 requireToken("{incomingVisible ? [...Array(inCount)]");
 requireToken("{outgoingVisible ? [...Array(outCount)]");
 requireToken("fillPct=allowedPct*fromTo(.85,1.20)");
 requireToken("x1={inputEnd} y1={cy} x2={gateX}");
 requireToken("x1={gateEnd} y1={cy} x2={outputX}");
});
