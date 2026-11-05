import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { z } from "zod";
import { clampNumeric, clampInteger } from "../src/clampNumeric";
import { useLFPacedFrame as useCurrentFrame, useLFRealFrame, useLFRevealProgress } from "../src/LFAnimationTiming";
import { theme } from "../src/theme";

const C = {
  ...theme,
  surface: "#142440",
  line: "#24375A",
  slate: "#8CA0B8",
  heatDeep: "#FF4D4D",
};

type AnimEntry = {
  component: React.FC<any>;
  schema: z.ZodTypeAny;
  description: string;
  slots: string[];
  defaultDurationSec: number;
};

const clamp01 = (v:number) => Math.max(0, Math.min(1, v));
const ease = (v:number) => 1 - Math.pow(1 - clamp01(v), 3);
const staged = (p:number,start:number,end:number) => ease((p-start)/Math.max(.01,end-start));
const appear = (frame:number, fps:number, delay=0) => clamp01(spring({
  frame: Math.max(0, frame-delay), fps,
  config:{damping:19, stiffness:125, mass:.72}
}));
const loop01 = (frame:number, period:number, offset=0) => {
  const p = ((frame + offset) % period) / period;
  return p < 0 ? p + 1 : p;
};

const Title: React.FC<{title?:string;kicker:string}> = ({title,kicker}) => {
  const f=useCurrentFrame(); const {fps}=useVideoConfig(); const p=appear(f,fps);
  const size=(title||"").length>52?54:(title||"").length>38?60:66;
  return <div style={{position:"absolute",left:120,right:120,top:62,opacity:p,transform:`translateY(${(1-p)*15}px)`}}>
    <div style={{fontFamily:"Inter,Arial",fontSize:27,fontWeight:700,color:C.teal,letterSpacing:4.2,marginBottom:12}}>{kicker.toUpperCase()}</div>
    <div style={{fontFamily:"Space Grotesk,Arial",fontSize:size,fontWeight:700,color:C.white,lineHeight:1.05,letterSpacing:-1,maxWidth:1580}}>{title}</div>
  </div>;
};
const Footer:React.FC<{text?:string}> = ({text}) => text ? <div style={{position:"absolute",left:120,right:120,bottom:42,fontFamily:"Inter,Arial",fontSize:25,color:C.slate}}>{text}</div> : null;
const Panel:React.FC<{children:React.ReactNode;style?:React.CSSProperties}> = ({children,style}) => <div style={{background:"rgba(10,22,40,.72)",border:`2px solid ${C.line}`,borderRadius:28,boxShadow:"0 22px 70px rgba(0,0,0,.22)",...style}}>{children}</div>;

const packetStreamSchema=z.object({
  title:z.string().optional(),
  nodes:z.array(z.string()).min(2).max(5),
  flowLabel:z.string().optional(),
  intensity:clampNumeric(1, 5).default(3),
  footer:z.string().optional(),
});
const throttleSchema=z.object({
  title:z.string().optional(),
  inputLabel:z.string(),
  gateLabel:z.string(),
  outputLabel:z.string(),
  inputRate:clampNumeric(0, 100),
  outputRate:clampNumeric(0, 100),
  // Auto recognizes 0..1 fractional rates used by Visual_Plan, with explicit override.
  rateUnit:z.enum(["auto","fraction","percent"]).optional(),
  footer:z.string().optional(),
});
const thermalSchema=z.object({
  title:z.string().optional(),
  heatLevel:clampNumeric(0, 100).default(70),
  hotspotRow:clampInteger(0, 4).default(2),
  hotspotCol:clampInteger(0, 7).default(5),
  cooling:z.boolean().default(true),
  note:z.string().optional(),
  footer:z.string().optional(),
});
const calibrationSchema=z.object({
  title:z.string().optional(),
  displayedStart:clampNumeric(0, 100),
  displayedEnd:clampNumeric(0, 100),
  usablePct:clampNumeric(0, 100),
  displayedLabel:z.string().default("Displayed estimate"),
  usableLabel:z.string().default("Usable energy"),
  footer:z.string().optional(),
});
const dataDecisionSchema=z.object({
  title:z.string().optional(),
  sensors:z.array(z.string()).min(2).max(4),
  decisionLabel:z.string(),
  actionLabel:z.string(),
  footer:z.string().optional(),
});
const dynamicCompareSchema=z.object({
  title:z.string().optional(),
  leftLabel:z.string(),
  rightLabel:z.string(),
  leftValue:z.string(),
  rightValue:z.string(),
  leftIntensity:clampNumeric(0, 100),
  rightIntensity:clampNumeric(0, 100),
  metricLabel:z.string().optional(),
  footer:z.string().optional(),
});

