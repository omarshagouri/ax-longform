import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { theme } from "./theme";

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
  intensity:z.number().min(1).max(5).default(3),
  footer:z.string().optional(),
});
const throttleSchema=z.object({
  title:z.string().optional(),
  inputLabel:z.string(),
  gateLabel:z.string(),
  outputLabel:z.string(),
  inputRate:z.number().min(0).max(100),
  outputRate:z.number().min(0).max(100),
  footer:z.string().optional(),
});
const thermalSchema=z.object({
  title:z.string().optional(),
  heatLevel:z.number().min(0).max(100).default(70),
  hotspotRow:z.number().int().min(0).max(4).default(2),
  hotspotCol:z.number().int().min(0).max(7).default(5),
  cooling:z.boolean().default(true),
  note:z.string().optional(),
  footer:z.string().optional(),
});
const calibrationSchema=z.object({
  title:z.string().optional(),
  displayedStart:z.number().min(0).max(100),
  displayedEnd:z.number().min(0).max(100),
  usablePct:z.number().min(0).max(100),
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
  leftIntensity:z.number().min(0).max(100),
  rightIntensity:z.number().min(0).max(100),
  metricLabel:z.string().optional(),
  footer:z.string().optional(),
});

const NodeBox:React.FC<{label:string;x:number;y:number;width:number;accent?:string;opacity?:number}> = ({label,x,y,width,accent=C.teal,opacity=1}) =>
  <div style={{position:"absolute",left:x,top:y,width,height:150,boxSizing:"border-box",border:`2px solid ${accent}88`,borderRadius:23,background:"rgba(20,36,64,.94)",display:"flex",alignItems:"center",justifyContent:"center",padding:"18px 20px",textAlign:"center",fontFamily:"Space Grotesk,Arial",fontSize:label.length>16?27:32,fontWeight:700,color:C.white,opacity}}>
    {label}
  </div>;

export const VALF008PacketStream:React.FC<any> = ({title,nodes,flowLabel,intensity,footer}) => {
  const f=useCurrentFrame(); const {fps}=useVideoConfig(); const p=appear(f,fps,6);
  const W=1610,left=155,inner=95,y=440,n=nodes.length,gap=n<=3?100:66,nodeW=Math.min(250,(W-190-gap*(n-1))/n);
  const xs=nodes.map((_:string,i:number)=>inner+i*(nodeW+gap));
  const x0=xs[0]+nodeW, x1=xs[n-1], span=Math.max(1,x1-x0);
  const count=Math.max(3,Math.min(8,Number(intensity||3)+3));
  const period=Math.round(fps*(2.8-Math.min(5,Number(intensity||3))*.25));
  return <AbsoluteFill>
    <Title title={title||"Energy moving through the system"} kicker="Live energy stream"/>
    <Panel style={{position:"absolute",left,top:285,width:W,height:620,opacity:p,transform:`translateY(${(1-p)*16}px)`}}>
      {flowLabel?<div style={{position:"absolute",left:80,right:80,top:46,textAlign:"center",fontFamily:"Inter,Arial",fontSize:29,fontWeight:650,color:C.slate}}>{flowLabel}</div>:null}
      <svg width={W} height="620" style={{position:"absolute",inset:0}}>
        <line x1={x0} y1={y} x2={x1} y2={y} stroke={C.line} strokeWidth="10" strokeLinecap="round"/>
        {[...Array(count)].map((_,i)=>{
          const q=loop01(f,period,Math.round(i*period/count));
          const x=x0+span*q;
          const glow=.55+.45*Math.sin(q*Math.PI);
          return <g key={i}>
            <circle cx={x} cy={y} r={18} fill={C.teal} opacity={.14*glow}/>
            <circle cx={x} cy={y} r={8} fill={C.teal} opacity={.95}/>
          </g>;
        })}
      </svg>
      {nodes.map((node:string,i:number)=><NodeBox key={node+i} label={node} x={xs[i]} y={y-75} width={nodeW} accent={i===0||i===n-1?C.teal:C.slate} opacity={appear(f,fps,12+i*5)}/>)}
      <div style={{position:"absolute",left:100,right:100,bottom:48,textAlign:"center",fontFamily:"Inter,Arial",fontSize:27,fontWeight:750,color:C.teal,letterSpacing:.5}}>CONTINUOUS ENERGY FLOW</div>
    </Panel>
    <Footer text={footer}/>
  </AbsoluteFill>;
};

