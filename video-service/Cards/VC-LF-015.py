# VC-LF-015 | AmpCoreX long-form 1920x1080 conversion v1
# Motion is duration-aware and reserves only the final 1.0 s as a settled hold.
CARD = {
    "id": 'VC-LF-015',
    "slots": ['AMOUNT', 'LABEL', 'SOURCE'],
    "default_duration": 4.0,
    "css": r'''.cost-wrap{position:absolute;left:0;top:0;width:1080px;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;}
.cost-lab{font-family:'Space Grotesk';font-weight:600;font-size:40px;letter-spacing:.1em;text-transform:uppercase;color:#8CA0B8;margin-bottom:24px;opacity:0;transform:translateY(22px);}
.cost-amt{font-family:'Space Grotesk';font-weight:700;font-size:180px;line-height:1;color:#00D4AA;opacity:0;transform:scale(0.85);}
.src{position:absolute;left:96px;bottom:320px;display:flex;align-items:center;gap:20px;opacity:0;}
.src-bar{width:10px;height:44px;background:#00D4AA;border-radius:3px;}
.src-txt{font-family:Inter;font-weight:600;font-size:30px;color:#FFFFFF;}

/* --- caption-safe-zone pass: keep all text above y=1180 (caption band y1180-1540) --- */
.cost-wrap{top:192px !important;height:988px !important;}.src{bottom:600px !important;}

/* ax caption-safe v3: center ~y920, clamp bottom<=1340 (repo band bottom=1540) */
#axsafe{position:absolute;left:0;top:0;width:1080px;height:1920px;transform:translate(120px,-295px);}

#axsafe{transform:translate(140px,-295px)!important;}
.cost-wrap{width:930px!important;}
.cost-lab{font-size:38px!important;}
.cost-amt{font-size:172px!important;}
.src{left:96px!important;}
''',
    "body": r'''<div id="axsafe"><div class="cost-wrap"><div class="cost-lab" id="coLab">__LABEL__</div><div class="cost-amt" id="coAmt">__AMOUNT__</div></div>
<div class="src" id="coSrc"><div class="src-bar"></div><div class="src-txt">SOURCE: __SOURCE__</div></div></div>''',
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

__fit(".cost-amt",940,0,1,1);__fit(".cost-lab",900,140,0,1);__fit(".src-txt",820,0,1,0);
function show(id,a,b,dy){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.opacity=e;el.style.transform='translateY('+(dy*(1-e))+'px)';}}
function grow(id,a,b){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.transform='scaleX('+e+')';}}
show('coLab',S(0,3),E(0,3),22);
var e=easeOutCubic(clamp((t-S(1,3))/(E(1,3)-S(1,3))));var a=document.getElementById('coAmt');a.style.opacity=e;a.style.transform='scale('+(0.85+0.15*e)+')';
var s=document.getElementById('coSrc');if(s){var ok=s.textContent.indexOf('__')<0 && s.textContent.replace('SOURCE:','').trim().length>0 && s.textContent.replace('SOURCE:','').trim().toUpperCase().indexOf('ILLUSTRATIVE')!==0;s.style.opacity=ok?easeOutCubic(clamp((t-S(2,3))/(E(2,3)-S(2,3)))):0;}''',
}
