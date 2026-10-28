import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { z } from "zod";
import { clampNumeric, clampInteger } from "../src/clampNumeric";
import { useLFPacedFrame as useCurrentFrame, useLFRevealProgress } from "../src/LFAnimationTiming";

// AmpCoreX editorial animation family. All animation is deterministic at 30fps.
// 1920×1080 frame; no external media or hidden telemetry.
// Distinct visual grammar for mechanism, evidence, time and owner-facing interpretation.
const C={navy:"#0A1628",panel:"#142440",line:"#28405E",white:"#F5FAFF",
  slate:"#B3C6D5",teal:"#39D7CB",cold:"#58B8FF",heat:"#FF8865",yellow:"#FFE0A1"};
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const phase=(f:number,a:number,b:number)=>clamp((f-a)/Math.max(1,b-a));
const ease=(v:number)=>1-Math.pow(1-clamp(v),3);
const reveal=(p:number,start:number,end:number)=>ease((p-start)/Math.max(.01,end-start));
const loop=(f:number,period:number,shift=0)=>((f+shift)%period)/period;
const P:React.FC<{children?:React.ReactNode;style?:React.CSSProperties}>=({children,style})=>{
  const progress=useLFRevealProgress(),alpha=reveal(progress,.08,.28);
  return <div style={{position:"absolute",background:C.panel,border:"2px solid "+C.line,borderRadius:28,
    boxSizing:"border-box",opacity:alpha,...style}}>{children}</div>;
};
const Heading:React.FC<{title?:string;kicker:string;footer?:string}>=({title,kicker,footer})=>{
  const progress=useLFRevealProgress(),first=reveal(progress,.01,.12),second=reveal(progress,.09,.25);
  return <AbsoluteFill style={{pointerEvents:"none",fontFamily:"Inter,Arial,sans-serif"}}>
    <div style={{position:"absolute",left:172,top:104,color:C.teal,fontSize:25,
      letterSpacing:4,fontWeight:800,opacity:first,transform:"translateY("+((1-first)*14)+"px"}}>{kicker.toUpperCase()}</div>
    <div style={{position:"absolute",left:172,top:145,right:172,color:C.white,fontWeight:750,
      fontSize:(title||"").length>55?51:63,lineHeight:1.1,fontFamily:"Space Grotesk,Arial,sans-serif",
      opacity:second,transform:"translateY("+((1-second)*18)+"px"}}>{title}</div>
    {/* Evidence attributions must remain available while factual values are on screen. */}
    <div style={{position:"absolute",left:172,right:172,bottom:70,textAlign:"center",
      color:C.slate,fontSize:23,letterSpacing:.3}}>{footer||"ILLUSTRATIVE ENGINEERING VISUAL — NOT MEASURED VEHICLE DATA"}</div>
  </AbsoluteFill>;
};
const Text:React.FC<{children:React.ReactNode;size?:number;color?:string;weight?:number;cue?:number}>=({children,size=31,color=C.white,weight=650,cue=.34})=>{
  const p=useLFRevealProgress(),alpha=reveal(p,cue,cue+.17);
  return <div style={{fontFamily:"Inter,Arial,sans-serif",fontSize:size,color,fontWeight:weight,lineHeight:1.22,
    opacity:alpha,transform:"translateY("+((1-alpha)*15)+"px"}}>{children}</div>;
};

