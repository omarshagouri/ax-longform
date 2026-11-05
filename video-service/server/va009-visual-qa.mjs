// Real Remotion frame QA. Fails the Cloud Run image build if VA-LF-009
// renders an invisible middle or output node or starts packets too early.
// This is intentionally NOT a source-text-only test.
import { bundle } from "@remotion/bundler";
import { selectComposition, renderStill } from "@remotion/renderer";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const dir=mkdtempSync(path.join(os.tmpdir(),"va009-pixels-"));
const w=1920,h=1080;
const inputProps={
  animationId:"VA-LF-009",
  values:{
    title:"The Pack Sets A Limit",
    inputLabel:"Station capability",
    gateLabel:"Pack request",
    outputLabel:"Allowed charge",
    inputRate:85,
    outputRate:38,
    footer:"Illustrative relative rates; not measured charging power"
  },
  durationFrames:165
};
function decoded(pathname){
  const ff=spawnSync("ffmpeg",["-v","error","-i",pathname,"-frames:v","1",
    "-f","rawvideo","-pix_fmt","rgb24","pipe:1"],
    {maxBuffer:w*h*3+1024*1024});
  if(ff.status!==0||ff.stdout.length!==w*h*3)
    throw Error("VA009 raster decode failed: "+String(ff.stderr||"").slice(0,300));
  return ff.stdout;
}
function countWhite(raw,[x1,y1,x2,y2]){
  let n=0;
  for(let y=y1;y<y2;y+=2)for(let x=x1;x<x2;x+=2){
    const k=(y*w+x)*3;
    if(raw[k]>190&&raw[k+1]>190&&raw[k+2]>190)n++;
  }
  return n;
}
function countNewTeal(a,b,[x1,y1,x2,y2]){
  let n=0;
  for(let y=y1;y<y2;y++)for(let x=x1;x<x2;x++){
    const k=(y*w+x)*3,changed=Math.abs(b[k]-a[k])+Math.abs(b[k+1]-a[k+1])+Math.abs(b[k+2]-a[k+2]);
    if(changed>90 && b[k]<100 && b[k+1]>135 && b[k+2]<220)n++;
  }
  return n;
}
try {
  const serveUrl=await bundle({entryPoint:path.join(root,"src","index.ts")});
  const composition=await selectComposition({serveUrl,id:"AXAnimationPreview",inputProps});
  if(composition.width!==w||composition.height!==h||composition.fps!==30)
    throw Error("VA009 canvas or fps differs from production");
  const early=path.join(dir,"va009-frame-0.png");
  const late=path.join(dir,"va009-frame-60.png");
  for(const [frame,output] of [[0,early],[60,late]])
    await renderStill({composition,serveUrl,inputProps,frame,output,imageFormat:"png"});
  const first=decoded(early),after=decoded(late);
  // Rectangles are measured in the actual 1920x1080 output, not CSS source:
  // Input x225..525, gate x851..1069, output x1395..1695.
  const regions={
    input:[240,568,514,695],
    gate:[865,526,1055,740],
    output:[1410,568,1680,695]
  };
  const counts=Object.fromEntries(Object.entries(regions).map(([name,roi])=>[name,countWhite(first,roi)]));
  for(const [name,n] of Object.entries(counts))
    if(n<75)throw Error("VA009 frame 0 is missing visible "+name+" node; white pixels="+n);
  const newlyMoving=countNewTeal(first,after,[530,619,840,648]);
  if(newlyMoving<60)throw Error("VA009 frame 60 has no moving request packets: "+newlyMoving);
  console.log("PASS VA009 rendered-pixel QA: all 3 boxes visible at frame 0; packets after request phase",{
    fps:composition.fps,earlyVisibleWhitePixels:counts,lateMovingTealPixels:newlyMoving
  });
} finally {
  rmSync(dir,{recursive:true,force:true});
}
