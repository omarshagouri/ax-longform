import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const policy=JSON.parse(readFileSync(new URL("./technical-gates.v1.json",import.meta.url),"utf8"));
const original=readFileSync(new URL("./baselines/long-form-visual-planning-2026-10-26.txt",import.meta.url),"utf8");
test("exact archived automation prompt retained",()=>{
 assert.equal(original.length,11166);
 assert.ok(original.startsWith("AMPCOREX LONG-FORM VISUAL AGENT"));
 assert.ok(original.includes("VISUAL-ONLY rubric"));
 assert.ok(original.includes("PHASE 1 — STAGE A"));
 assert.ok(original.includes("PHASE 3 — STAGE E"));
});
test("candidate policy can NEVER be mistaken for live configuration",()=>{
 assert.equal(policy.status,"DRAFT_INACTIVE");
 assert.equal(policy.loaded_by_production,false);
 assert.equal(policy.production_contract.read_only_policy_draft,true);
 assert.equal(policy.production_contract.promotion_allowed_from_draft,false);
 assert.equal(policy.activation_requirements.length,5);
});
test("visual-only rubric remains the exact six 100-point categories",()=>{
 assert.deepEqual(policy.editorial.weights,{relevance:25,pacing:25,flow:20,variety:10,readability:10,payoff:10});
 assert.equal(Object.values(policy.editorial.weights).reduce((a,b)=>a+b,0),100);
 assert.equal(policy.editorial.approval_minimum,95);
 assert.equal(policy.editorial.no_auto_generated_score,true);
});
test("technical gates are complete, numbered, unique and explain enforcement",()=>{
 const gates=policy.hard_gates;
 assert.equal(gates.length,18);
 assert.equal(new Set(gates.map(g=>g.id)).size,gates.length);
 for(let i=1;i<=gates.length;i++) assert.equal(gates[i-1].id,"T"+String(i).padStart(2,"0"));
 assert.ok(gates.every(g=>g.scope&&g.summary&&g.current_enforcement));
 assert.ok(gates.some(g=>g.scope==="draft_new"&&/not wired/i.test(g.current_enforcement)));
});
test("legacy renderer invariants cannot silently be relaxed",()=>{
 const p=policy.production_contract;
 assert.equal(p.fps,30);assert.equal(p.visual_plan_columns,"A:G");
 assert.equal(p.first_beat_asset,"VC-LF-018");assert.equal(p.first_beat_frames,60);
 assert.equal(p.native_footage_per_chapter,2);assert.equal(p.technical_parts_per_chapter,2);
 assert.equal(p.max_part_seconds,55);assert.equal(p.min_part_seconds,8);
});
