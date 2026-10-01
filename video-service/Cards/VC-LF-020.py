# VC-LF-020 | AmpCoreX long-form 1920x1080 conversion v1
# Motion is duration-aware and reserves only the final 1.0 s as a settled hold.
CARD = {
    "id": 'VC-LF-020',
    "slots": ['TAG_TEXT'],
    "default_duration": 3.0,
    "css": r'''.tag-chip{position:absolute;left:96px;top:300px;display:inline-flex;align-items:center;gap:16px;background:rgba(10,22,40,.82);border:2px solid #00D4AA;border-radius:14px;padding:20px 30px;opacity:0;transform:translateX(-30px);}
.tag-dot{width:16px;height:16px;border-radius:50%;background:#00D4AA;}
.tag-t{font-family:'Space Grotesk';font-weight:600;font-size:40px;letter-spacing:.06em;color:#FFFFFF;text-transform:uppercase;}
/* ax caption-safe v3: center ~y920, clamp bottom<=1340 (repo band bottom=1540) */
#axsafe{position:absolute;left:0;top:0;width:1080px;height:1920px;transform:translate(120px,195px);}

#axsafe{transform:translate(140px,195px)!important;}
.tag-chip{left:96px!important;top:300px!important;}
.tag-t{font-size:38px!important;}
''',
    "body": r'''<div id="axsafe"><div class="tag-chip" id="tagChip"><div class="tag-dot"></div><div class="tag-t">__TAG_TEXT__</div></div></div>''',
    "seek": r'''
/* AmpCoreX LF timing normalization:
   real card duration = x
   animation window   = x - 1.0 s
   final 1.0 s        = settled hold
   The original card motion is remapped into that active window.
*/
var __lfRealX=(typeof x!=='undefined'&&x>0)?x:3;
var __lfActive=Math.max(0.25,__lfRealX-1.0);
var __lfP=clamp(t/__lfActive);
t=__lfP*2;
x=3;

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

__fit(".tag-t",700,0,1,0);
function show(id,a,b,dy){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.opacity=e;el.style.transform='translateY('+(dy*(1-e))+'px)';}}
function grow(id,a,b){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.transform='scaleX('+e+')';}}
var e=easeOutCubic(clamp((t-S(0,1))/(E(0,1)-S(0,1))));var c=document.getElementById('tagChip');c.style.opacity=e;c.style.transform='translateX('+(-30*(1-e))+'px)';''',
}
