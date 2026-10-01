# VC-LF-023 | AmpCoreX long-form 1920x1080 conversion v1
# Motion is duration-aware and reserves only the final 1.0 s as a settled hold.
CARD = {
    "id": 'VC-LF-023',
    "slots": ['TITLE', 'C1_LABEL', 'C1_VALUE', 'C2_LABEL', 'C2_VALUE', 'C3_LABEL', 'C3_VALUE', 'SOURCE'],
    "default_duration": 4.5,
    "css": r'''.cb-wrap{position:absolute;left:96px;top:0;width:888px;height:100%;display:flex;flex-direction:column;justify-content:center;}
.cb-title{font-family:'Space Grotesk';font-weight:700;font-size:60px;color:#FFFFFF;text-align:center;margin-bottom:300px;opacity:0;transform:translateY(26px);}
.cb-plot{display:flex;justify-content:space-around;align-items:flex-end;height:520px;border-bottom:3px solid rgba(140,160,184,.4);}
.cb-col{display:flex;flex-direction:column;align-items:center;width:220px;}
.cb-val{font-family:'Space Grotesk';font-weight:700;font-size:56px;color:#FFFFFF;margin-bottom:16px;opacity:0;}
.cb-bar{width:150px;border-radius:14px 14px 0 0;height:0;}
.cb-lab{font-family:Inter;font-weight:600;font-size:34px;color:#8CA0B8;margin-top:22px;text-align:center;}
.src{position:absolute;left:96;bottom:230px;display:flex;align-items:center;gap:20px;opacity:0;}
.src-bar{width:10px;height:44px;background:#00D4AA;border-radius:3px;}
.src-txt{font-family:Inter;font-weight:600;font-size:30px;color:#FFFFFF;}

/* --- caption-safe-zone pass: keep all text above y=1180 (caption band y1180-1540) --- */
.cb-wrap{top:192px !important;height:988px !important;}.src{bottom:650px !important;;left:96px !important;}

/* ax caption-safe v3: center ~y920, clamp bottom<=1340 (repo band bottom=1540) */
#axsafe{position:absolute;left:0;top:0;width:1080px;height:1920px;transform:translate(120px,-196px);}

#axsafe{transform:translate(140px,-196px)!important;}
.cb-wrap{width:930px!important;}
.cb-title{font-size:54px!important;margin-bottom:250px!important;}
.cb-plot{height:470px!important;}
.cb-val{font-size:50px!important;}
.cb-lab{font-size:30px!important;}
.src{left:96px!important;}
''',
    "body": r'''<div id="axsafe"><div class="cb-wrap"><div class="cb-title" id="cbTitle">__TITLE__</div>
<div class="cb-plot">
<div class="cb-col" id="cbc1"><div class="cb-val" id="cbv1">__C1_VALUE__</div><div class="cb-bar" id="cbb1" style="background:#00D4AA"></div><div class="cb-lab">__C1_LABEL__</div></div>
<div class="cb-col" id="cbc2"><div class="cb-val" id="cbv2">__C2_VALUE__</div><div class="cb-bar" id="cbb2" style="background:#FF7A3C"></div><div class="cb-lab">__C2_LABEL__</div></div>
<div class="cb-col" id="cbc3"><div class="cb-val" id="cbv3">__C3_VALUE__</div><div class="cb-bar" id="cbb3" style="background:#00D4AA"></div><div class="cb-lab">__C3_LABEL__</div></div>
</div></div>
<div class="src" id="cbSrc"><div class="src-bar"></div><div class="src-txt">SOURCE: __SOURCE__</div></div></div>''',
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

__fit(".cb-title",888,160,0,1);__fit(".cb-val",200,0,1,1);__fit(".cb-lab",220,120,0,1);__fit(".src-txt",820,0,1,0);
function show(id,a,b,dy){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.opacity=e;el.style.transform='translateY('+(dy*(1-e))+'px)';}}
function grow(id,a,b){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.transform='scaleX('+e+')';}}
var vals=[['cbc1','cbb1','cbv1','__C1_VALUE__'],['cbc2','cbb2','cbv2','__C2_VALUE__'],['cbc3','cbb3','cbv3','__C3_VALUE__']];
var nums=vals.map(function(v){return parseFloat((v[3].match(/[\d.]+/)||[0])[0]);});
var mx=Math.max.apply(null,nums)||1;
vals.forEach(function(v,i){var col=document.getElementById(v[0]);if(col&&col.querySelector('.cb-lab').textContent.indexOf('__')>-1){col.style.display='none';return;}
var e=easeOutCubic(clamp((t-0.6-i*0.25)/0.9));document.getElementById(v[1]).style.height=(e*(nums[i]/mx)*400)+'px';
document.getElementById(v[2]).style.opacity=easeOutCubic(clamp((t-0.9-i*0.25)/0.5));});
show('cbTitle',S(0,2),E(0,2),26);
var s=document.getElementById('cbSrc');if(s){var ok=s.textContent.indexOf('__')<0 && s.textContent.replace('SOURCE:','').trim().length>0 && s.textContent.replace('SOURCE:','').trim().toUpperCase().indexOf('ILLUSTRATIVE')!==0;s.style.opacity=ok?easeOutCubic(clamp((t-S(1,2))/(E(1,2)-S(1,2)))):0;}''',
}