const NodeBox:React.FC<{label:string;x:number;y:number;width:number;accent?:string;opacity?:number}> = ({label,x,y,width,accent=C.teal,opacity=1}) =>
  <div style={{position:"absolute",left:x,top:y,width,height:150,boxSizing:"border-box",border:`2px solid ${accent}88`,borderRadius:23,background:"rgba(20,36,64,.94)",display:"flex",alignItems:"center",justifyContent:"center",padding:"18px 20px",textAlign:"center",fontFamily:"Space Grotesk,Arial",fontSize:label.length>16?27:32,fontWeight:700,color:C.white,opacity}}>
    {label}
  </div>;

export const VALF008PacketStream:React.FC<any> = ({title,nodes,flowLabel,intensity,footer}) => {
  const progress=useLFRevealProgress(); const f=useCurrentFrame(); const real=useLFRealFrame(); const {fps}=useVideoConfig(); const p=appear(f,fps,6);
  const W=1610,left=155,inner=95,y=440,n=nodes.length,gap=n<=3?100:66,nodeW=Math.min(250,(W-190-gap*(n-1))/n);
  const xs=nodes.map((_:string,i:number)=>inner+i*(nodeW+gap));
  const x0=xs[0]+nodeW, x1=xs[n-1], span=Math.max(1,x1-x0);
  const count=Math.max(3,Math.min(8,Math.round(Number(intensity||3)+3)));
  const period=Math.round(fps*(2.8-Math.min(5,Number(intensity||3))*.25));
  return <AbsoluteFill>
    <Title title={title||"Energy moving through the system"} kicker="Live energy stream"/>
    <Panel style={{position:"absolute",left,top:285,width:W,height:620,opacity:p,transform:`translateY(${(1-p)*16}px)`}}>
      {flowLabel?<div style={{position:"absolute",left:80,right:80,top:46,textAlign:"center",fontFamily:"Inter,Arial",fontSize:29,fontWeight:650,color:C.slate,opacity:staged(progress,.13,.25)}}>{flowLabel}</div>:null}
      <svg width={W} height="620" style={{position:"absolute",inset:0}}>
        <line x1={x0} y1={y} x2={x1} y2={y} stroke={C.line} strokeWidth="10" strokeLinecap="round" opacity={staged(progress,.65,.77)}/>
        {[...Array(count)].map((_,i)=>{
          const q=loop01(real,period,Math.round(i*period/count));
          const x=x0+span*q;
          const glow=.55+.45*Math.sin(q*Math.PI);
          return <g key={i} opacity={staged(progress,.79,.92)}>
            <circle cx={x} cy={y} r={18} fill={C.teal} opacity={.14*glow}/>
            <circle cx={x} cy={y} r={8} fill={C.teal} opacity={.95}/>
          </g>;
        })}
      </svg>
      {nodes.map((node:string,i:number)=><NodeBox key={node+i} label={node} x={xs[i]} y={y-75} width={nodeW} accent={i===0||i===n-1?C.teal:C.slate} opacity={staged(progress,.23+i*.085,.34+i*.085)}/>)}
      <div style={{position:"absolute",left:100,right:100,bottom:48,textAlign:"center",fontFamily:"Inter,Arial",fontSize:27,fontWeight:750,color:C.teal,letterSpacing:.5,opacity:staged(progress,.89,.98)}}>CONTINUOUS ENERGY FLOW</div>
    </Panel>
    <Footer text={footer}/>
  </AbsoluteFill>;
};

