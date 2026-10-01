# VC-LF-014 | AmpCoreX long-form 1920x1080 conversion v1
# Motion is duration-aware and reserves only the final 1.0 s as a settled hold.
CARD = {
    "id": 'VC-LF-014',
    "slots": ['TEMP', 'CAPTION', 'SOURCE'],
    "default_duration": 4.0,
    "css": r'''.th-wrap{position:absolute;left:0;top:0;width:1080px;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;}
.th-cap{font-family:'Space Grotesk';font-weight:700;font-size:56px;color:#FFFFFF;margin-bottom:56px;text-align:center;opacity:0;transform:translateY(26px);}
.th-row{display:flex;align-items:flex-end;gap:44px;}
.th-tube{position:relative;width:78px;height:520px;background:rgba(140,160,184,.16);border-radius:40px;overflow:hidden;}
.th-merc{position:absolute;left:0;bottom:0;width:100%;height:0;background:linear-gradient(180deg,#FF7A3C,#00D4AA);}
.th-val{font-family:'Space Grotesk';font-weight:700;font-size:110px;color:#FFFFFF;opacity:0;transform:translateY(28px);}

/* --- caption-safe-zone pass: keep all text above y=1180 (caption band y1180-1540) --- */
.th-wrap{top:192px !important;height:988px !important;}

/* ax caption-safe v3: center ~y920, clamp bottom<=1340 (repo band bottom=1540) */
#axsafe{position:absolute;left:0;top:0;width:1080px;height:1920px;transform:translate(120px,-151px);}

#axsafe{transform:translate(140px,-151px)!important;}
.th-wrap{width:930px!important;}
.th-cap{font-size:52px!important;}
.th-tube{height:480px!important;}
.th-val{font-size:104px!important;}
''',
    "body": r'''<div id="axsafe"><div class="th-wrap"><div class="th-cap" id="thCap">__CAPTION__</div>
<div class="th-row"><div class="th-tube"><div class="th-merc" id="thMerc"></div></div><div class="th-val" id="thVal">__TEMP__</div></div></div></div>''',
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

__fit(".th-val",320,0,1,0);__fit(".th-cap",900,180,0,1);
function show(id,a,b,dy){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.opacity=e;el.style.transform='translateY('+(dy*(1-e))+'px)';}}
function grow(id,a,b){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.transform='scaleX('+e+')';}}
show('thCap',S(0,3),E(0,3),26);
var e=easeOutCubic(clamp((t-S(1,3))/(E(1,3)-S(1,3))));document.getElementById('thMerc').style.height=(e*100)+'%';
show('thVal',S(2,3),E(2,3),28);''',
}
