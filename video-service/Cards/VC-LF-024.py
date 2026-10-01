# VC-LF-024 | AmpCoreX long-form centered layout v2
# 1920x1080. Main content is optically centered; lower subtitle band is protected.
# Motion remains duration-aware: animate through duration-1s, hold only the final 1s.
CARD = {
    "id": 'VC-LF-024',
    "slots": ['TITLE', 'PATH', 'X_LABEL', 'Y_LABEL', 'ANNOTATION'],
    "default_duration": 4.5,
    "css": r'''.cl-wrap{position:absolute;left:96px;top:0;width:888px;height:100%;display:flex;flex-direction:column;justify-content:center;}
.cl-title{font-family:'Space Grotesk';font-weight:700;font-size:56px;color:#00D4AA;text-align:center;margin-bottom:44px;opacity:0;transform:translateY(24px);}
.cl-plot{position:relative;width:820px;height:460px;margin:0 auto;}
.cl-yl{position:absolute;left:-120px;top:50%;transform:translateY(-50%) rotate(-90deg);font-family:'Space Grotesk';font-weight:600;font-size:32px;color:#00D4AA;letter-spacing:1px;}
.cl-xl{position:absolute;bottom:-90px;left:50%;transform:translateX(-50%);font-family:'Space Grotesk';font-weight:600;font-size:32px;color:#00D4AA;letter-spacing:1px;}
.cl-anno{font-family:Inter;font-weight:500;font-size:38px;color:#FFFFFF;text-align:center;margin-top:160px;opacity:0;transform:translateY(22px);}
.t-y{position:absolute;left:-20px;transform:translate(-100%, -50%);font-family:Inter;font-weight:500;font-size:24px;color:#8CA0B8;opacity:0;}
.t-x{position:absolute;bottom:-40px;transform:translateX(-50%);font-family:Inter;font-weight:500;font-size:24px;color:#8CA0B8;opacity:0;}

/* --- caption-safe-zone pass: keep all text above y=1180 (caption band y1180-1540) --- */
.cl-wrap{top:192px !important;height:988px !important;}

/* ax caption-safe v3: center ~y920, clamp bottom<=1340 (repo band bottom=1540) */
#axsafe{position:absolute;left:0;top:0;width:1080px;height:1920px;transform:translate(120px,-150px);}

#axsafe{transform:translate(140px,-150px)!important;}
.cl-wrap{width:930px!important;}
.cl-title{font-size:50px!important;}
.cl-anno{font-size:34px!important;margin-top:135px!important;}

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
    "body": r'''<div id="axsafe"><div class="cl-wrap"><div class="cl-title" id="clTitle">__TITLE__</div>
<div class="cl-plot"><svg width="820" height="460" style="overflow:visible">
<!-- Gridlines -->
<line x1="10" y1="10" x2="810" y2="10" stroke="rgba(140,160,184,.15)" stroke-width="2" stroke-dasharray="10 10"/>
<line x1="10" y1="230" x2="810" y2="230" stroke="rgba(140,160,184,.15)" stroke-width="2" stroke-dasharray="10 10"/>
<!-- Axes -->
<line x1="10" y1="450" x2="820" y2="450" stroke="rgba(140,160,184,.6)" stroke-width="2.5" stroke-linecap="round"/>
<line x1="10" y1="0" x2="10" y2="450" stroke="rgba(140,160,184,.6)" stroke-width="2.5" stroke-linecap="round"/>
<polyline id="clPath" points="__PATH__" fill="none" stroke="#00D4AA" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
<!-- Auto-populated Scale Ticks -->
<div class="t-y" id="tyMax" style="top:10px;"></div>
<div class="t-y" id="tyMin" style="top:450px;"></div>
<div class="t-x" id="txMin" style="left:10px;"></div>
<div class="t-x" id="txMax" style="left:810px;"></div>
<div class="cl-yl" id="clYl">__Y_LABEL__</div><div class="cl-xl">__X_LABEL__</div></div>
<div class="cl-anno" id="clAnno">__ANNOTATION__</div></div></div>''',
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

__fit(".cl-title",888,140,0,1);__fit(".cl-anno",888,180,0,1);
function show(id,a,b,dy){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.opacity=e;el.style.transform='translateY('+(dy*(1-e))+'px)';}}
show('clTitle',S(0,3),E(0,3),24);

var p=document.getElementById('clPath');
if(p){
  if(!p.dataset.mapped){
    var pts=(p.getAttribute('points')||'').trim().split(/\s+/).map(function(s){
      var xy=s.split(',');return [parseFloat(xy[0]),parseFloat(xy[1])];
    }).filter(function(a){return !isNaN(a[0])&&!isNaN(a[1]);});
    
    var len=0, nPts=[];
    if(pts.length > 0){
      var mX=pts[0][0], MX=pts[0][0], mY=pts[0][1], MY=pts[0][1];
      var sx=800/100, sy=440/100;
      var px=0, py=0;
      
      for(var qi=0; qi<pts.length; qi++){
        if(pts[qi][0]<mX) mX=pts[qi][0];
        if(pts[qi][0]>MX) MX=pts[qi][0];
        if(pts[qi][1]<mY) mY=pts[qi][1];
        if(pts[qi][1]>MY) MY=pts[qi][1];

        var nx = 10 + pts[qi][0] * sx;
        var ny = 10 + (440 - pts[qi][1] * sy); 
        nPts.push(nx + ',' + ny);
        
        if(qi > 0){
          var dx = nx - px, dy = ny - py;
          len += Math.sqrt(dx*dx + dy*dy);
        }
        px = nx; py = ny;
      }
      p.setAttribute('points', nPts.join(' '));
      
      var yLab = document.getElementById('clYl');
      var suf = (yLab && yLab.textContent.indexOf('%') > -1) ? '%' : '';
      document.getElementById('txMin').textContent = Math.round(mX);
      document.getElementById('txMax').textContent = Math.round(MX);
      document.getElementById('tyMin').textContent = Math.round(mY) + suf;
      document.getElementById('tyMax').textContent = Math.round(MY) + suf;
    }
    
    p.dataset.len = len || 800;
    p.dataset.mapped = '1';
  }
  
  var L=parseFloat(p.dataset.len);
  p.style.strokeDasharray = L;
  var e=easeOutCubic(clamp((t-S(1,3))/(E(1,3)-S(1,3))));
  p.style.strokeDashoffset = L * (1 - e);
  
  ['tyMax','tyMin','txMin','txMax'].forEach(function(i){
    var d=document.getElementById(i); if(d) d.style.opacity = e;
  });
}

show('clAnno',S(2,3),E(2,3),22);
''',
}
