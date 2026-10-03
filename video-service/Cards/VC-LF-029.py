# VC-LF-029 | Long-form comparison matrix
# 1920x1080. Two-column comparison with up to three reusable rows.
CARD = {
    "id": "VC-LF-029",
    "slots": [
        "TITLE",
        "LEFT_HEAD", "RIGHT_HEAD",
        "ROW1_LABEL", "LEFT1", "RIGHT1",
        "ROW2_LABEL", "LEFT2", "RIGHT2",
        "ROW3_LABEL", "LEFT3", "RIGHT3",
        "SOURCE"
    ],
    "default_duration": 5.5,
    "css": r'''
#matrix{
  position:absolute;
  left:170px;
  top:105px;
  width:1580px;
  height:780px;
  box-sizing:border-box;
}
.title{
  font-family:'Space Grotesk',sans-serif;
  font-size:72px;
  line-height:1.05;
  font-weight:700;
  color:#FFFFFF;
  text-align:center;
  margin-bottom:42px;
  opacity:0;
  transform:translateY(24px);
}
.panel{
  background:rgba(20,36,64,.88);
  border:2px solid #24375A;
  border-radius:28px;
  overflow:hidden;
  box-shadow:0 24px 80px rgba(0,0,0,.22);
}
.head{
  display:grid;
  grid-template-columns:360px 1fr 1fr;
  min-height:110px;
  border-bottom:2px solid #24375A;
}
.corner{background:rgba(10,22,40,.55);}
.hcell{
  display:flex;
  align-items:center;
  justify-content:center;
  font-family:'Space Grotesk',sans-serif;
  font-size:42px;
  font-weight:700;
  color:#FFFFFF;
  letter-spacing:.2px;
}
.hleft{border-left:2px solid #24375A;color:#00D4AA;}
.hright{border-left:2px solid #24375A;color:#FF8A4C;}
.row{
  display:grid;
  grid-template-columns:360px 1fr 1fr;
  min-height:140px;
  border-bottom:1px solid rgba(36,55,90,.9);
  opacity:0;
  transform:translateY(18px);
}
.row:last-child{border-bottom:none;}
.label{
  display:flex;
  align-items:center;
  padding:0 34px;
  font-family:Inter,sans-serif;
  font-size:30px;
  line-height:1.15;
  font-weight:700;
  color:#8CA0B8;
}
.cell{
  display:flex;
  align-items:center;
  justify-content:center;
  text-align:center;
  padding:18px 26px;
  font-family:'Space Grotesk',sans-serif;
  font-size:38px;
  line-height:1.08;
  font-weight:700;
  color:#FFFFFF;
  border-left:2px solid #24375A;
}
.leftv{background:rgba(0,212,170,.055);}
.rightv{background:rgba(255,138,76,.055);}
.source{
  position:absolute;
  left:20px;
  bottom:-82px;
  border-left:8px solid #00D4AA;
  padding-left:14px;
  font-family:Inter,sans-serif;
  font-size:24px;
  font-weight:600;
  color:#8CA0B8;
  opacity:0;
}
''',
    "body": r'''
<div id="matrix">
  <div class="title" id="mxTitle">__TITLE__</div>
  <div class="panel">
    <div class="head">
      <div class="corner"></div>
      <div class="hcell hleft" id="mxLeftHead">__LEFT_HEAD__</div>
      <div class="hcell hright" id="mxRightHead">__RIGHT_HEAD__</div>
    </div>
    <div class="row" id="mxRow1">
      <div class="label">__ROW1_LABEL__</div>
      <div class="cell leftv">__LEFT1__</div>
      <div class="cell rightv">__RIGHT1__</div>
    </div>
    <div class="row" id="mxRow2">
      <div class="label">__ROW2_LABEL__</div>
      <div class="cell leftv">__LEFT2__</div>
      <div class="cell rightv">__RIGHT2__</div>
    </div>
    <div class="row" id="mxRow3">
      <div class="label">__ROW3_LABEL__</div>
      <div class="cell leftv">__LEFT3__</div>
      <div class="cell rightv">__RIGHT3__</div>
    </div>
  </div>
  <div class="source" id="mxSource">SOURCE: __SOURCE__</div>
</div>
''',
    "seek": r'''
var x=(typeof x!=='undefined'&&x>0)?x:5.5;
var HOLD=1.0;
var active=Math.max(.4,x-HOLD);

if(!window.__fit){window.__fit=function(sel,maxW,maxH,line,center){
  var els=document.querySelectorAll(sel);
  for(var i=0;i<els.length;i++){
    var el=els[i];
    if(!el.dataset.fbase)el.dataset.fbase=(parseFloat(getComputedStyle(el).fontSize)||32);
    if(maxW){el.style.maxWidth=maxW+'px';if(center){el.style.marginLeft='auto';el.style.marginRight='auto';}}
    el.style.whiteSpace=line?'nowrap':'normal';
    if(!line){el.style.overflowWrap='break-word';el.style.wordBreak='break-word';}
    var size=parseFloat(el.dataset.fbase),g=0;
    while(size>18&&g<180&&(el.scrollWidth>el.clientWidth+1||(maxH&&el.scrollHeight>maxH+1))){
      size-=2;el.style.fontSize=size+'px';g++;
    }
  }
};}

__fit('.title',1480,120,0,1);
__fit('.hcell',560,88,0,1);
__fit('.label',320,100,0,0);
__fit('.cell',560,106,0,1);
__fit('.source',1450,60,1,0);

function e(a,b){return easeOutCubic(clamp((t-a)/(b-a)));}
function reveal(el,a,b,dy){
  if(!el)return;
  var p=e(a,b);
  el.style.opacity=p;
  el.style.transform='translateY('+(dy*(1-p))+'px)';
}

reveal(document.getElementById('mxTitle'),0.05*active,0.22*active,24);

var rows=[
  document.getElementById('mxRow1'),
  document.getElementById('mxRow2'),
  document.getElementById('mxRow3')
];
var visible=[];
rows.forEach(function(row){
  var texts=Array.prototype.map.call(row.children,function(c){return (c.textContent||'').trim();});
  var unresolved=texts.some(function(s){return s.indexOf('__')>-1;});
  var empty=texts.join('').length===0;
  if(unresolved||empty){row.style.display='none';}
  else{visible.push(row);}
});

var N=visible.length;
visible.forEach(function(row,i){
  var a=0.24*active + (N>1? i*(0.42*active/(N-1)):0);
  var b=Math.min(.82*active,a+.26*active);
  reveal(row,a,b,18);
});

var source=document.getElementById('mxSource');
var st=(source.textContent||'').replace('SOURCE:','').trim();
var sourceOk=st.length>0 && st.indexOf('__')<0 && st.toUpperCase().indexOf('ILLUSTRATIVE')!==0;
source.style.opacity=sourceOk?e(.72*active,.92*active):0;
'''
};
