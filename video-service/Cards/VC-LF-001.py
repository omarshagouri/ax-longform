# VC-LF-001 — AmpCoreX long-form hero-number card
# Native canvas: 1920x1080 (16:9). Designed to keep the decorative X visible on the right.
CARD = {
    "id": "VC-LF-001",
    "slots": ["KICKER", "NUM", "PCT"],
    "default_duration": 3.0,
    "css": r'''
        #axsafe{
            position:absolute;
            inset:0;
            width:1920px;
            height:1080px;
        }
        #block{
            position:absolute;
            left:120px;
            top:285px;
            width:1120px;
            text-align:center;
        }
        .kicker{
            color:#8CA0B8;
            font-size:44px;
            font-weight:500;
            letter-spacing:7px;
            text-transform:uppercase;
            margin:0 0 18px;
            clip-path:inset(0 100% 0 0);
        }
        .hero{
            color:#FFFFFF;
            font-size:260px;
            font-weight:700;
            margin:0;
            line-height:0.95;
            opacity:0;
            transform:scale(0.85);
            transform-origin:center center;
        }
        .hero .key{ color:#00D4AA; }
    ''',
    "body": r'''<div id="axsafe">
        <div id="block">
            <p class="kicker" id="kick">__KICKER__</p>
            <h1 class="hero" id="hero">__NUM__<span class="key">__PCT__</span></h1>
        </div>
    </div>''',
    "seek": r'''
if(!window.__fit){window.__fit=function(sel,maxW,maxH,line,center){
var els=document.querySelectorAll(sel);var ready=(!document.fonts)||document.fonts.status==='loaded';
for(var i=0;i<els.length;i++){var el=els[i];
if(el.dataset.fitok==='1'){el.style.fontSize=el.dataset.fitpx+'px';continue;}
if(!el.dataset.fbase){el.dataset.fbase=(parseFloat(getComputedStyle(el).fontSize)||40);}
if(maxW){el.style.maxWidth=maxW+'px';if(center){el.style.marginLeft='auto';el.style.marginRight='auto';}}
el.style.whiteSpace=line?'nowrap':'normal';if(!line){el.style.overflowWrap='break-word';el.style.wordBreak='break-word';}
var size=parseFloat(el.dataset.fbase);el.style.fontSize=size+'px';var g=0;
while(size>18&&g<240&&(el.scrollWidth>el.clientWidth+0.5||(maxH&&el.scrollHeight>maxH+0.5))){size-=2;el.style.fontSize=size+'px';g++;}
if(ready){el.dataset.fitpx=size;el.dataset.fitok='1';}}
};}

var keyEl=document.querySelector('.hero .key');
if(keyEl && keyEl.textContent.trim().length>3){
    keyEl.style.display='block';
    keyEl.style.fontSize='54px';
    keyEl.style.marginTop='22px';
    keyEl.style.fontFamily='Inter, sans-serif';
    keyEl.style.fontWeight='600';
    keyEl.style.whiteSpace='normal';
}

__fit('.kicker',1080,90,0,1);
__fit('.hero',1120,330,1,1);

var kick=document.getElementById('kick');
var hero=document.getElementById('hero');
var we=easeOutCubic(clamp((t-0.0)/0.8));
kick.style.clipPath='inset(0 '+(100*(1-we))+'% 0 0)';
var pp=clamp((t-0.75)/0.5);
hero.style.opacity=pp>0?1:0;
var scale;
if(pp<0.6){scale=0.85+(1.05-0.85)*easeOutCubic(pp/0.6);}
else{scale=1.05-(1.05-1.0)*easeOutCubic((pp-0.6)/0.4);}
hero.style.transform='scale('+scale+')';
    ''',
}