export const twoClocksSchema=z.object({
  title:z.string().max(85).default("Your battery has two clocks"),
  cycleLabel:z.string().max(32).default("Charging cycles"),
  calendarLabel:z.string().max(32).default("Calendar time"),
  takeaway:z.string().max(70).default("One slows down when parked. One does not."),
  footer:z.string().max(135).optional(),
});
export const VALF015TwoClocks:React.FC<any>=({title,cycleLabel,calendarLabel,takeaway,footer})=>{
  const progress=useLFRevealProgress();const f=useCurrentFrame(),{fps}=useVideoConfig();const seconds=f/fps;
  const centers=[575,1345],cy=566,r=190;
  return <AbsoluteFill>
    <Heading title={title} kicker="TWO INDEPENDENT AGING PATHWAYS" footer={footer}/>
    {centers.map((cx,i)=>{
      const angle=(i===0?Math.min(seconds,1.4)*.55:seconds*1.65)*Math.PI*2;
      const color=i===0?C.cold:C.teal;
      const pointerX=cx+Math.cos(angle-Math.PI/2)*150,pointerY=cy+Math.sin(angle-Math.PI/2)*150;
      const dots=Array.from({length:24},(_,k)=>{const a=k/24*Math.PI*2;return {x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r};});
      return <React.Fragment key={i}>
        <P style={{left:cx-338,top:304,width:676,height:575,boxShadow:"0 16px 65px #0003"}}/>
        <svg style={{position:"absolute",inset:0,opacity:reveal(progress,.24+i*.18,.46+i*.18)}} width={1920} height={1080}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.line} strokeWidth={20}/>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={8} opacity={.6}/>
          {dots.map((d,k)=><circle key={k} cx={d.x} cy={d.y} r={k%6===0?7:4} fill={color} opacity={k%6===0?1:.5}/>)}
          <line x1={cx} y1={cy} x2={pointerX} y2={pointerY} stroke={color} strokeWidth={12} strokeLinecap="round"/>
          <line x1={cx} y1={cy} x2={cx-75} y2={cy+67} stroke={C.slate} strokeWidth={7} strokeLinecap="round"/>
          <circle cx={cx} cy={cy} r={17} fill={C.white}/>
          {i===0&&<g opacity={.8}>
            <path d={"M "+(cx-80)+" "+(cy+264)+" L "+(cx+80)+" "+(cy+264)} stroke={C.cold} strokeWidth={5}/>
            {Array.from({length:5},(_,k)=><rect key={k} x={cx-66+k*29} y={cy+249} width={20} height={28}
              fill={C.cold} opacity={(1+Math.sin(seconds*2+k))/3+.4}/>)}
          </g>}
          {i===1&&Array.from({length:4},(_,k)=><g key={k} opacity={.6+.3*Math.sin(seconds*3+k)}>
            <rect x={cx-96+k*50} y={cy+243} width={40} height={36} rx={7} fill={C.teal}/>
            <line x1={cx-96+k*50} y1={cy+253} x2={cx-56+k*50} y2={cy+253} stroke={C.navy} strokeWidth={4}/>
          </g>)}
        </svg>
        <div style={{position:"absolute",top:337,left:cx-250,width:500,textAlign:"center"}}>
          <Text size={42} color={color} cue={.32+i*.18}>{i===0?cycleLabel:calendarLabel}</Text>
        </div>
        <div style={{position:"absolute",top:752,left:cx-260,width:520,textAlign:"center"}}>
          <Text size={30}>{i===0?"USE-RELATED WEAR":"TIME IN SERVICE"}</Text>
        </div>
      </React.Fragment>;
    })}
    <div style={{position:"absolute",top:908,left:300,right:300,textAlign:"center"}}>
      <Text size={32} color={C.yellow} cue={.78}>{takeaway}</Text>
    </div>
  </AbsoluteFill>;
};