export const VALF009ThrottleGate:React.FC<any> = ({title,inputLabel,gateLabel,outputLabel,inputRate,outputRate,footer}) => {
  const f=useCurrentFrame(); const {fps}=useVideoConfig(); const p=appear(f,fps,6);
  const left=155,W=1610,y=575,xIn=220,xGate=780,xOut=1170;
  const gate=Math.max(18,Math.min(100,Number(outputRate)));
  const inCount=7, outCount=Math.max(2,Math.round(2+6*Number(outputRate)/100));
  const inPeriod=Math.round(fps*(1.25+1.2*(1-Number(inputRate)/100)));
  const outPeriod=Math.round(fps*(1.5+1.6*(1-Number(outputRate)/100)));
  return <AbsoluteFill>
    <Title title={title||"The BMS can throttle power"} kicker="Control gate"/>
    <Panel style={{position:"absolute",left,top:285,width:W,height:620,opacity:p}}>
      <svg width={W} height="620">
        <line x1={xIn} y1={y} x2={xGate-80} y2={y} stroke={C.line} strokeWidth="10" strokeLinecap="round"/>
        <line x1={xGate+80} y1={y} x2={xOut+210} y2={y} stroke={C.line} strokeWidth="10" strokeLinecap="round"/>
        {[...Array(inCount)].map((_,i)=>{const q=loop01(f,inPeriod,Math.round(i*inPeriod/inCount));return <circle key={"i"+i} cx={xIn+(xGate-90-xIn)*q} cy={y} r="8" fill={C.teal}/>;})}
        {[...Array(outCount)].map((_,i)=>{const q=loop01(f,outPeriod,Math.round(i*outPeriod/outCount));return <circle key={"o"+i} cx={xGate+90+(xOut+120-(xGate+90))*q} cy={y} r="8" fill={C.heat}/>;})}
      </svg>
      <NodeBox label={inputLabel} x={70} y={330} width={300} accent={C.teal}/>
      <div style={{position:"absolute",left:xGate-95,top:300,width:190,height:250,border:`2px solid ${C.heat}88`,borderRadius:26,background:"rgba(20,36,64,.96)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <div style={{fontFamily:"Space Grotesk,Arial",fontSize:30,fontWeight:700,color:C.white,textAlign:"center",padding:"0 14px"}}>{gateLabel}</div>
        <div style={{marginTop:24,width:110,height:110,border:`3px solid ${C.slate}`,borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{width:70,height:Math.max(12,70*gate/100),background:C.heat,borderRadius:8,boxShadow:`0 0 22px ${C.heat}44`}}/>
        </div>
        <div style={{fontFamily:"Inter,Arial",fontSize:24,fontWeight:750,color:C.heat,marginTop:14}}>{Math.round(gate)}% OPEN</div>
      </div>
      <NodeBox label={outputLabel} x={1240} y={330} width={300} accent={C.heat}/>
      <div style={{position:"absolute",left:100,right:100,top:65,display:"flex",justifyContent:"center",gap:70,fontFamily:"Inter,Arial",fontSize:28,fontWeight:700}}>
        <span style={{color:C.teal}}>REQUEST {Math.round(inputRate)}%</span><span style={{color:C.heat}}>ALLOWED {Math.round(outputRate)}%</span>
      </div>
    </Panel><Footer text={footer}/>
  </AbsoluteFill>;
};

export const VALF010ThermalField:React.FC<any> = ({title,heatLevel,hotspotRow,hotspotCol,cooling,note,footer}) => {
  const f=useCurrentFrame(); const {fps}=useVideoConfig(); const p=appear(f,fps,6);
  const rows=5,cols=8,cellW=120,cellH=70,gap=12,startX=280,startY=180;
  const wave=loop01(f,Math.round(fps*3.2));
  const pulse=(Math.sin(f/fps*Math.PI*2*.75)+1)/2;
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
        return <div key={r+"-"+c} style={{position:"absolute",left:startX+c*(cellW+gap),top:startY+r*(cellH+gap),width:cellW,height:cellH,border:`2px solid ${border}`,borderRadius:16,background:bg,boxShadow:hot>.45?`0 0 ${20+30*hot}px ${C.heat}44`:"none",transition:"none",opacity:.98}}/>;
      }))}
      {cooling?<div style={{position:"absolute",left:startX+wave*((cols-1)*(cellW+gap))-25,top:startY-20,width:50,height:rows*(cellH+gap)-gap+40,background:"linear-gradient(90deg,rgba(77,166,255,0),rgba(77,166,255,.28),rgba(77,166,255,0))",filter:"blur(5px)",borderRadius:30}}/>:null}
      <div style={{position:"absolute",right:125,top:125,fontFamily:"Inter,Arial",fontSize:25,fontWeight:700,color:cooling?C.cold:C.heat}}>{cooling?"COOLING SWEEP ACTIVE":"HEAT PROPAGATION"}</div>
    </Panel><Footer text={footer}/>
  </AbsoluteFill>;
};

