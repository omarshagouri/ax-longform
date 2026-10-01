# VC-LF-013 | AmpCoreX long-form centered layout v2
# 1920x1080. Main content is optically centered; lower subtitle band is protected.
# Motion remains duration-aware: animate through duration-1s, hold only the final 1s.
CARD = {
    "id": 'VC-LF-013',
    "slots": ['VALUE', 'METRIC_LABEL', 'SOURCE'],
    "default_duration": 4.0,
    "css": r'''.g-wrap{position:absolute;left:0;top:0;width:1080px;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;}
.g-ring{position:relative;width:520px;height:520px;}
.g-val{position:absolute;left:0;top:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:'Space Grotesk';font-weight:700;font-size:150px;color:#FFFFFF;opacity:0;}
.g-lab{margin-top:36px;font-family:'Space Grotesk';font-weight:600;font-size:40px;color:#8CA0B8;opacity:0;transform:translateY(24px);}
.src{position:absolute;left:96px;bottom:320px;display:flex;align-items:center;gap:20px;opacity:0;}
.src-bar{width:10px;height:44px;background:#00D4AA;border-radius:3px;}
.src-txt{font-family:Inter;font-weight:600;font-size:30px;color:#FFFFFF;}

/* --- caption-safe-zone pass: keep all text above y=1180 (caption band y1180-1540) --- */
.g-wrap{top:192px !important;height:988px !important;}.src{bottom:600px !important;}

/* ax caption-safe v3: center ~y920, clamp bottom<=1340 (repo band bottom=1540) */
#axsafe{position:absolute;left:0;top:0;width:1080px;height:1920px;transform:translate(120px,-111px);}

#axsafe{transform:translate(140px,-111px)!important;}
.g-wrap{width:930px!important;}
.g-ring{width:500px!important;height:500px!important;}
.g-val{font-size:142px!important;}
.src{left:96px!important;}

/* ===== LF V2 universal centered composition =====
   Optical content center ~= x 880 px.
   Scale 0.78 reduces Shorts-scale typography/graphics.
   Transform origin y=540 pulls high titles down and low graphics up.
   Approx. bottom 220-250 px remains available for subtitles. */
#axsafe{position:absolute!important;left:0!important;top:0!important;width:1080px!important;height:1920px!important;
transform:translate(340px,-111px) scale(.78)!important;transform-origin:540px 540px!important;}

/* LF V2 per-card readability scale */
#axsafe{transform:translate(430px,-90px) scale(0.84)!important;transform-origin:540px 540px!important;}
.src{bottom:760px!important;}
''',
    "body": r'''<div id="axsafe"><div class="g-wrap"><div class="g-ring"><canvas id="gCanvas" width="520" height="520"></canvas><div class="g-val" id="gVal">__VALUE__</div></div>
<div class="g-lab" id="gLab">__METRIC_LABEL__</div></div>
<div class="src" id="gSrc"><div class="src-bar"></div><div class="src-txt">SOURCE: __SOURCE__</div></div></div>''',
    "seek": r'''
/* AmpCoreX LF timing normalization:
   real card duration = x
   animation window   = x - 1.0 s
   final 1.0 s        = settled hold
   The original card motion is remapped into that active window.
*/
var __lfRealX=(typeof x!=='undefined'&&x>0)?x:4;
var __lfActive=Math.max(0.25,__lfRealX-1.0);
var __lfP=clamp(t/__lfActive);
t=__lfP*3;
x=4;

var x=(typeof x!=='undefined'&&x>0)?x:4;
var HOLD=1,ENTER=0.5;
function S(i,N){return N<2?0.12*x:0.12*x+(i/(N-1))*((x-HOLD-ENTER)-0.12*x);}
function E(i,N){return N<2?x-HOLD:S(i,N)+ENTER;}
if(!window.__fit){window.__fit=function(sel,maxW,maxH,line,center){
var els=document.querySelectorAll(sel);var ready=(!document.fonts)||document.fonts.status==='loaded';
for(var i=0;i<els.length;i++){var el=els[i];
if(el.dataset.fitok==='1'){el.style.fontSize=el.dataset.fitpx+'px';continue;}
if(!el.dataset.fbase){el.dataset.fbase=(parseFloat(getComputedStyle(el).fontSize)||40);}
if(maxW){el.style.maxWidth=maxW+'px';if(center){el.style.marginLeft='auto';el.style.marginRight='auto';}}
el.style.whiteSpace=line?'nowrap':'normal';if(!line){el.style.overflowWrap='break-word';el.style.wordBreak='break-word';}
var size=parseFloat(el.dataset.fbase);el.style.fontSize=size+'px';var g=0;
while(size>16&&g<240&&(el.scrollWidth>el.clientWidth+0.5||(maxH&&el.scrollHeight>maxH+0.5))){size-=2;el.style.fontSize=size+'px';g++;}
if(ready){el.dataset.fitpx=size;el.dataset.fitok='1';}}
};}

__fit(".g-val",0,0,1,0);__fit(".g-lab",900,140,0,1);__fit(".src-txt",820,0,1,0);
function show(id,a,b,dy){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.opacity=e;el.style.transform='translateY('+(dy*(1-e))+'px)';}}
function grow(id,a,b){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.transform='scaleX('+e+')';}}
var cv=document.getElementById('gCanvas');var ctx=cv.getContext('2d');var cx=260,cy=260,r=210;
var full=parseFloat(('__VALUE__'.match(/[\d.]+/)||[0])[0]);
var e=easeOutCubic(clamp((t-S(0,4))/(E(0,4)-S(0,4))));var frac=(full/100)*e;
ctx.clearRect(0,0,520,520);ctx.lineWidth=34;ctx.lineCap='round';
ctx.strokeStyle='rgba(140,160,184,0.20)';ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
ctx.strokeStyle='#00D4AA';ctx.beginPath();ctx.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+frac*Math.PI*2);ctx.stroke();
var gv=document.getElementById('gVal');gv.style.opacity=easeOutCubic(clamp((t-S(1,4))/(E(1,4)-S(1,4))));
if(!gv.dataset.full){gv.dataset.full=gv.textContent;}
var num=(full*e);var suf=gv.dataset.full.replace(/[\d.\s]/g,'');gv.textContent=(Math.round(num))+suf;
show('gLab',S(2,4),E(2,4),24);
var s=document.getElementById('gSrc');if(s){var ok=s.textContent.indexOf('__')<0 && s.textContent.replace('SOURCE:','').trim().length>0 && s.textContent.replace('SOURCE:','').trim().toUpperCase().indexOf('ILLUSTRATIVE')!==0;s.style.opacity=ok?easeOutCubic(clamp((t-S(3,4))/(E(3,4)-S(3,4)))):0;}''',
}
