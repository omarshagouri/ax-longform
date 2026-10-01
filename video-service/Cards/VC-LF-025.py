# VC-LF-025 | AmpCoreX long-form centered layout v2
# 1920x1080. Main content is optically centered; lower subtitle band is protected.
# Motion remains duration-aware: animate through duration-1s, hold only the final 1s.
CARD = {
    "id": 'VC-LF-025',
    "slots": ['USABLE_PCT', 'TOP_BUFFER', 'BOTTOM_BUFFER', 'CAPTION'],
    "default_duration": 4.5,
    "css": r'''.hb-wrap{position:absolute;left:0;top:0;width:1080px;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;}
.hb-cap{font-family:'Space Grotesk';font-weight:700;font-size:54px;color:#FFFFFF;text-align:center;margin-bottom:50px;opacity:0;transform:translateY(24px);}
.hb-batt{position:relative;width:260px;height:600px;border:6px solid #8CA0B8;border-radius:26px;overflow:hidden;display:flex;flex-direction:column;}
.hb-seg{width:100%;height:0;display:flex;align-items:center;justify-content:center;font-family:'Space Grotesk';font-weight:700;font-size:38px;color:#0A1628;overflow:hidden;}
.hb-top{background:rgba(255,122,60,.85);} .hb-use{background:#00D4AA;color:#0A1628;} .hb-bot{background:rgba(255,122,60,.85);}
.hb-legend{margin-top:40px;font-family:Inter;font-weight:500;font-size:34px;color:#8CA0B8;text-align:center;opacity:0;}

/* --- caption-safe-zone pass: keep all text above y=1180 (caption band y1180-1540) --- */
.hb-wrap{top:192px !important;height:988px !important;}

/* ax caption-safe v3: center ~y920, clamp bottom<=1340 (repo band bottom=1540) */
#axsafe{position:absolute;left:0;top:0;width:1080px;height:1920px;transform:translate(120px,-150px);}

#axsafe{transform:translate(140px,-150px)!important;}
.hb-wrap{width:930px!important;}
.hb-cap{font-size:50px!important;margin-bottom:38px!important;}
.hb-batt{height:540px!important;}
.hb-legend{font-size:30px!important;margin-top:28px!important;}

/* ===== LF V2 universal centered composition =====
   Optical content center ~= x 880 px.
   Scale 0.78 reduces Shorts-scale typography/graphics.
   Transform origin y=540 pulls high titles down and low graphics up.
   Approx. bottom 220-250 px remains available for subtitles. */
#axsafe{position:absolute!important;left:0!important;top:0!important;width:1080px!important;height:1920px!important;
transform:translate(340px,-150px) scale(.78)!important;transform-origin:540px 540px!important;}

/* LF V2 per-card readability scale */
#axsafe{transform:translate(340px,-150px) scale(0.86)!important;transform-origin:540px 540px!important;}
''',
    "body": r'''<div id="axsafe"><div class="hb-wrap"><div class="hb-cap" id="hbCap">__CAPTION__</div>
<div class="hb-batt"><div class="hb-seg hb-top" id="hbTop">buffer</div><div class="hb-seg hb-use" id="hbUse">__USABLE_PCT__ usable</div><div class="hb-seg hb-bot" id="hbBot">buffer</div></div>
<div class="hb-legend" id="hbLeg">Teal is what you use. Orange is the hidden reserve.</div></div></div>''',
    "seek": r'''
/* AmpCoreX LF timing normalization:
   real card duration = x
   animation window   = x - 1.0 s
   final 1.0 s        = settled hold
   The original card motion is remapped into that active window.
*/
var __lfRealX=(typeof x!=='undefined'&&x>0)?x:4.5;
var __lfActive=Math.max(0.25,__lfRealX-1.0);
var __lfP=clamp(t/__lfActive);
t=__lfP*3.5;
x=4.5;

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

__fit(".hb-cap",900,180,0,1);__fit(".hb-use",0,0,1,0);
function show(id,a,b,dy){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.opacity=e;el.style.transform='translateY('+(dy*(1-e))+'px)';}}
function grow(id,a,b){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.transform='scaleX('+e+')';}}
show('hbCap',S(0,5),E(0,5),24);
var top=parseFloat(('__TOP_BUFFER__'.match(/[\d.]+/)||[8])[0]);var bot=parseFloat(('__BOTTOM_BUFFER__'.match(/[\d.]+/)||[4])[0]);var use=parseFloat(('__USABLE_PCT__'.match(/[\d.]+/)||[88])[0]);
var e1=easeOutCubic(clamp((t-S(1,5))/(E(1,5)-S(1,5))));document.getElementById('hbTop').style.height=(e1*top)+'%';
var e2=easeOutCubic(clamp((t-S(2,5))/(E(2,5)-S(2,5))));document.getElementById('hbUse').style.height=(e2*use)+'%';
var e3=easeOutCubic(clamp((t-S(3,5))/(E(3,5)-S(3,5))));document.getElementById('hbBot').style.height=(e3*bot)+'%';
document.getElementById('hbLeg').style.opacity=easeOutCubic(clamp((t-S(4,5))/(E(4,5)-S(4,5))));''',
}
