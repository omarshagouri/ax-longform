import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(__dirname,"..");
const ENTRY=path.join(ROOT,"src","index.ts");
const OUT=path.join(ROOT,"qa-chapter-card");
fs.rmSync(OUT,{recursive:true,force:true}); fs.mkdirSync(OUT,{recursive:true});

const durationFrames=90;
const manifest={
  video_id:"QA-VC-LF-018",
  fps:30,width:1920,height:1080,audio:[],
  timeline:[{
    beat:1,component:"VC-LF-018",
    props:{CHAPTER_NUM:"3",TITLE:"When the Switch Went Down"},
    src:"",startFrame:0,durationFrames,track:"card"
  }]
};
const inputProps={manifest};
const serveUrl=await bundle({entryPoint:ENTRY,webpackOverride:c=>c});
const comp=await selectComposition({serveUrl,id:"AXLongForm",inputProps});

for(const [name,frame] of [["t00_0.5s",15],["t01_1.2s",36],["t02_final",88]]){
  await renderStill({composition:comp,serveUrl,output:path.join(OUT,name+".png"),inputProps,frame,imageFormat:"png"});
}
await renderMedia({composition:comp,serveUrl,codec:"h264",outputLocation:path.join(OUT,"VC-LF-018.mp4"),inputProps,concurrency:2});
console.log("Rendered chapter-card QA");