/**
 * VA-LF-009. Real Visual_Plan beats use fractional rates (e.g. 0.85 / 0.38)
 * while older QA uses percentage rates (e.g. 100 / 42). Respect both formats.
 * rateUnit="percent" overrides auto-detection for genuine small percentages.
 */
/**
 * VA-LF-009 Control Gate. All meaningful information is visible from frame 0.
 * The older beat-wide LF reveal clock caused moving dots / footer to appear
 * while the gate and output boxes were invisible in 5–6 second scenes.
 * Keep structure stable, then animate just connections and packet flow
 * using actual 30fps frame time (never beat-normalized reveal progress).
 *
 * Accept rate inputs in either 0..1 or 0..100 form; explicit rateUnit wins.
 */
/**
 * VA-LF-009: deterministic, visible-first 30 fps control gate.
 * Same choreography as the working LF flow visuals, but the complete
 * topology (three labelled nodes, both connectors, request/allow values)
 * is shown on frame zero. No element reveal uses the beat-wide pacing
 * clock. The motion begins only AFTER the viewer sees the whole circuit:
 *  0.0s static topology; 0.4s request highlight; 0.9s gate response;
 *  1.2s inbound packets; 1.6s reduced outbound packets.
 * Every scene stays complete even if rendered at 4-6 seconds.
 */