const Meter:React.FC<{label:string;value:number;accent:string;y:number;scan:number}> = ({label,value,accent,y,scan}) => <div style={{position:"absolute",left:250,top:y,width:1110}}>
  <div style={{display:"flex",justifyContent:"space-between",fontFamily:"Inter,Arial",fontSize:28,fontWeight:700,color:C.white,marginBottom:14}}><span>{label}</span><span style={{color:accent}}>{value.toFixed(1)}%</span></div>
  <div style={{height:28,borderRadius:16,background:C.line,position:"relative",overflow:"visible"}}>
    <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${value}%`,background:accent,borderRadius:16,opacity:.86}}/>
    <div style={{position:"absolute",left:`calc(${scan}% - 3px)`,top:-9,width:6,height:46,background:C.white,borderRadius:6,boxShadow:`0 0 18px ${C.white}66`}}/>
  </div>
</div>;

export const VALF011CalibrationShift:React.FC<any> = ({title,displayedStart,displayedEnd,usablePct,displayedLabel,usableLabel,footer}) => {
  const f=useCurrentFrame(); const {fps}=useVideoConfig(); const p=appear(f,fps,6);
  const shift=ease(f/(fps*3.0));
  const displayed=Number(displayedStart)+(Number(displayedEnd)-Number(displayedStart))*shift;
  const scan=5+90*loop01(f,Math.round(fps*2.6));
  const err=displayed-Number(usablePct);
  return <AbsoluteFill>
    <Title title={title||"The estimate can move while usable energy barely changes"} kicker="Live calibration"/>
    <Panel style={{position:"absolute",left:155,top:285,width:1610,height:620,opacity:p}}>
      <Meter label={displayedLabel||"Displayed estimate"} value={displayed} accent={C.heat} y={150} scan={scan}/>
      <Meter label={usableLabel||"Usable energy"} value={Number(usablePct)} accent={C.teal} y={310} scan={100-scan}/>
      <div style={{position:"absolute",left:250,right:250,bottom:65,display:"flex",justifyContent:"center",gap:24,fontFamily:"Inter,Arial",fontSize:29,fontWeight:700}}>
        <span style={{color:C.slate}}>DIFFERENCE</span>
        <span style={{color:Math.abs(err)<2?C.teal:C.heat}}>{err>0?"+":""}{err.toFixed(1)} pts</span>
        <span style={{color:C.slate}}>• estimator keeps scanning</span>
      </div>
    </Panel><Footer text={footer}/>
  </AbsoluteFill>;
};

export const VALF012DataDecision:React.FC<any> = ({title,sensors,decisionLabel,actionLabel,footer}) => {
  const f=useCurrentFrame(); const {fps}=useVideoConfig(); const p=appear(f,fps,6);
  const W=1610,left=155,centerX=805,centerY=390;
  const ys=sensors.map((_:string,i:number)=>225+i*(240/Math.max(1,sensors.length-1)));
  const period=Math.round(fps*1.8);
  const centralPulse=.92+.08*Math.sin(f/fps*Math.PI*2*1.25);
  return <AbsoluteFill>
    <Title title={title||"Data becomes a battery decision"} kicker="Live BMS logic"/>
    <Panel style={{position:"absolute",left,top:285,width:W,height:620,opacity:p}}>
      <svg width={W} height="620" style={{position:"absolute",inset:0}}>
        {ys.map((y:number,i:number)=>{
          const q=loop01(f,period,Math.round(i*period/sensors.length));
          const sx=330,ex=centerX-120;
          return <g key={i}><line x1={sx} y1={y} x2={ex} y2={centerY} stroke={C.line} strokeWidth="5"/><circle cx={sx+(ex-sx)*q} cy={y+(centerY-y)*q} r="8" fill={i%2?C.cold:C.teal}/></g>;
        })}
        <line x1={centerX+120} y1={centerY} x2={1320} y2={centerY} stroke={C.line} strokeWidth="7"/>
        {[0,1,2].map(i=>{const q=loop01(f,Math.round(fps*1.55),i*16);return <circle key={"out"+i} cx={centerX+130+(1190-centerX)*q} cy={centerY} r="9" fill={C.heat}/>;})}
      </svg>
      {sensors.map((s:string,i:number)=><NodeBox key={s+i} label={s} x={80} y={ys[i]-60} width={250} accent={i%2?C.cold:C.teal}/>)}
      <div style={{position:"absolute",left:centerX-120,top:centerY-120,width:240,height:240,borderRadius:38,border:`3px solid ${C.teal}`,background:"rgba(20,36,64,.96)",display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",padding:25,boxSizing:"border-box",fontFamily:"Space Grotesk,Arial",fontSize:32,fontWeight:750,color:C.white,transform:`scale(${centralPulse})`,boxShadow:`0 0 34px ${C.teal}33`}}>{decisionLabel}</div>
      <NodeBox label={actionLabel} x={1230} y={centerY-75} width={300} accent={C.heat}/>
      <div style={{position:"absolute",left:100,right:100,top:55,textAlign:"center",fontFamily:"Inter,Arial",fontSize:27,fontWeight:650,color:C.slate}}>SENSORS → ESTIMATE → DECIDE → ACT</div>
    </Panel><Footer text={footer}/>
  </AbsoluteFill>;
};

const CompareLane:React.FC<{x:number;label:string;value:string;intensity:number;accent:string;metric?:string;frame:number;fps:number}> = ({x,label,value,intensity,accent,metric,frame,fps}) => {
  const count=Math.max(2,Math.round(2+intensity/16));
  const period=Math.round(fps*(2.6-1.35*intensity/100));
  return <div style={{position:"absolute",left:x,top:95,width:620,height:430,border:`2px solid ${accent}55`,borderRadius:28,background:"rgba(20,36,64,.88)",padding:"34px 38px",boxSizing:"border-box"}}>
    <div style={{fontFamily:"Space Grotesk,Arial",fontSize:38,fontWeight:750,color:accent}}>{label}</div>
    <div style={{fontFamily:"Space Grotesk,Arial",fontSize:76,fontWeight:750,color:C.white,marginTop:20}}>{value}</div>
    {metric?<div style={{fontFamily:"Inter,Arial",fontSize:25,fontWeight:650,color:C.slate,marginTop:4}}>{metric}</div>:null}
    <div style={{position:"absolute",left:45,right:45,bottom:90,height:18,borderRadius:10,background:C.line}}>
      {[...Array(count)].map((_,i)=>{const q=loop01(frame,period,Math.round(i*period/count));return <div key={i} style={{position:"absolute",left:`calc(${q*100}% - 8px)`,top:1,width:16,height:16,borderRadius:99,background:accent,boxShadow:`0 0 18px ${accent}66`}}/>;})}
    </div>
    <div style={{position:"absolute",left:45,right:45,bottom:44,display:"flex",justifyContent:"space-between",fontFamily:"Inter,Arial",fontSize:23,fontWeight:700,color:C.slate}}><span>LOW</span><span>ACTIVITY</span><span>HIGH</span></div>
  </div>;
};

export const VALF013DynamicCompare:React.FC<any> = ({title,leftLabel,rightLabel,leftValue,rightValue,leftIntensity,rightIntensity,metricLabel,footer}) => {
  const f=useCurrentFrame(); const {fps}=useVideoConfig(); const p=appear(f,fps,6);
  return <AbsoluteFill>
    <Title title={title||"Same system, different operating condition"} kicker="Live comparator"/>
    <Panel style={{position:"absolute",left:155,top:285,width:1610,height:620,opacity:p}}>
      <CompareLane x={105} label={leftLabel} value={leftValue} intensity={Number(leftIntensity)} accent={C.teal} metric={metricLabel} frame={f} fps={fps}/>
      <CompareLane x={885} label={rightLabel} value={rightValue} intensity={Number(rightIntensity)} accent={C.heat} metric={metricLabel} frame={f} fps={fps}/>
      <div style={{position:"absolute",left:775,top:255,width:60,textAlign:"center",fontFamily:"Space Grotesk,Arial",fontSize:44,fontWeight:800,color:C.slate}}>VS</div>
    </Panel><Footer text={footer}/>
  </AbsoluteFill>;
};

export const continuousAnimationRegistry:Record<string,AnimEntry> = {
  "VA-LF-008":{component:VALF008PacketStream,schema:packetStreamSchema,description:"Continuous multi-packet energy/data flow across 2-5 system nodes.",slots:["title","nodes","flowLabel","intensity","footer"],defaultDurationSec:8},
  "VA-LF-009":{component:VALF009ThrottleGate,schema:throttleSchema,description:"Continuous input stream passes through a control gate and exits at a reduced rate.",slots:["title","inputLabel","gateLabel","outputLabel","inputRate","outputRate","footer"],defaultDurationSec:8},
  "VA-LF-010":{component:VALF010ThermalField,schema:thermalSchema,description:"Continuously pulsing cell heat map with optional moving cooling sweep.",slots:["title","heatLevel","hotspotRow","hotspotCol","cooling","note","footer"],defaultDurationSec:9},
  "VA-LF-011":{component:VALF011CalibrationShift,schema:calibrationSchema,description:"Displayed battery estimate shifts while usable-energy reference stays stable; scan markers remain active.",slots:["title","displayedStart","displayedEnd","usablePct","displayedLabel","usableLabel","footer"],defaultDurationSec:9},
  "VA-LF-012":{component:VALF012DataDecision,schema:dataDecisionSchema,description:"Continuous sensor data packets feed BMS logic and produce an animated control action.",slots:["title","sensors","decisionLabel","actionLabel","footer"],defaultDurationSec:9},
  "VA-LF-013":{component:VALF013DynamicCompare,schema:dynamicCompareSchema,description:"Two continuously moving activity lanes compare operating conditions side by side.",slots:["title","leftLabel","rightLabel","leftValue","rightValue","leftIntensity","rightIntensity","metricLabel","footer"],defaultDurationSec:9},
};