export const cellAgingSchema=z.object({
  title:z.string().max(85).default("Reactions continue while parked"),
  anodeLabel:z.string().max(32).default("ANODE"),
  cathodeLabel:z.string().max(32).default("CATHODE"),
  reactionLabel:z.string().max(48).default("Gradual side reaction"),
  footer:z.string().max(135).optional(),
});
export const VALF016CellAging:React.FC<any>=({title,anodeLabel,cathodeLabel,reactionLabel,footer})=>{
  const progress=useLFRevealProgress();const f=useCurrentFrame(),{fps}=useVideoConfig();const s=f/fps;
  const deposit=16+7*(.5+.5*Math.sin(s*1.5));
  return <AbsoluteFill>
    <Heading title={title} kicker="CALENDAR AGING — CELL CROSS-SECTION" footer={footer}/>
    <P style={{left:182,top:314,width:1556,height:515}}/>
    <svg width={1920} height={1080} style={{position:"absolute",inset:0,opacity:reveal(progress,.24,.46)}}>
      <rect x={305} y={398} width={320} height={325} rx={20} fill="#30577A" stroke={C.cold} strokeWidth={6}/>
      <rect x={1295} y={398} width={320} height={325} rx={20} fill="#725044" stroke={C.heat} strokeWidth={6}/>
      <rect x={670} y={404} width={580} height={313} rx={18} fill="#1A3549" stroke={C.line} strokeWidth={5}/>
      {Array.from({length:13},(_,i)=><line key={i} x1={700+i*40} x2={700+i*40} y1={425} y2={690}
        stroke="#527283" strokeWidth={2} opacity={.52}/>)}
      <rect x={625} y={391} width={deposit} height={340} fill={C.teal} opacity={.8} rx={7}/>
      {Array.from({length:16},(_,i)=>{
        const q=loop(f,Math.round(fps*(1.8+i%3*.4)),i*13);
        const x=690+q*550,y=436+(i%8)*32+Math.sin(q*6+i)*12;
        return <g key={i}>
          <circle cx={x} cy={y} r={7+(i%3)} fill={i%4===0?C.heat:C.teal} opacity={.65+.25*Math.sin(s*4+i)}/>
        </g>;
      })}
      {Array.from({length:8},(_,i)=>{
        const q=loop(f,Math.round(fps*2.1),i*10);
        return <circle key={i} cx={650-38*q} cy={420+i*35} r={4+q*5} fill={C.yellow} opacity={1-q}/>;
      })}
      <path d="M 490 765 L 490 796 L 950 796" stroke={C.cold} strokeWidth={3} fill="none"/>
      <path d="M 1450 765 L 1450 796 L 1010 796" stroke={C.heat} strokeWidth={3} fill="none"/>
    </svg>
    <div style={{position:"absolute",top:344,left:330}}><Text size={33}>{anodeLabel}</Text></div>
    <div style={{position:"absolute",top:344,left:1320}}><Text size={33}>{cathodeLabel}</Text></div>
    <div style={{position:"absolute",top:752,left:740,width:480,textAlign:"center"}}>
      <Text size={29} color={C.teal} cue={.66}>{reactionLabel}</Text>
    </div>
    <div style={{position:"absolute",top:872,left:250,right:250,textAlign:"center"}}>
      <Text size={28} color={C.slate} cue={0}>Illustrative interface processes continue even when vehicle current is low.</Text>
    </div>
  </AbsoluteFill>;
};

export const socHeatSchema=z.object({
  title:z.string().max(80).default("Stored charge and temperature both matter"),
  xAxisLabel:z.string().max(42).default("STORED STATE OF CHARGE"),
  yAxisLabel:z.string().max(42).default("AMBIENT TEMPERATURE"),
  footer:z.string().max(135).optional(),
});
export const VALF017SocHeatMatrix:React.FC<any>=({title,xAxisLabel,yAxisLabel,footer})=>{
  const progress=useLFRevealProgress();const f=useCurrentFrame(),{fps}=useVideoConfig(),s=f/fps;
  const cols=6,rows=4,x0=425,y0=330,stepX=169,stepY=126;
  const dotP=(.5+.5*Math.sin(s*1.45))*0.97;
  return <AbsoluteFill>
    <Heading title={title} kicker="QUALITATIVE EXPOSURE MAP — NOT A PREDICTION" footer={footer}/>
    <P style={{left:255,top:280,width:1420,height:640}}/>
    <svg width={1920} height={1080} style={{position:"absolute",inset:0,opacity:reveal(progress,.24,.46)}}>
      {Array.from({length:rows},(_,i)=>Array.from({length:cols},(_,j)=>{
        const risk=.18+(j/(cols-1)*.35)+((rows-1-i)/(rows-1))*.45;
        const color=risk>.66?C.heat:risk>.42?C.yellow:C.teal;
        return <rect key={i+"-"+j} x={x0+j*stepX} y={y0+i*stepY} width={146} height={102}
          rx={16} fill={color} opacity={.13+risk*.52+.05*Math.sin(s*2.4+i+j)} stroke={color} strokeWidth={3}/>;
      }))}
      <path d={"M "+(x0+60)+" "+(y0+stepY*3+50)+" Q 1060 675 "+(x0+5*stepX+73)+" "+(y0+51)}
        stroke={C.white} strokeWidth={3} fill="none" strokeDasharray="14 12" opacity={.7}/>
      <circle cx={x0+60+(5*stepX+13)*dotP} cy={y0+3*stepY+50-(3*stepY)*ease(dotP)} r={23}
        fill="none" stroke={C.white} strokeWidth={5}/>
      <circle cx={x0+60+(5*stepX+13)*dotP} cy={y0+3*stepY+50-(3*stepY)*ease(dotP)} r={10} fill={C.white}/>
      <path d="M 425 859 H 1430" stroke={C.slate} strokeWidth={3}/>
      <path d="M 375 328 V 825" stroke={C.slate} strokeWidth={3}/>
    </svg>
    <div style={{position:"absolute",top:841,left:700,width:600,textAlign:"center"}}><Text size={26}>{xAxisLabel} →</Text></div>
    <div style={{position:"absolute",top:510,left:148,width:210,textAlign:"center",transform:"rotate(-90deg)"}}>
      <Text size={24}>↑ {yAxisLabel}</Text>
    </div>
    <div style={{position:"absolute",top:299,left:430}}><Text size={25} color={C.heat}>WARMER</Text></div>
    <div style={{position:"absolute",top:786,left:430}}><Text size={25} color={C.cold}>COOLER</Text></div>
    <div style={{position:"absolute",top:870,left:1170}}><Text size={26} color={C.yellow} cue={.78}>More sustained stress →</Text></div>
  </AbsoluteFill>;
};