export const VALF009ThrottleGate:React.FC<any> = ({
  title,inputLabel,gateLabel,outputLabel,inputRate,outputRate,rateUnit="auto",footer
}) => {
  const frame=useLFRealFrame();
  const {fps}=useVideoConfig();
  // All timing is local to the Remotion Sequence, in REAL frames.
  const seconds=frame/Math.max(1,fps);
  const fromTo=(begin:number,end:number)=>staged(seconds,begin,end);
  const W=1610,cy=348, inputX=70,inputW=300, gateX=696,gateW=218, outputX=1240,outputW=300;
  const inputEnd=inputX+inputW, gateEnd=gateX+gateW;
  const requestRaw=Number(inputRate), allowedRaw=Number(outputRate);
  const fraction=rateUnit==="fraction" || (rateUnit!=="percent" && requestRaw<=1 && allowedRaw<=1);
  const requestPct=Math.max(0,Math.min(100,requestRaw*(fraction?100:1)));
  const allowedPct=Math.max(0,Math.min(requestPct,allowedRaw*(fraction?100:1)));
  const requestGlow=fromTo(.35,.72);
  const fillPct=allowedPct*fromTo(.85,1.20);
  // Packets may NEVER precede the middle gate or output box.
  const incomingVisible=seconds>=1.20;
  const outgoingVisible=seconds>=1.60 && allowedPct>0;
  const loopFrames=Math.max(30,Math.round(fps*2.1));
  const inCount=requestPct>0?Math.max(2,Math.round(2+requestPct*.055)):0;
  const outCount=outgoingVisible?Math.max(1,Math.min(inCount,Math.round(inCount*allowedPct/Math.max(1,requestPct)))):0;
  const titleText=title||"The BMS controls charging power";
  const titleSize=titleText.length>52?54:titleText.length>38?60:66;
  const panelTop=285;

  return <AbsoluteFill>
    <div style={{position:"absolute",left:120,right:120,top:62}}>
      <div style={{fontFamily:"Inter,Arial",fontSize:27,fontWeight:700,color:C.teal,
        letterSpacing:4.2,marginBottom:12}}>CONTROL GATE</div>
      <div style={{fontFamily:"Space Grotesk,Arial",fontSize:titleSize,fontWeight:700,
        color:C.white,lineHeight:1.05,letterSpacing:-1,maxWidth:1580}}>{titleText}</div>
    </div>

    <Panel style={{position:"absolute",left:155,top:panelTop,width:W,height:620,opacity:1}}>
      {/* Topology is static. Draw connectors behind ALL three nodes. */}
      <svg width={W} height={620} viewBox={"0 0 "+W+" 620"}
        style={{position:"absolute",left:0,top:0,pointerEvents:"none"}}>
        <line x1={inputEnd} y1={cy} x2={gateX} y2={cy}
          stroke={C.line} strokeWidth={9} strokeLinecap="round"/>
        <line x1={gateEnd} y1={cy} x2={outputX} y2={cy}
          stroke={C.line} strokeWidth={9} strokeLinecap="round"/>
        {/* Inbound request; dots travel only on the connector, never through node labels. */}
        {incomingVisible ? [...Array(inCount)].map((_,i)=>{
          const q=loop01(frame-36,loopFrames,Math.round(i*loopFrames/inCount));
          return <circle key={"request-"+i} cx={inputEnd+(gateX-inputEnd)*q}
            cy={cy} r={8} fill={C.teal} opacity={.95}/>;
        }) : null}
        {/* Accepted output; lower packet density is tied to allowed request. */}
        {outgoingVisible ? [...Array(outCount)].map((_,i)=>{
          const q=loop01(frame-48,loopFrames,Math.round(i*loopFrames/outCount));
          return <circle key={"allowed-"+i} cx={gateEnd+(outputX-gateEnd)*q}
            cy={cy} r={8} fill={C.heat} opacity={.95}/>;
        }) : null}
      </svg>

      <div style={{position:"absolute",left:410,top:64,width:240,textAlign:"center",
        fontFamily:"Inter,Arial",fontSize:27,fontWeight:750,color:C.teal}}>
        REQUEST {Math.round(requestPct)}%
      </div>
      <div style={{position:"absolute",left:954,top:64,width:240,textAlign:"center",
        fontFamily:"Inter,Arial",fontSize:27,fontWeight:750,color:C.heat}}>
        ALLOWED {Math.round(allowedPct)}%
      </div>

      <NodeBox label={inputLabel} x={inputX} y={cy-75} width={inputW} accent={C.teal}/>
      {/* Middle gate remains visible throughout: only its fill moves. */}
      <div style={{position:"absolute",left:gateX,top:cy-125,width:gateW,height:250,
        border:"2px solid "+C.heat+"AA",borderRadius:26,background:"rgba(20,36,64,.98)",
        boxSizing:"border-box",display:"flex",flexDirection:"column",alignItems:"center",
        justifyContent:"center",boxShadow:"0 0 "+Math.round(7+13*requestGlow)+"px "+C.heat+"33"}}>
        <div style={{fontFamily:"Space Grotesk,Arial",fontSize:28,fontWeight:700,
          color:C.white,textAlign:"center",padding:"0 16px",lineHeight:1.14}}>{gateLabel}</div>
        <div style={{marginTop:20,width:132,height:38,border:"2px solid "+C.slate,
          borderRadius:10,padding:5,boxSizing:"border-box",background:C.navy}}>
          <div style={{height:"100%",width:fillPct+"%",background:C.heat,
            borderRadius:4,boxShadow:"0 0 12px "+C.heat+"66"}}/>
        </div>
        <div style={{fontFamily:"Inter,Arial",fontSize:22,fontWeight:750,color:C.heat,marginTop:16}}>
          {Math.round(allowedPct)}% ALLOWED
        </div>
      </div>
      <NodeBox label={outputLabel} x={outputX} y={cy-75} width={outputW} accent={C.heat}/>

      <div style={{position:"absolute",left:90,right:90,bottom:43,textAlign:"center",
        fontFamily:"Inter,Arial",fontSize:25,color:C.slate}}>
        The BMS limits delivered power when operating conditions require it.
      </div>
    </Panel>
    {footer ? <Footer text={footer}/> : null}
  </AbsoluteFill>;
};

