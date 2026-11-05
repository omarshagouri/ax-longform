import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source=readFileSync(new URL("../Animations/continuous.tsx",import.meta.url),"utf8");
const begin=source.indexOf("export const VALF009ThrottleGate:");
const end=source.indexOf("export const VALF010ThermalField:",begin);
const va009=begin>=0&&end>begin?source.slice(begin,end):"";
const timing=readFileSync(new URL("../src/LFAnimationTiming.tsx",import.meta.url),"utf8");
const CONTRACT="VA009_SEQUENTIAL_PLAN_PACED_V4";
const requireToken=t=>assert.ok(va009.includes(t),CONTRACT+": missing "+t);

test("VA009 is the one registered control-gate component",()=>{
 assert.ok(va009.length>3000);
 assert.match(source,/"VA-LF-009":\s*\{component:VALF009ThrottleGate/);
});
test("VA009 reveals three boxes in order before lines and then dots",()=>{
 requireToken("box1=show(.04,.20)");
 requireToken("box2=show(.21,.37)");
 requireToken("box3=show(.38,.54)");
 requireToken("lineReveal=show(.58,.75)");
 requireToken("dotReveal=show(.79,.90)");
 requireToken("opacity={box1}");
 requireToken("opacity:box2");
 requireToken("opacity={box3}");
 requireToken("opacity={lineReveal}");
 requireToken("opacity={dotReveal}");
 assert.doesNotMatch(va009,/seconds\s*>=|useLFRevealProgress\s*\(/);
});
test("VA009 is paced by the actual Visual_Plan beat and frozen for one second",()=>{
 requireToken("useLFStagedHold(1)");
 requireToken("flowProgress=clamp01((progress-.79)/.21)");
 assert.match(timing,/context\.durationFrames,\s*fps,\s*holdSeconds/);
 assert.match(timing,/Math\.round\(fps \* holdSeconds\)/);
 assert.match(timing,/heldFrame\s*=\s*Math\.min\(Math\.max\(0,\s*frame\),\s*activeLastFrame\)/);
 assert.doesNotMatch(timing,/"VA-LF-009"\s*:\s*\d+/);
 assert.doesNotMatch(va009,/\buseLFRealFrame\s*\(/);
});
