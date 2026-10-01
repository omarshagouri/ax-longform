# VC-LF-022 | AmpCoreX long-form 1920x1080 conversion v1
# Motion is duration-aware and reserves only the final 1.0 s as a settled hold.
CARD = {
    "id": 'VC-LF-022',
    "slots": ['CTA_LINE'],
    "default_duration": 4.0,
    "css": r'''.o-wrap{position:absolute;left:0;top:0;width:1080px;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;}
.o-mark{font-family:'Space Grotesk';font-weight:700;font-size:130px;color:#FFFFFF;opacity:0;transform:translateY(30px);}
.o-mark .x{color:#00D4AA;text-shadow:0 0 30px rgba(0,212,170,.7);}
.o-tag{font-family:'Space Grotesk';font-weight:600;font-size:34px;letter-spacing:.22em;text-transform:uppercase;color:#00D4AA;margin-top:26px;opacity:0;transform:translateY(22px);}
.o-cta{font-family:Inter;font-weight:600;font-size:44px;color:#FFFFFF;margin-top:70px;opacity:0;transform:translateY(24px);}

/* --- caption-safe-zone pass: keep all text above y=1180 (caption band y1180-1540) --- */
.o-wrap{top:192px !important;height:988px !important;}

/* ax caption-safe v3: center ~y920, clamp bottom<=1340 (repo band bottom=1540) */
#axsafe{position:absolute;left:0;top:0;width:1080px;height:1920px;transform:translate(120px,-153px);}

#axsafe{transform:translate(140px,-153px)!important;}
.o-wrap{width:930px!important;}
.o-mark{font-size:118px!important;}
.o-tag{font-size:28px!important;}
.o-cta{font-size:40px!important;margin-top:54px!important;}
''',
    "body": r'''<div id="axsafe"><div class="o-wrap"><div class="o-mark" id="oMark">AmpCore<span class="x">X</span></div><div class="o-tag" id="oTag">Battery intelligence for the electric age</div><div class="o-cta" id="oCta">__CTA_LINE__</div></div></div>''',
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

__fit(".o-mark",940,0,1,1);__fit(".o-tag",940,0,1,1);__fit(".o-cta",900,160,0,1);
function show(id,a,b,dy){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.opacity=e;el.style.transform='translateY('+(dy*(1-e))+'px)';}}
function grow(id,a,b){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.transform='scaleX('+e+')';}}
show('oMark',0.1,0.9,30);show('oTag',0.7,1.5,22);show('oCta',1.4,2.1,24);''',
}