export const VALF010ThermalField:React.FC<any> = ({title,heatLevel,hotspotRow,hotspotCol,cooling,note,footer}) => {
  const progress=useLFRevealProgress(); const f=useCurrentFrame(); const real=useLFRealFrame(); const {fps}=useVideoConfig(); const p=appear(f,fps,6);
  const rows=5,cols=8,cellW=120,cellH=70,gap=12,startX=280,startY=180;
  const wave=loop01(real,Math.round(fps*3.2));
  const pulse=(Math.sin(real/fps*Math.PI*2*.75)+1)/2;
  return <AbsoluteFill>
    <Title title={title||"Heat moves through the pack"} kicker="Thermal map"/>
    <Panel style={{position:"absolute",left:155,top:285,width:1610,height:620,opacity:p}}>
      {note?<div style={{position:"absolute",left:100,right:100,top:45,textAlign:"center",fontFamily:"Inter,Arial",fontSize:28,fontWeight:650,color:C.slate}}>{note}</div>:null}
      {[...Array(rows)].flatMap((_,r)=>[...Array(cols)].map((__,c)=>{
        const d=Math.sqrt(Math.pow(r-hotspotRow,2)+Math.pow(c-hotspotCol,2));
        const influence=Math.max(0,1-d/4.2)*(Number(heatLevel)/100);
        const coolBand=cooling?Math.max(0,1-Math.abs((c/(cols-1))-wave)*4):0;
        const hot=clamp01(influence*(.72+.28*pulse)-coolBand*.35);
        const bg=hot>.55?C.heat:hot>.22?"#7B6558":C.surface;
        const border=hot>.45?C.heat:C.line;
        return <div key={r+"-"+c} style={{position:"absolute",left:startX+c*(cellW+gap),top:startY+r*(cellH+gap),width:cellW,height:cellH,border:`2px solid ${border}`,borderRadius:16,background:bg,boxShadow:hot>.45?`0 0 ${20+30*hot}px ${C.heat}44`:"none",transition:"none",opacity:.98*staged(progress,.20+(r*cols+c)/(rows*cols)*.48,.38+(r*cols+c)/(rows*cols)*.48)}}/>;
      }))}
      {cooling?<div style={{position:"absolute",left:startX+wave*((cols-1)*(cellW+gap))-25,top:startY-20,width:50,height:rows*(cellH+gap)-gap+40,background:"linear-gradient(90deg,rgba(77,166,255,0),rgba(77,166,255,.28),rgba(77,166,255,0))",opacity:staged(progress,.60,.79),filter:"blur(5px)",borderRadius:30}}/>:null}
      <div style={{position:"absolute",right:125,top:125,fontFamily:"Inter,Arial",fontSize:25,fontWeight:700,color:cooling?C.cold:C.heat}}>{cooling?"COOLING SWEEP ACTIVE":"HEAT PROPAGATION"}</div>
    </Panel><Footer text={footer}/>
  </AbsoluteFill>;
};

