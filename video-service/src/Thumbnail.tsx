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
};

export const Thumbnail: React.FC<ThumbnailProps> = ({
  backgroundSrc, logoSrc = "", series = "AMPCOREX BRIEF", headline, subhead = "",
  layout = "hero", highlightPhrases = [], overlayStrength = 0.75,
  vignetteStrength = 0.72, backgroundBrightness = 1.07, showSubhead = false,
}) => {
  const strength = Math.min(1, Math.max(0, Number(overlayStrength) || 0));
  const brightness = Math.min(1.35, Math.max(0.8, Number(backgroundBrightness) || 1.07));
  const vignetteOpacity = Math.min(1, Math.max(0, Number(vignetteStrength) || 0));
  // Radial falloff frames the whole image while keeping the right-side hero subject bright.
  // The independent left-to-right gradient remains dedicated to headline readability.
  const vignette = `radial-gradient(ellipse 82% 88% at ${layout === "comparison" ? "61%" : "68%"} 48%, rgba(4,10,20,0) 0%, rgba(4,10,20,0) 34%, rgba(4,10,20,${(vignetteOpacity * 0.14).toFixed(3)}) 59%, rgba(4,10,20,${(vignetteOpacity * 0.45).toFixed(3)}) 78%, rgba(4,10,20,${(vignetteOpacity * 0.90).toFixed(3)}) 100%)`;
  const gradient = `linear-gradient(90deg, rgba(5,14,26,${(strength * 0.84).toFixed(3)}) 0%, rgba(5,14,26,${(strength * 0.68).toFixed(3)}) 32%, rgba(5,14,26,${(strength * 0.23).toFixed(3)}) 58%, rgba(5,14,26,0.015) 83%, rgba(5,14,26,0) 100%)`;
  const len = String(headline || "").length;
  const headlineSize = len > 96 ? 47 : len > 76 ? 54 : len > 60 ? 62 : len > 43 ? 70 : len > 27 ? 77 : 85;
  const textWidth = layout === "comparison" ? 550 : 610;
  const highlightWords = new Set(highlightPhrases.flatMap((p) => String(p).toUpperCase().split(/\s+/).map((w) => w.replace(/[^A-Z0-9]/g, ""))));
  return (
    <AbsoluteFill style={{ backgroundColor: theme.navy, fontFamily: theme.font, overflow: "hidden" }}>
      {backgroundSrc ? <Img src={backgroundSrc} style={{ width:"100%",height:"100%",objectFit:"cover",transform:"scale(1.015)",filter:`brightness(${brightness}) contrast(1.06) saturate(1.08)` }} /> : null}
      <AbsoluteFill style={{ background: vignette, pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: gradient, pointerEvents: "none" }} />
      <div style={{position:"absolute",left:70,top:50,fontSize:18,color:"#CFDCE7",fontWeight:600,letterSpacing:2.4,textTransform:"uppercase",textShadow:"0 2px 8px rgba(0,0,0,0.7)"}}>{series}</div>
      <div style={{position:"absolute",left:68,top:layout==="comparison"?160:185,width:textWidth,height:425,display:"flex",flexDirection:"column",justifyContent:"center"}}>
        <div style={{fontSize:headlineSize,fontWeight:700,color:theme.white,letterSpacing:-2.4,lineHeight:0.96,overflowWrap:"break-word",textShadow:"0 3px 16px rgba(0,0,0,0.66), 0 1px 2px rgba(0,0,0,0.84)"}}>
          {String(headline || "").split(/(\s+)/).map((token,i) => {
            const key=token.toUpperCase().replace(/[^A-Z0-9]/g,"");
            return <span key={i} style={{color:key && highlightWords.has(key)?theme.teal:theme.white}}>{token}</span>;
          })}
        </div>
        {showSubhead && subhead ? <div style={{marginTop:15,fontSize:25,lineHeight:1.12,fontWeight:500,color:"#F1F6FB",textShadow:"0 2px 8px rgba(0,0,0,0.75)"}}>{subhead}</div>:null}
      </div>
      {logoSrc ? <Img src={logoSrc} style={{position:"absolute",left:69,bottom:47,height:43,width:"auto",maxWidth:240,objectFit:"contain",filter:"drop-shadow(0 2px 8px rgba(0,0,0,0.5))"}} /> : null}
    </AbsoluteFill>
  );
};
