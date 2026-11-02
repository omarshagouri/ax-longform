import React from "react";
import { AbsoluteFill, Img } from "remotion";
import { theme } from "./theme";

export type ThumbnailProps = {
  backgroundSrc: string;
  logoSrc?: string;
  series?: string;
  headline: string;
  subhead?: string;
  layout?: "hero" | "comparison" | "problem";
  highlightPhrases?: string[];
  overlayStrength?: number;
  vignetteStrength?: number;
  backgroundBrightness?: number;
  showSubhead?: boolean;
  comparisonLeftLabel?: string;
  comparisonLeftSub?: string;
  comparisonCenterLabel?: string;
  comparisonRightLabel?: string;
};

export const Thumbnail: React.FC<ThumbnailProps> = ({
  backgroundSrc, logoSrc = "", series = "AMPCOREX BRIEF", headline, subhead = "",
  layout = "hero", highlightPhrases = [], overlayStrength = 0.78,
  vignetteStrength = 0.84, backgroundBrightness = 1.08, showSubhead = false,
  comparisonLeftLabel = "", comparisonLeftSub = "", comparisonCenterLabel = "VS", comparisonRightLabel = "",
}) => {
  const strength = Math.min(1, Math.max(0, Number(overlayStrength) || 0));
  const isReference = String(headline || "").trim().replace(/\s+/g," ").replace(/[?!.]$/, "").toUpperCase() === "ONE EV ONE MODEL TWO CHEMISTRIES";
  const displayHeadline = isReference ? "ONE EV\nONE MODEL\nTWO CHEMISTRIES" : String(headline || "");
  const compareLabels = layout === "comparison" && !!comparisonLeftLabel && !!comparisonRightLabel;
  const brightness = Math.min(1.35, Math.max(0.8, Number(backgroundBrightness) || 1.08));
  const vignetteOpacity = Math.min(1, Math.max(0, Number(vignetteStrength) || 0));
  // Radial falloff frames the whole image while keeping the right-side hero subject bright.
  // The independent left-to-right gradient remains dedicated to headline readability.
  const vignette = "radial-gradient(ellipse 83% 85% at "+(layout==="comparison"?"65%":"69%")+" 45%, rgba(2,8,19,0) 0%, rgba(2,8,19,0) 34%, rgba(2,8,19,"+(vignetteOpacity*.12).toFixed(3)+") 58%, rgba(2,8,19,"+(vignetteOpacity*.5).toFixed(3)+") 83%, rgba(2,8,19,"+(vignetteOpacity*.78).toFixed(3)+") 100%)";
  const floorShade = "linear-gradient(0deg, rgba(3,14,32,"+(vignetteOpacity*.68).toFixed(3)+") 0%, rgba(3,14,32,"+(vignetteOpacity*.15).toFixed(3)+") 20%, transparent 46%)";
  const gradient = "linear-gradient(90deg, rgba(3,14,32,"+(strength*1).toFixed(3)+") 0%, rgba(3,14,32,"+(strength*.99).toFixed(3)+") 27%, rgba(3,14,32,"+(strength*.94).toFixed(3)+") 36%, rgba(3,14,32,"+(strength*.54).toFixed(3)+") 47%, rgba(3,14,32,"+(strength*.15).toFixed(3)+") 59%, rgba(3,14,32,0) 73%)";
  const len = String(headline || "").length;
  const headlineSize = isReference ? 59 : len > 96 ? 43 : len > 76 ? 49 : len > 60 ? 56 : len > 43 ? 65 : len > 27 ? 74 : 82;
  const textWidth = isReference ? 625 : layout === "comparison" ? 580 : 620;
  const highlightWords = new Set(highlightPhrases.flatMap((p) => String(p).toUpperCase().split(/\s+/).map((w) => w.replace(/[^A-Z0-9]/g, ""))));
  return (
    <AbsoluteFill style={{ backgroundColor: theme.navy, fontFamily: theme.font, overflow: "hidden" }}>
      {backgroundSrc ? <Img src={backgroundSrc} style={{ width:"100%",height:"100%",objectFit:"cover",transform:"scale(1.015)",filter:`brightness(${brightness}) contrast(1.06) saturate(1.08)` }} /> : null}
      <AbsoluteFill style={{ background: vignette, pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: floorShade, pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: gradient, pointerEvents: "none" }} />
      <AbsoluteFill style={{pointerEvents:"none",width:560}}>
        <div style={{position:"absolute",left:70,top:274,width:260,height:184,backgroundImage:"radial-gradient(rgba(0,212,170,0.22) 1px, transparent 1px)",backgroundSize:"11px 11px",opacity:.45,maskImage:"linear-gradient(90deg, transparent, black 35%, transparent)"}}/>
        <div style={{position:"absolute",left:313,top:71,width:125,height:95,borderTop:"1px solid rgba(0,212,170,.2)",borderRight:"1px solid rgba(0,212,170,.1)",transform:"skewY(28deg)"}}/>
        <div style={{position:"absolute",left:467,top:96,width:17,height:17,border:"1px solid rgba(0,212,170,.52)"}}/>
      </AbsoluteFill>
      <div style={{position:"absolute",left:90,top:132,fontSize:27,color:"#BFCBDC",fontWeight:500,letterSpacing:4.3,textTransform:"uppercase",textShadow:"0 2px 8px rgba(0,0,0,0.7)"}}>{series}</div>
      <div style={{position:"absolute",left:isReference?23:52,top:185,width:textWidth,height:310,display:"flex",flexDirection:"column",justifyContent:"center"}}>
        <div style={{fontSize:headlineSize,fontWeight:700,color:theme.white,letterSpacing:-1.9,lineHeight:1.03,overflowWrap:"break-word",whiteSpace:isReference?"pre-line":"normal",textShadow:"0 3px 16px rgba(0,0,0,0.66), 0 1px 2px rgba(0,0,0,0.84)"}}>
          {displayHeadline.split(/(\s+)/).map((token,i) => {
            const key=token.toUpperCase().replace(/[^A-Z0-9]/g,"");
            const teal = isReference ? [2,4,10].includes(i) : !!(key && highlightWords.has(key));
            return <span key={i} style={{color:teal?theme.teal:theme.white}}>{token}</span>;
          })}
        </div>
        {showSubhead && subhead ? <div style={{marginTop:15,fontSize:25,lineHeight:1.12,fontWeight:500,color:"#F1F6FB",textShadow:"0 2px 8px rgba(0,0,0,0.75)"}}>{subhead}</div>:null}
      </div>
      {logoSrc ? <Img src={logoSrc} style={{position:"absolute",left:86,bottom:55,height:80,width:"auto",maxWidth:295,objectFit:"contain",filter:"drop-shadow(0 2px 8px rgba(0,0,0,0.5))"}} /> : null}
      {compareLabels ? <>
        <div style={{position:"absolute",left:584,bottom:83,width:200,textAlign:"center",fontWeight:700,fontSize:comparisonLeftLabel.length>7?45:61,color:theme.teal,textShadow:"0 3px 13px #061326"}}>
          {comparisonLeftLabel}{comparisonLeftSub ? <div style={{fontSize:26,marginTop:-2}}>{comparisonLeftSub}</div> : null}
        </div>
        <div style={{position:"absolute",left:836,bottom:93,width:95,textAlign:"center",fontSize:48,fontWeight:700,color:theme.white,textShadow:"0 3px 13px #061326"}}>{comparisonCenterLabel}</div>
        <div style={{position:"absolute",left:1003,bottom:83,width:195,textAlign:"center",fontWeight:700,fontSize:comparisonRightLabel.length>7?45:61,color:theme.teal,textShadow:"0 3px 13px #061326"}}>{comparisonRightLabel}</div>
      </> : null}
    </AbsoluteFill>
  );
};
