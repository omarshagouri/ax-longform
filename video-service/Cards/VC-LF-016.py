# VC-LF-016 | AmpCoreX long-form centered layout v2
# 1920x1080. Main content is optically centered; lower subtitle band is protected.
# Motion remains duration-aware: animate through duration-1s, hold only the final 1s.
CARD = {
    "id": 'VC-LF-016',
    "slots": ['P1_YEAR', 'P1_LABEL', 'P2_YEAR', 'P2_LABEL', 'P3_YEAR', 'P3_LABEL', 'P4_YEAR', 'P4_LABEL'],
    "default_duration": 4.5,
    "css": r'''.tl-wrap{position:absolute;left:96px;top:0;width:888px;height:100%;display:flex;flex-direction:column;justify-content:center;}
.tl-line{position:relative;height:6px;background:rgba(140,160,184,.25);border-radius:3px;margin:0 20px;}
.tl-prog{position:absolute;left:0;top:0;height:100%;width:100%;background:#00D4AA;transform:scaleX(0);transform-origin:left;border-radius:3px;}
.tl-pts{position:relative;display:flex;justify-content:space-between;margin:0 20px;}
.tl-pt{position:absolute;transform:translateX(-50%);text-align:center;top:-14px;opacity:0;width:260px;}
.tl-dot{width:30px;height:30px;border-radius:50%;background:#00D4AA;margin:0 auto 18px;box-shadow:0 0 0 8px rgba(0,212,170,.18);}
.tl-yr{font-family:'Space Grotesk';font-weight:700;font-size:44px;color:#FFFFFF;}
.tl-lb{font-family:Inter;font-weight:400;font-size:32px;color:#8CA0B8;max-width:230px;margin:8px auto 0;line-height:1.2;}

/* --- caption-safe-zone pass: keep all text above y=1180 (caption band y1180-1540) --- */
.tl-wrap{top:192px !important;height:988px !important;}

/* ax caption-safe v3: center ~y920, clamp bottom<=1340 (repo band bottom=1540) */
#axsafe{position:absolute;left:0;top:0;width:1080px;height:1920px;transform:translate(120px,-193px);}

#axsafe{transform:translate(140px,-193px)!important;}
.tl-wrap{width:980px!important;}
.tl-yr{font-size:38px!important;line-height:1.08!important;}
.tl-lb{font-size:26px!important;line-height:1.22!important;}

/* ===== LF V2 universal centered composition =====
   Optical content center ~= x 880 px.
   Scale 0.78 reduces Shorts-scale typography/graphics.
   Transform origin y=540 pulls high titles down and low graphics up.
   Approx. bottom 220-250 px remains available for subtitles. */
#axsafe{position:absolute!important;left:0!important;top:0!important;width:1080px!important;height:1920px!important;
transform:translate(340px,-193px) scale(.78)!important;transform-origin:540px 540px!important;}

/* LF V2 per-card readability scale */
#axsafe{transform:translate(340px,-193px) scale(0.92)!important;transform-origin:540px 540px!important;}
''',
    "body": r'''<div id="axsafe"><div class="tl-wrap"><div class="tl-line"><div class="tl-prog" id="tlProg"></div>
<div class="tl-pts" id="tlPts">
<div class="tl-pt" id="tp1" style="left:8%"><div class="tl-dot"></div><div class="tl-yr">__P1_YEAR__</div><div class="tl-lb">__P1_LABEL__</div></div>
<div class="tl-pt" id="tp2" style="left:36%"><div class="tl-dot"></div><div class="tl-yr">__P2_YEAR__</div><div class="tl-lb">__P2_LABEL__</div></div>
<div class="tl-pt" id="tp3" style="left:64%"><div class="tl-dot"></div><div class="tl-yr">__P3_YEAR__</div><div class="tl-lb">__P3_LABEL__</div></div>
<div class="tl-pt" id="tp4" style="left:92%"><div class="tl-dot"></div><div class="tl-yr">__P4_YEAR__</div><div class="tl-lb">__P4_LABEL__</div></div>
</div></div></div></div>''',
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

var x=(typeof x!=='undefined'&&x>0)?x:4;var HOLD=1,ENTER=0.5;function S(i,N){return N<2?0.12*x:0.12*x+(i/(N-1))*((x-HOLD-ENTER)-0.12*x);}function E(i,N){return N<2?x-HOLD:S(i,N)+ENTER;}
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

function show(id,a,b,dy){
    var e=easeOutCubic(clamp((t-a)/(b-a)));
    var el=document.getElementById(id);
    if(el){
        el.style.opacity=e;
        el.style.transform='translateX(-50%) translateY('+(dy*(1-e))+'px)';
    }
}
function grow(id,a,b){
    var e=easeOutCubic(clamp((t-a)/(b-a)));
    var el=document.getElementById(id);
    if(el){el.style.transform='scaleX('+e+')';}
}

/* Optional timeline points:
   Empty YEAR+LABEL pairs disappear completely.
   Remaining points are redistributed across the timeline.
   One point becomes a centered single-date card instead of leaving 3 empty dots. */
var ids=['tp1','tp2','tp3','tp4'];
var visible=[];

ids.forEach(function(id){
    var el=document.getElementById(id);
    if(!el){return;}

    var yr=el.querySelector('.tl-yr');
    var lb=el.querySelector('.tl-lb');

    var year=yr?(yr.textContent||'').trim():'';
    var label=lb?(lb.textContent||'').trim():'';

    var unresolved=(year.indexOf('__')>-1 || label.indexOf('__')>-1);
    var empty=(year.length===0 && label.length===0);

    if(unresolved || empty){
        el.style.display='none';
    }else{
        el.style.display='';
        visible.push(el);
    }
});

var N=visible.length;
var line=document.querySelector('.tl-line');
var prog=document.getElementById('tlProg');

if(N===0){
    if(line){line.style.display='none';}
}else if(N===1){
    /* One real event:
       keep the timeline language. Show a short centered line + one dot,
       then reveal the date and label beneath it. */
    var el=visible[0];
    el.style.left='50%';
    el.style.width='760px';

    var yr=el.querySelector('.tl-yr');
    var lb=el.querySelector('.tl-lb');

    if(yr){
        yr.style.maxWidth='700px';
        yr.style.fontSize='46px';
        yr.style.lineHeight='1.08';
        yr.style.whiteSpace='nowrap';
    }
    if(lb){
        lb.style.maxWidth='640px';
        lb.style.fontSize='30px';
        lb.style.lineHeight='1.22';
    }

    if(line){
        line.style.width='560px';
        line.style.margin='0 auto';
        line.style.background='rgba(140,160,184,.25)';
        line.style.transform='translateY(70px)';
    }
    if(prog){
        prog.style.display='block';
        prog.style.transformOrigin='center';
    }

    __fit("#"+el.id+" .tl-yr",700,110,1,1);
    __fit("#"+el.id+" .tl-lb",640,160,0,1);

    /* Draw the short line first, then bring in the milestone.
       The final second remains a settled hold. */
    var lineEnd=Math.max(0.35,S(0,1)+0.75);
    grow('tlProg',0.08,lineEnd);
    show(el.id,Math.max(0.18,lineEnd*0.55),E(0,1),18);
}else{
    /* Evenly distribute 2–4 real milestones. */
    var positions={
        2:[20,80],
        3:[12,50,88],
        4:[8,36,64,92]
    }[N];

    visible.forEach(function(el,i){
        el.style.left=positions[i]+'%';
        el.style.width=(N===2?'360px':N===3?'300px':'250px');

        var yr=el.querySelector('.tl-yr');
        var lb=el.querySelector('.tl-lb');
        if(yr){yr.style.maxWidth=(N===2?'340px':N===3?'280px':'230px');}
        if(lb){lb.style.maxWidth=(N===2?'340px':N===3?'280px':'230px');}

        show(el.id,S(i,N),E(i,N),18);
    });

    /* The teal line animates only when there is an actual timeline. */
    grow('tlProg',S(0,N),E(N-1,N));
}''',
}