export const fleetEvidenceSchema=z.object({
  title:z.string().max(83).default("A real-world fleet observation"),
  vehicles:clampInteger(100, 1000000).default(22000),
  models:clampInteger(1, 100).default(21),
  difference:clampNumeric(0, 20).default(.4),
  source:z.string().max(65).default("GEOTAB FLEET ANALYSIS"),
  footer:z.string().max(135).optional(),
});
export const VALF018FleetEvidence:React.FC<any>=({title,vehicles,models,difference,source,footer})=>{
  const progress=useLFRevealProgress();const f=useCurrentFrame(),{fps}=useVideoConfig(),s=f/fps;
  const tick=Math.floor(s*7),period=Math.max(1,Math.round(fps*2.4));
  return <AbsoluteFill>
    <Heading title={title} kicker="OBSERVATIONAL DATA — ASSOCIATION, NOT CAUSATION" footer={footer}/>
    <P style={{left:180,top:325,width:825,height:510}}/>
    <P style={{left:1030,top:325,width:710,height:510,borderColor:C.heat+"66",opacity:reveal(progress,.43,.63)}}/>
    <div style={{position:"absolute",left:230,top:367}}><Text size={28} color={C.cold}>FLEET SAMPLE</Text></div>
    <div style={{position:"absolute",left:232,top:402,fontFamily:"Space Grotesk,Arial",fontSize:115,fontWeight:790,color:C.white}}>
      {Math.round(vehicles*ease(phase(f,12,76))).toLocaleString("en-US")}+
    </div>
    <div style={{position:"absolute",left:232,top:549}}><Text size={29}>ELECTRIC VEHICLES</Text></div>
    <div style={{position:"absolute",left:232,top:609}}><Text size={29} color={C.slate}>{models} MAKES / MODELS</Text></div>
    <svg width={1920} height={1080} style={{position:"absolute",inset:0,opacity:reveal(progress,.24,.46)}}>
      {Array.from({length:48},(_,k)=>{
        const x=250+(k%12)*56,y=698+Math.floor(k/12)*28;
        const visible=phase(f,8+k*.9,20+k*.9);
        return <g key={k} opacity={visible*(k===tick%48?.99:.32)}>
          <rect x={x} y={y} width={32} height={11} rx={4} fill={C.cold}/>
          <circle cx={x+6} cy={y+12} r={3} fill={C.white}/>
          <circle cx={x+27} cy={y+12} r={3} fill={C.white}/>
        </g>;
      })}
      <path d="M 1130 700 H 1620" stroke={C.line} strokeWidth={17} strokeLinecap="round"/>
      <path d="M 1130 700 H 1580" stroke={C.heat} strokeWidth={7} strokeLinecap="round" opacity={.7}/>
      <circle cx={1130+480*loop(f,period)} cy={700} r={15} fill={C.heat}/>
    </svg>
    <div style={{position:"absolute",left:1100,top:368}}><Text size={28} color={C.heat} cue={.57}>HOT VS MILD CLIMATE</Text></div>
    <div style={{position:"absolute",left:1100,top:438,fontFamily:"Space Grotesk,Arial",fontSize:127,fontWeight:800,color:C.heat}}>
      {Number(difference).toFixed(1)}
    </div>
    <div style={{position:"absolute",left:1105,top:597}}><Text size={32} cue={.64}>PERCENTAGE POINTS / YEAR</Text></div>
    <div style={{position:"absolute",left:1105,top:642}}><Text size={26} color={C.slate}>Faster observed health decline</Text></div>
    <div style={{position:"absolute",top:872,left:225,right:225,textAlign:"center"}}>
      <Text size={26} color={C.teal} cue={0}>{source} · Combined real-world battery degradation, not calendar-only aging.</Text>
    </div>
  </AbsoluteFill>;
};