const Meter:React.FC<{label:string;value:number;accent:string;y:number;scan:number;opacity?:number}> = ({label,value,accent,y,scan,opacity=1}) => <div style={{position:"absolute",left:250,top:y,width:1110,opacity}}>
  <div style={{display:"flex",justifyContent:"space-between",fontFamily:"Inter,Arial",fontSize:28,fontWeight:700,color:C.white,marginBottom:14}}><span>{label}</span><span style={{color:accent}}>{value.toFixed(1)}%</span></div>
  <div style={{height:28,borderRadius:16,background:C.line,position:"relative",overflow:"visible"}}>
    <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${value}%`,background:accent,borderRadius:16,opacity:.86}}/>
    <div style={{position:"absolute",left:`calc(${scan}% - 3px)`,top:-9,width:6,height:46,background:C.white,borderRadius:6,boxShadow:`0 0 18px ${C.white}66`}}/>
  </div>
</div>;

export const VALF011CalibrationShift:React.FC<any> = ({title,displayedStart,displayedEnd,usablePct,displayedLabel,usableLabel,footer}) => {
  const progress=useLFRevealProgress(); const f=useCurrentFrame(); const real=useLFRealFrame(); const {fps}=useVideoConfig(); const p=appear(f,fps,6);
  const shift=ease(f/(fps*3.0));
  const displayed=Number(displayedStart)+(Number(displayedEnd)-Number(displayedStart))*shift;
  const scan=5+90*loop01(real,Math.round(fps*2.6));
  const err=displayed-Number(usablePct);
  return <AbsoluteFill>
    <Title title={title||"The estimate can move while usable energy barely changes"} kicker="Live calibration"/>
    <Panel style={{position:"absolute",left:155,top:285,width:1610,height:620,opacity:p}}>
      <Meter label={displayedLabel||"Displayed estimate"} value={displayed} accent={C.heat} y={150} scan={scan} opacity={staged(progress,.24,.47)}/>
      <Meter label={usableLabel||"Usable energy"} value={Number(usablePct)} accent={C.teal} y={310} scan={100-scan} opacity={staged(progress,.49,.71)}/>
      <div style={{position:"absolute",left:250,right:250,bottom:65,opacity:staged(progress,.72,.88),display:"flex",justifyContent:"center",gap:24,fontFamily:"Inter,Arial",fontSize:29,fontWeight:700}}>
        <span style={{color:C.slate}}>DIFFERENCE</span>
        <span style={{color:Math.abs(err)<2?C.teal:C.heat}}>{err>0?"+":""}{err.toFixed(1)} pts</span>
        <span style={{color:C.slate}}>• estimator keeps scanning</span>
      </div>
    </Panel><Footer text={footer}/>
  </AbsoluteFill>;
};

export const VALF012DataDecision:React.FC<any> = ({title,sensors,decisionLabel,actionLabel,footer}) => {
  const progress=useLFRevealProgress(); const f=useCurrentFrame(); const real=useLFRealFrame(); const {fps}=useVideoConfig(); const p=appear(f,fps,6);
  const W=1610, sx=85, sensorW=275, sensorH=90, cy=350, cx=815, centerW=250, actionX=1230;
  const spacing=112, ys=sensors.map((_:string,i:number)=>cy+(i-(sensors.length-1)/2)*spacing);
  const period=Math.max(30,Math.round(fps*1.9));
  const centralPulse=1+.016*Math.sin(real/fps*Math.PI*2*1.2);
  return <AbsoluteFill>
    <Title title={title||"Data becomes a battery decision"} kicker="Live BMS logic"/>
    <Panel style={{position:"absolute",left:155,top:285,width:W,height:620,opacity:p}}>
      <div style={{position:"absolute",left:80,right:80,top:48,textAlign:"center",fontFamily:"Inter,Arial",fontSize:27,fontWeight:700,color:C.slate,opacity:staged(progress,.12,.24)}}>SENSORS → ESTIMATE → DECIDE → ACT</div>
      <svg width={W} height="620" style={{position:"absolute",inset:0}}>
        {ys.map((y:number,i:number)=>{
          const q=loop01(real,period,Math.round(i*period/sensors.length));
          const from=sx+sensorW,to=cx-centerW/2;
          return <g key={i}>
            <line x1={from} y1={y} x2={to} y2={cy} stroke={C.line} strokeWidth="5" opacity={staged(progress,.54,.66)}/>
            <circle cx={from+(to-from)*q} cy={y+(cy-y)*q} r="8" fill={i%2?C.cold:C.teal} opacity={staged(progress,.66,.79)}/>
          </g>;
        })}
        <line x1={cx+centerW/2} y1={cy} x2={actionX} y2={cy} stroke={C.line} strokeWidth="8" strokeLinecap="round" opacity={staged(progress,.83,.91)}/>
        {[0,1,2].map(i=>{const q=loop01(real,Math.round(fps*1.65),i*16);return <circle key={"out"+i} cx={cx+centerW/2+(actionX-cx-centerW/2)*q} cy={cy} r="9" fill={C.heat} opacity={staged(progress,.91,.985)}/>;})}
      </svg>
      {sensors.map((label:string,i:number)=><div key={i} style={{position:"absolute",left:sx,top:ys[i]-sensorH/2,width:sensorW,height:sensorH,boxSizing:"border-box",border:`2px solid ${i%2?C.cold:C.teal}88`,borderRadius:20,background:"rgba(20,36,64,.97)",display:"flex",alignItems:"center",justifyContent:"center",padding:"10px 15px",fontFamily:"Space Grotesk,Arial",fontSize:label.length>17?25:31,fontWeight:700,color:C.white,textAlign:"center",opacity:staged(progress,.20+i*.087,.31+i*.087)}}>{label}</div>)}
      <div style={{position:"absolute",left:cx-centerW/2,top:cy-100,width:centerW,height:200,opacity:staged(progress,.64,.79),boxSizing:"border-box",borderRadius:30,border:`3px solid ${C.teal}`,background:"rgba(20,36,64,.97)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,textAlign:"center",fontFamily:"Space Grotesk,Arial",fontSize:30,fontWeight:750,color:C.white,transform:`scale(${centralPulse})`,boxShadow:`0 0 30px ${C.teal}33`}}>{decisionLabel}</div>
      <NodeBox label={actionLabel} x={actionX} y={cy-75} width={300} accent={C.heat} opacity={staged(progress,.79,.90)}/>
    </Panel><Footer text={footer}/>
  </AbsoluteFill>;
};

const CompareLane:React.FC<{x:number;label:string;value:string;intensity:number;accent:string;metric?:string}> = ({x,label,value,intensity,accent,metric}) => {
  // The intensity is a percentage of a fixed gray 0–100 reference track.
  const progress=useLFRevealProgress();
  const cue=x<600?.23:.42;
  const targetPct=Number.isFinite(intensity)?Math.max(0,Math.min(100,intensity)):0;
  // Both progress bars are the final payoff after the lane labels and values.
  const barStart=x<600?.79:.84;
  const reveal=staged(progress,barStart,.98);
  const filledPct=targetPct*reveal;
  const labelRef=React.useRef<HTMLDivElement>(null);
  const valueRef=React.useRef<HTMLDivElement>(null);

  // Fit labels to reserved text zones before Remotion captures the frame.
  // A second line is allowed, but cannot move the metric into the bar.
  React.useLayoutEffect(()=>{
    const fit=(el:HTMLDivElement|null,starting:number,minimum:number)=>{
      if(!el)return;
      let size=starting;
      el.style.fontSize=size+"px";
      while(size>minimum && (el.scrollHeight>el.clientHeight+1 || el.scrollWidth>el.clientWidth+1)){
        size-=2;
        el.style.fontSize=size+"px";
      }
    };
    fit(labelRef.current,36,24);
    fit(valueRef.current,66,28);
  },[label,value]);

  const trackLabels={fontFamily:"Inter,Arial",fontSize:23,fontWeight:700,color:C.slate};
  const showNumberInsideFill=filledPct>=18;
  const barOpacity=staged(progress,barStart-.045,barStart+.035);
  return <div style={{position:"absolute",left:x,top:95,width:620,height:430,border:"2px solid "+accent+"55",borderRadius:28,background:"rgba(20,36,64,.88)",boxSizing:"border-box"}}>
    <div ref={labelRef} style={{position:"absolute",left:38,right:38,top:28,height:66,overflow:"hidden",overflowWrap:"anywhere",fontFamily:"Space Grotesk,Arial",fontSize:36,lineHeight:1.1,fontWeight:750,color:accent,opacity:staged(progress,cue,cue+.15)}}>{label}</div>
    <div ref={valueRef} style={{position:"absolute",left:38,right:38,top:107,height:134,overflow:"hidden",overflowWrap:"anywhere",fontFamily:"Space Grotesk,Arial",fontSize:66,lineHeight:1.05,fontWeight:750,color:C.white,opacity:staged(progress,cue+.09,cue+.24)}}>{value}</div>
    {metric?<div style={{position:"absolute",left:38,right:38,top:251,height:56,overflow:"hidden",overflowWrap:"anywhere",fontFamily:"Inter,Arial",fontSize:25,lineHeight:1.12,fontWeight:650,color:C.slate,opacity:staged(progress,cue+.17,cue+.32)}}>{metric}</div>:null}
    <div style={{position:"absolute",left:45,right:45,bottom:77,height:34,borderRadius:10,background:C.line,overflow:"hidden",opacity:barOpacity}}>
      <div style={{position:"absolute",left:0,top:0,height:"100%",width:String(filledPct)+"%",borderRadius:10,background:accent}}/>
      <div style={{position:"absolute",left:0,top:0,height:"100%",width:showNumberInsideFill?String(filledPct)+"%":"100%",display:"flex",alignItems:"center",justifyContent:showNumberInsideFill?"center":"flex-start",paddingLeft:showNumberInsideFill?0:10,boxSizing:"border-box",fontFamily:"Inter,Arial",fontSize:22,fontWeight:800,letterSpacing:0.2,color:showNumberInsideFill?C.navy:C.white}}>
        {Math.round(filledPct)}%
      </div>
    </div>
    <div style={{position:"absolute",left:45,right:45,bottom:31,display:"flex",justifyContent:"space-between",...trackLabels,opacity:barOpacity}}><span>0</span><span>100</span></div>
  </div>;
};
export const VALF013DynamicCompare:React.FC<any> = ({title,leftLabel,rightLabel,leftValue,rightValue,leftIntensity,rightIntensity,metricLabel,footer}) => {
  const progress=useLFRevealProgress(); const f=useCurrentFrame(); const {fps}=useVideoConfig(); const p=appear(f,fps,6);
  return <AbsoluteFill>
    <Title title={title||"Same system, different operating condition"} kicker="Live comparator"/>
    <Panel style={{position:"absolute",left:155,top:285,width:1610,height:620,opacity:p}}>
      <CompareLane x={105} label={leftLabel} value={leftValue} intensity={Number(leftIntensity)} accent={C.teal} metric={metricLabel}/>
      <CompareLane x={885} label={rightLabel} value={rightValue} intensity={Number(rightIntensity)} accent={C.heat} metric={metricLabel}/>
      <div style={{position:"absolute",left:775,top:255,width:60,textAlign:"center",fontFamily:"Space Grotesk,Arial",fontSize:44,fontWeight:800,color:C.slate,opacity:staged(progress,.39,.52)}}>VS</div>
    </Panel><Footer text={footer}/>
  </AbsoluteFill>;
};

export const continuousAnimationRegistry:Record<string,AnimEntry> = {
  "VA-LF-008":{component:VALF008PacketStream,schema:packetStreamSchema,description:"Continuous multi-packet energy/data flow across 2-5 system nodes.",slots:["title","nodes","flowLabel","intensity","footer"],defaultDurationSec:8},
  "VA-LF-009":{component:VALF009ThrottleGate,schema:throttleSchema,description:"Continuous input stream passes through a control gate and exits at a reduced rate.",slots:["title","inputLabel","gateLabel","outputLabel","inputRate","outputRate","rateUnit","footer"],defaultDurationSec:8},
  "VA-LF-010":{component:VALF010ThermalField,schema:thermalSchema,description:"Continuously pulsing cell heat map with optional moving cooling sweep.",slots:["title","heatLevel","hotspotRow","hotspotCol","cooling","note","footer"],defaultDurationSec:9},
  "VA-LF-011":{component:VALF011CalibrationShift,schema:calibrationSchema,description:"Displayed battery estimate shifts while usable-energy reference stays stable; scan markers remain active.",slots:["title","displayedStart","displayedEnd","usablePct","displayedLabel","usableLabel","footer"],defaultDurationSec:9},
  "VA-LF-012":{component:VALF012DataDecision,schema:dataDecisionSchema,description:"Continuous sensor data packets feed BMS logic and produce an animated control action.",slots:["title","sensors","decisionLabel","actionLabel","footer"],defaultDurationSec:9},
  "VA-LF-013":{component:VALF013DynamicCompare,schema:dynamicCompareSchema,description:"Two side-by-side normalized progress bars, filled to leftIntensity/rightIntensity percent of their gray 0-100 reference tracks.",slots:["title","leftLabel","rightLabel","leftValue","rightValue","leftIntensity","rightIntensity","metricLabel","footer"],defaultDurationSec:9},
};
