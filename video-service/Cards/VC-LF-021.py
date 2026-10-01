# VC-LF-021 | AmpCoreX long-form 1920x1080 conversion v1
# Motion is duration-aware and reserves only the final 1.0 s as a settled hold.
CARD = {
    "id": 'VC-LF-021',
    "slots": ['ROLE_TEXT'],
    "default_duration": 3.5,
    "css": r'''.lt-strip{position:absolute;left:96px;bottom:420px;display:flex;align-items:stretch;opacity:0;transform:translateX(-40px);}
.lt-accent{width:12px;background:#00D4AA;border-radius:4px;}
.lt-body{background:rgba(10,22,40,.85);border:1px solid rgba(0,212,170,.35);border-left:none;border-radius:0 14px 14px 0;padding:26px 36px;}
.lt-role{font-family:'Space Grotesk';font-weight:700;font-size:48px;color:#FFFFFF;}
.lt-sub{font-family:Inter;font-weight:500;font-size:32px;color:#00D4AA;letter-spacing:.1em;text-transform:uppercase;margin-top:6px;}

/* --- caption-safe-zone pass: keep all text above y=1180 (caption band y1180-1540) --- */
.lt-strip{bottom:820px !important;}

/* ax caption-safe v3: center ~y920, clamp bottom<=1340 (repo band bottom=1540) */
#axsafe{position:absolute;left:0;top:0;width:1080px;height:1920px;transform:translate(120px,-483px);}

#axsafe{transform:translate(140px,-483px)!important;}
.lt-strip{left:96px!important;}
.lt-role{font-size:44px!important;}
.lt-sub{font-size:28px!important;}
''',
    "body": r'''<div id="axsafe"><div class="lt-strip" id="ltStrip"><div class="lt-accent"></div><div class="lt-body"><div class="lt-role">__ROLE_TEXT__</div><div class="lt-sub">AmpCoreX</div></div></div></div>''',
    "seek": r'''
var x=(typeof x!=='undefined'&&x>0)?x:3.5;
var HOLD=1.0;
var ACTIVE=Math.max(0.25,x-HOLD);
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
__fit(".lt-role",700,0,1,0);
var e=easeOutCubic(clamp(t/ACTIVE));
var s=document.getElementById('ltStrip');
s.style.opacity=e;
s.style.transform='translateX('+(-40*(1-e))+'px)';
''',
}
