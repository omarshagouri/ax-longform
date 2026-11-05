// Real Remotion pixel QA for VA-LF-009.
// Proves box 1 -> box 2 -> box 3 -> lines -> dots -> exact 1-second freeze,
// using both live LF006 Visual_Plan durations: 5.5s and 6.0s at 30 fps.
import { bundle } from "@remotion/bundler";
import { selectComposition, renderStill } from "@remotion/renderer";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const temp=mkdtempSync(path.join(os.tmpdir(),"va009-stage-qa-"));
const width=1920,height=1080,fps=30;
const values={
  title:"The Pack Sets A Limit",
  inputLabel:"Station capability",
  gateLabel:"Pack request",
  outputLabel:"Allowed charge",
  inputRate:85,outputRate:38,
  footer:"Illustrative relative rates; not measured charging power"
};
const boxes={
  first:[240,568,515,700],
  second:[865,525,1055,740],
  third:[1410,568,1680,700]
};
const lines=[
  [540,629,835,638],
  [1080,629,1385,638]
];
function decode(png) {
  const proc=spawnSync("ffmpeg",["-v","error","-i",png,"-frames:v","1",
    "-f","rawvideo","-pix_fmt","rgb24","pipe:1"],
    {maxBuffer:width*height*3+1024*1024});
  if(proc.status!==0||proc.stdout.length!==width*height*3)
    throw Error("VA009 frame decode failed: "+String(proc.stderr||"").slice(0,300));
  return proc.stdout;
}
function whitePixels(rgb,area) {
  const [x1,y1,x2,y2]=area;
  let count=0;
  for(let y=y1;y<y2;y+=2)for(let x=x1;x<x2;x+=2) {
    const k=(y*width+x)*3;
    if(rgb[k]>185&&rgb[k+1]>185&&rgb[k+2]>185)count++;
  }
  return count;
}
function changedPixels(a,b,area) {
  let n=0;
  const [x1,y1,x2,y2]=area;
  for(let y=y1;y<y2;y++)for(let x=x1;x<x2;x++){
    const i=(y*width+x)*3;
    const diff=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);
    if(diff>22)n++;
  }
  return n;
}
function dotPixels(rgb,area) {
  let n=0;
  const [x1,y1,x2,y2]=area;
  for(let y=y1;y<y2;y++)for(let x=x1;x<x2;x++){
    const k=(y*width+x)*3, r=rgb[k],g=rgb[k+1],b=rgb[k+2];
    if((r<100&&g>150&&g>b*.85)||(r>185&&g>90&&g<195&&b<125))n++;
  }
  return n;
}
const requireStage=(name,counts,present)=>{
  for(let i=0;i<3;i++){
    if(present[i] ? counts[i]<45 : counts[i]>16)
      throw Error(name+" expected "+JSON.stringify(present)+" boxes; actual white pixels "+JSON.stringify(counts));
  }
};
try{
  const serveUrl=await bundle({entryPoint:path.join(root,"src","index.ts")});
  for(const durationFrames of [165,180]) {
    const inputProps={animationId:"VA-LF-009",values,durationFrames};
    const composition=await selectComposition({serveUrl,id:"AXAnimationPreview",inputProps});
    if(composition.width!==width||composition.height!==height||composition.fps!==fps)
      throw Error("VA009 expected 1920x1080 at 30fps");
    const lastActive=durationFrames-fps-1;
    const phases=[
      ["first",Math.floor(lastActive*.20)],
      ["second",Math.floor(lastActive*.37)],
      ["third",Math.floor(lastActive*.55)],
      ["lines",Math.floor(lastActive*.77)],
      ["dots",Math.floor(lastActive*.94)],
      ["holdStart",durationFrames-fps],
      ["holdEnd",durationFrames-1]
    ];
    const rgb={};
    for(const [name,frame] of phases){
      const file=path.join(temp,durationFrames+"-"+name+".png");
      await renderStill({composition,serveUrl,inputProps,frame,output:file,imageFormat:"png"});
      rgb[name]=decode(file);
    }
    const count=name=>Object.values(boxes).map(area=>whitePixels(rgb[name],area));
    requireStage(durationFrames+" first",count("first"),[true,false,false]);
    requireStage(durationFrames+" second",count("second"),[true,true,false]);
    requireStage(durationFrames+" third",count("third"),[true,true,true]);
    requireStage(durationFrames+" lines",count("lines"),[true,true,true]);
    requireStage(durationFrames+" dots",count("dots"),[true,true,true]);

    for(const region of lines){
      const change=changedPixels(rgb.third,rgb.lines,region);
      if(change<350)throw Error("VA009 connector absent after all boxes, changed pixels="+change);
    }
    const dots=dotPixels(rgb.dots,[540,617,840,649])
       +dotPixels(rgb.dots,[1080,617,1385,649]);
    if(dots<75)throw Error("VA009 moving dots did not appear AFTER lines: "+dots);
    if(!rgb.holdStart.equals(rgb.holdEnd))
      throw Error("VA009 last second is not a frozen identical frame at "+durationFrames+" frames");

    console.log("PASS VA009: "+durationFrames+" plan frames / "+(durationFrames/fps)+"s",
      {order:"box1>box2>box3>lines>dots",holdFrames:fps,dots});
  }
}finally{
  rmSync(temp,{recursive:true,force:true});
}