export const rangeVsHealthSchema=z.object({
  title:z.string().max(86).default("Dashboard range is not battery health"),
  rangeStart:clampNumeric(0, 100).default(82),
  rangeEnd:clampNumeric(0, 100).default(58),
  healthReference:clampNumeric(0, 100).default(79),
  footer:z.string().max(135).optional(),
});
export const VALF019RangeHealth:React.FC<any>=({title,rangeStart,rangeEnd,healthReference,footer})=>{
  const progress=useLFRevealProgress();const f=useCurrentFrame(),{fps}=useVideoConfig(),s=f/fps,drive=.5-.5*Math.cos(s*1.1);
  const range=Number(rangeStart)+(Number(rangeEnd)-Number(rangeStart))*drive;
  const ref=Number(healthReference),scan=loop(f,Math.max(1,Math.round(fps*2.5)));
  return <AbsoluteFill>
    <Heading title={title} kicker="TWO DIFFERENT OWNER QUESTIONS" footer={footer}/>
    <P style={{left:185,top:302,width:1550,height:560}}/>
    <svg width={1920} height={1080} style={{position:"absolute",inset:0,opacity:reveal(progress,.24,.46)}}>
      <path d="M 420 717 A 260 260 0 0 1 940 717" fill="none" stroke={C.line} strokeWidth={43} strokeLinecap="round"/>
      <path d="M 420 717 A 260 260 0 0 1 940 717" fill="none" stroke={C.teal} strokeWidth={43}
        strokeDasharray="817" strokeDashoffset={817*(1-range/100)} strokeLinecap="round"/>
      <line x1={1035} y1={368} x2={1035} y2={799} stroke={C.line} strokeWidth={5}/>
      <rect x={1162} y={552} width={360} height={64} rx={20} fill={C.line}/>
      <rect x={1162} y={552} width={360*ref/100} height={64} rx={20} fill={C.cold}/>
      <line x1={1162+360*scan} y1={532} x2={1162+360*scan} y2={640} stroke={C.white} strokeWidth={4}/>
    </svg>
    <div style={{position:"absolute",left:365,top:376,width:625,textAlign:"center"}}><Text color={C.teal} size={36}>RANGE ESTIMATE</Text></div>
    <div style={{position:"absolute",left:365,top:539,width:625,textAlign:"center",fontSize:114,color:C.white,fontFamily:"Space Grotesk",fontWeight:800}}>
      {Math.round(range)}<span style={{fontSize:37,color:C.slate}}> INDEX</span>
    </div>
    <div style={{position:"absolute",left:1128,top:377,width:460,textAlign:"center"}}><Text color={C.cold} size={36} cue={.57}>HEALTH REFERENCE</Text></div>
    <div style={{position:"absolute",left:1128,top:463,width:460,textAlign:"center"}}><Text size={52} cue={.65}>{ref} INDEX</Text></div>
    <div style={{position:"absolute",left:300,top:761,width:650,textAlign:"center"}}><Text size={27}>Changes with operating conditions</Text></div>
    <div style={{position:"absolute",left:1128,top:687,width:460,textAlign:"center"}}><Text size={26}>Long-term metric, if available</Text></div>
    <div style={{position:"absolute",top:879,left:220,right:220,textAlign:"center"}}>
      <Text size={27} color={C.yellow} cue={0}>Schematic normalized indexes — NOT actual range, SoH or measured vehicle telemetry</Text>
    </div>
  </AbsoluteFill>;
};

