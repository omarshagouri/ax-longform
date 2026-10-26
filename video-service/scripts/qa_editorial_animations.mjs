import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {bundle} from "@remotion/bundler";
import {renderMedia,renderStill,selectComposition} from "@remotion/renderer";

// Reuses the old AXAnimationPreview QA workflow exactly: canonical MP4,
// 5 timed PNG checkpoints, stress layout stills and saved input.json.
// Run ONE animation per execution: node scripts/qa_editorial_animations.mjs VA-LF-015
// Never claims a generated render was actually visually reviewed.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const out=path.join(root,"card-testing","editorial-animations-V1");
const specs=[
 {id:"VA-LF-015",title:"Two independent battery aging clocks",durationFrames:180,values:{
  title:"Two clocks run inside every EV battery",cycleLabel:"Usage cycles",calendarLabel:"Calendar time",
  takeaway:"Parking can stop cycles — it cannot stop calendar time",
  footer:"SCHEMATIC — no claim of measured clock rates"},stress:{title:"Why calendar aging can matter even if the car is rarely charged or driven",calendarLabel:"Elapsed years in service"}},
 {id:"VA-LF-016",title:"Slow reactions during battery storage",durationFrames:180,values:{
  title:"Cell chemistry keeps reacting while parked",anodeLabel:"ANODE",cathodeLabel:"CATHODE",
  reactionLabel:"Simplified side reactions at interfaces",
  footer:"SCHEMATIC CELL CROSS-SECTION — not literal atomic motion"},stress:{title:"Battery cell side reactions may continue during extended parking or low current conditions"}},
 {id:"VA-LF-017",title:"Storage temperature times state of charge",durationFrames:180,values:{
  title:"Temperature and stored charge affect aging stress",
  xAxisLabel:"STORED CHARGE",yAxisLabel:"TEMPERATURE",
  footer:"QUALITATIVE STRESS MAP — no quantitative storage prescription"},stress:{title:"How elevated temperature and high stored state of charge interact with time in storage"}},
 {id:"VA-LF-018",title:"Geotab fleet climate association",durationFrames:180,values:{
  title:"What the large EV fleet actually showed",vehicles:22700,models:21,difference:.4,
  source:"GEOTAB — CHECK STUDY VERSION AND YEAR",
  footer:"Observed faster annual decline in hot versus mild climates; not isolated calendar aging"},
  stress:{title:"Climate-associated battery-health difference across vehicle models and usage patterns"}},
 {id:"VA-LF-019",title:"Dashboard estimate is not state of health",durationFrames:180,values:{
  title:"The range estimate moves; capacity health is different",
  rangeStart:83,rangeEnd:57,healthReference:80,
  footer:"DEMONSTRATION INDEXES ONLY — not actual miles, range estimate or battery SOH"},stress:{title:"A cold morning may change the displayed estimate without proving irreversible capacity loss"}},
 {id:"VA-LF-020",title:"Temporary range versus persistent loss",durationFrames:180,values:{
  title:"One cold reading is not a degradation trend",
  topLabel:"DAILY RANGE",bottomLabel:"LONG-TERM HEALTH",
  footer:"ILLUSTRATIVE PATHS — not observations or calibrated degradation rates"},stress:{title:"Short term dashboard range fluctuations differ from persistent loss over comparable conditions"}},
];
const requested=process.argv[2];const spec=specs.find(x=>x.id===requested);
if(!spec)throw new Error("Specify one ID: "+specs.map(x=>x.id).join(", "));
const dst=path.join(out,spec.id);
fs.mkdirSync(dst,{recursive:true});
const bundled=await bundle({entryPoint:path.join(root,"src","index.ts"),webpackOverride:c=>c});
const props={animationId:spec.id,values:spec.values,durationFrames:spec.durationFrames};
const composition=await selectComposition({serveUrl:bundled,id:"AXAnimationPreview",inputProps:props});
if(composition.width!==1920||composition.height!==1080||composition.fps!==30||composition.durationInFrames!==spec.durationFrames)
 throw new Error("Wrong preview geometry or duration for "+spec.id);
for(const [name,frame] of [["t00_start",15],["t01_1.5s",45],["t02_3.0s",90],["t03_4.5s",135],["t04_final",178]]){
 await renderStill({composition,serveUrl:bundled,inputProps:props,output:path.join(dst,name+".png"),frame,imageFormat:"png"});
}
await renderMedia({composition,serveUrl:bundled,inputProps:props,codec:"h264",outputLocation:path.join(dst,spec.id+"_V1.mp4"),concurrency:2});
const stressProps={...props,values:{...spec.values,...spec.stress}};
const stressComp=await selectComposition({serveUrl:bundled,id:"AXAnimationPreview",inputProps:stressProps});
for(const [name,frame] of [["stress_1.5s",45],["stress_final",178]]){
 await renderStill({composition:stressComp,serveUrl:bundled,inputProps:stressProps,output:path.join(dst,name+".png"),frame,imageFormat:"png"});
}
fs.writeFileSync(path.join(dst,"input.json"),JSON.stringify({spec,canonicalProps:props,stressProps,checkpoints:[15,45,90,135,178]},null,2));
fs.writeFileSync(path.join(dst,"review-checklist.txt"),[
 "ANIMATION "+spec.id,
 "REVIEWER MUST WATCH ENTIRE MP4 AND CHECK ALL FIVE PNG FRAMES.",
 "1. Brand consistency: navy/teal/heat; 1920x1080, 30fps; mobile readable.",
 "2. Meaningful continuous motion through entire clip, not decorative blinking.",
 "3. Science / provenance: no pseudo-observations or false measured rates.",
 "4. Text does not overflow under stress props; no ellipsized important source.",
 "5. First frame, 1.5s, 3.0s, 4.5s, final frame are visually distinct.",
 "6. Editor confirms this visual performs a different job from VA-LF-013.",
 "7. DO NOT ADD TO READY CATALOG until actual watch/review and renderer deploy."
 ].join("\n")+"\n");
console.log("Rendered "+spec.id+" individual 1080p MP4 + five stills + two stress stills in "+dst);
