# VC-LF-015 | AmpCoreX long-form cost / price hero metric
# Native 1920x1080 layout. Duration-aware animation; final 1.0 s is a settled hold.
CARD = {
    "id": "VC-LF-015",
    "slots": ["AMOUNT", "LABEL", "SOURCE"],
    "default_duration": 4.0,

    "css": r'''
        .cost-wrap{
            position:absolute;
            left:430px;
            top:255px;
            width:900px;
            height:390px;
            display:flex;
            flex-direction:column;
            justify-content:center;
            align-items:center;
            text-align:center;
        }

        .cost-lab{
            font-family:'Space Grotesk',sans-serif;
            font-weight:600;
            font-size:40px;
            letter-spacing:.14em;
            text-transform:uppercase;
            color:#9CB1C8;
            margin:0 0 28px;
            opacity:0;
            transform:translateY(18px);
        }

        .cost-rule{
            width:92px;
            height:5px;
            border-radius:999px;
            background:#00D4AA;
            margin:0 0 30px;
            opacity:0;
            transform:scaleX(0);
            transform-origin:center;
        }

        .cost-amt{
            font-family:'Space Grotesk',sans-serif;
            font-weight:700;
            font-size:146px;
            line-height:1;
            color:#FFFFFF;
            letter-spacing:-0.035em;
            margin:0;
            opacity:0;
            transform:scale(.90);
            text-shadow:0 0 36px rgba(0,212,170,.10);
        }

        .src{
            position:absolute;
            left:430px;
            top:690px;
            width:900px;
            display:flex;
            justify-content:center;
            align-items:center;
            gap:12px;
            opacity:0;
        }

        .src-bar{
            width:34px;
            height:3px;
            border-radius:999px;
            background:#00D4AA;
        }

        .src-txt{
            font-family:Inter,sans-serif;
            font-weight:600;
            font-size:24px;
            letter-spacing:.02em;
            color:#8CA0B8;
            white-space:nowrap;
        }
    ''',

    "body": r'''
        <div class="cost-wrap">
            <div class="cost-lab" id="coLab">__LABEL__</div>
            <div class="cost-rule" id="coRule"></div>
            <div class="cost-amt" id="coAmt">__AMOUNT__</div>
        </div>

        <div class="src" id="coSrc">
            <div class="src-bar"></div>
            <div class="src-txt">SOURCE: __SOURCE__</div>
        </div>
    ''',

    "seek": r'''
var x=(typeof x!=='undefined'&&x>0)?x:4.0;
var HOLD=1.0;
var ACTIVE=Math.max(0.25,x-HOLD);
var p=clamp(t/ACTIVE);

if(!window.__fit){window.__fit=function(sel,maxW,maxH,line,center){
var els=document.querySelectorAll(sel);var ready=(!document.fonts)||document.fonts.status==='loaded';
for(var i=0;i<els.length;i++){var el=els[i];
if(el.dataset.fitok==='1'){el.style.fontSize=el.dataset.fitpx+'px';continue;}
if(!el.dataset.fbase){el.dataset.fbase=(parseFloat(getComputedStyle(el).fontSize)||40);}
if(maxW){el.style.maxWidth=maxW+'px';if(center){el.style.marginLeft='auto';el.style.marginRight='auto';}}
el.style.whiteSpace=line?'nowrap':'normal';
if(!line){el.style.overflowWrap='break-word';el.style.wordBreak='break-word';}
var size=parseFloat(el.dataset.fbase);el.style.fontSize=size+'px';var g=0;
while(size>18&&g<240&&(el.scrollWidth>el.clientWidth+0.5||(maxH&&el.scrollHeight>maxH+0.5))){
size-=2;el.style.fontSize=size+'px';g++;
}
if(ready){el.dataset.fitpx=size;el.dataset.fitok='1';}}
};}

__fit(".cost-lab",860,110,0,1);
__fit(".cost-amt",880,180,1,1);
__fit(".src-txt",820,0,1,1);

function seg(a,b){return easeOutCubic(clamp((p-a)/(b-a)));}

var lab=document.getElementById('coLab');
var rule=document.getElementById('coRule');
var amt=document.getElementById('coAmt');
var src=document.getElementById('coSrc');

var e1=seg(0.00,0.30);
lab.style.opacity=e1;
lab.style.transform='translateY('+(18*(1-e1))+'px)';

var er=seg(0.18,0.48);
rule.style.opacity=er;
rule.style.transform='scaleX('+er+')';

var e2=seg(0.30,0.88);
amt.style.opacity=e2;
amt.style.transform='scale('+(0.90+0.10*e2)+')';

var sourceText=src ? src.textContent.replace('SOURCE:','').trim() : '';
var sourceOK=src && sourceText.length>0 && sourceText.indexOf('__')<0 && sourceText.toUpperCase().indexOf('ILLUSTRATIVE')!==0;
if(src){
    var e3=seg(0.72,1.00);
    src.style.opacity=sourceOK?e3:0;
}
    ''',
}