export const fluctuationTrendSchema=z.object({
  title:z.string().max(86).default("Fluctuation and long-term change are different"),
  topLabel:z.string().max(45).default("TEMPORARY RANGE VARIATION"),
  bottomLabel:z.string().max(45).default("PERSISTENT CAPACITY TREND"),
  footer:z.string().max(135).optional(),
});
export const VALF020FluctuationTrend:React.FC<any>=({title,topLabel,bottomLabel,footer})=>{
  const progress=useLFRevealProgress();const f=useCurrentFrame(),{fps}=useVideoConfig(),s=f/fps;
  const W=1115,x0=520,top=410,bottom=672,cursor=loop(f,Math.round(fps*5.2));
  const wave=(x:number)=>36*Math.sin(x*17)+17*Math.cos(x*43);
  const decline=(x:number)=>-x*98+11*Math.sin(x*6);
  const points=(base:number,fn:(x:number)=>number)=>Array.from({length:160},(_,i)=>{
    const p=i/159;return (i===0?"M":"L")+" "+(x0+p*W).toFixed(1)+" "+(base-fn(p)).toFixed(1);
  }).join(" ");
  return <AbsoluteFill>
    <Heading title={title} kicker="SHORT-TERM NOISE VERSUS LONG-TERM SIGNAL" footer={footer}/>
    <P style={{left:218,top:300,width:1485,height:566}}/>
    <svg width={1920} height={1080} style={{position:"absolute",inset:0,opacity:reveal(progress,.24,.46)}}>
      {[top,bottom].map((y,k)=><g key={k}>
        <line x1={x0-20} y1={y+93} x2={x0+W+20} y2={y+93} stroke={C.line} strokeWidth={3}/>
        <line x1={x0-20} y1={y-96} x2={x0-20} y2={y+100} stroke={C.line} strokeWidth={3}/>
        {Array.from({length:5},(_,i)=><line key={i} x1={x0+i*W/4} x2={x0+i*W/4} y1={y-92} y2={y+90}
          stroke={C.line} strokeWidth={2} opacity={.5}/>)}
      </g>)}
      <path d={points(top,wave)} fill="none" stroke={C.cold} strokeWidth={8} strokeLinecap="round"/>
      <path d={points(bottom,decline)} fill="none" stroke={C.heat} strokeWidth={8} strokeLinecap="round"/>
      <line x1={x0+W*cursor} x2={x0+W*cursor} y1={315} y2={830}
        stroke={C.teal} strokeWidth={4} strokeDasharray="11 9" opacity={.82}/>
      <circle cx={x0+W*cursor} cy={top-wave(cursor)} r={14} fill={C.white} stroke={C.cold} strokeWidth={5}/>
      <circle cx={x0+W*cursor} cy={bottom-decline(cursor)} r={14} fill={C.white} stroke={C.heat} strokeWidth={5}/>
    </svg>
    <div style={{position:"absolute",left:264,top:362,width:240}}><Text size={28} color={C.cold}>{topLabel}</Text></div>
    <div style={{position:"absolute",left:264,top:636,width:240}}><Text size={28} color={C.heat} cue={.61}>{bottomLabel}</Text></div>
    <div style={{position:"absolute",top:887,left:260,right:260,textAlign:"center"}}>
      <Text size={27} color={C.yellow} cue={0}>Illustrative shapes only — never interpret these paths as observed degradation rates.</Text>
    </div>
  </AbsoluteFill>;
};

export const editorialAnimationRegistry={
  "VA-LF-015":{component:VALF015TwoClocks,schema:twoClocksSchema,
    description:"Distinct dual rotating aging clocks: cycling versus elapsed time.",
    slots:["title","cycleLabel","calendarLabel","takeaway","footer"],defaultDurationSec:8},
  "VA-LF-016":{component:VALF016CellAging,schema:cellAgingSchema,
    description:"Battery cell cross section, animated electrolyte particles and simplified SEI side reactions.",
    slots:["title","anodeLabel","cathodeLabel","reactionLabel","footer"],defaultDurationSec:8},
  "VA-LF-017":{component:VALF017SocHeatMatrix,schema:socHeatSchema,
    description:"Qualitative 2D temperature-versus-storage-SoC map with moving scenario pointer.",
    slots:["title","xAxisLabel","yAxisLabel","footer"],defaultDurationSec:8},
  "VA-LF-018":{component:VALF018FleetEvidence,schema:fleetEvidenceSchema,
    description:"Source-labeled real-world fleet sample and climate association data reveal.",
    slots:["title","vehicles","models","difference","source","footer"],defaultDurationSec:8},
  "VA-LF-019":{component:VALF019RangeHealth,schema:rangeVsHealthSchema,
    description:"Owner-facing animated range index gauge alongside stable health-reference index.",
    slots:["title","rangeStart","rangeEnd","healthReference","footer"],defaultDurationSec:8},
  "VA-LF-020":{component:VALF020FluctuationTrend,schema:fluctuationTrendSchema,
    description:"Two different animated illustrative temporal traces: short-term range variation versus persistent decline.",
    slots:["title","topLabel","bottomLabel","footer"],defaultDurationSec:8},
};
