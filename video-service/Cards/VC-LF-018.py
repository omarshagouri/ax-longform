# VC-LF-018 | Long-form chapter divider
# 1920x1080. Purpose-built to match the established AmpCoreX chapter-divider style:
# teal chapter number + large white title + thin teal accent line over the title.
CARD = {
    "id": "VC-LF-018",
    "slots": ["CHAPTER_NUM", "TITLE"],
    "default_duration": 3.0,
    "css": r"""
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;600&display=swap');

.ch-root{
  position:absolute;
  inset:0;
  width:1920px;
  height:1080px;
  background:transparent;
  overflow:hidden;
}
.ch-wrap{
  position:absolute;
  left:230px;
  right:230px;
  top:430px;
  min-height:260px;
  display:flex;
  align-items:flex-start;
  justify-content:center;
}
.ch-number{
  flex:0 0 auto;
  margin-top:18px;
  margin-right:34px;
  font-family:'Orbitron',sans-serif;
  font-size:76px;
  line-height:1;
  font-weight:600;
  letter-spacing:-1px;
  color:#00D4AA;
  text-shadow:0 3px 20px rgba(0,0,0,.35);
  opacity:0;
  transform:translateX(-22px);
}
.ch-titlebox{
  position:relative;
  width:1210px;
  padding-top:34px;
  text-align:center;
}
.ch-accent{
  position:absolute;
  top:0;
  left:50%;
  width:380px;
  height:5px;
  border-radius:999px;
  background:#00D4AA;
  transform:translateX(-50%) scaleX(0);
  transform-origin:center;
  box-shadow:0 0 18px rgba(0,212,170,.28);
}
.ch-title{
  margin:0;
  font-family:'Orbitron',sans-serif;
  font-size:78px;
  line-height:.98;
  font-weight:500;
  letter-spacing:-2.1px;
  color:#FFFFFF;
  text-align:center;
  text-shadow:0 4px 28px rgba(0,0,0,.42);
  max-width:1210px;
  opacity:0;
  transform:translateY(20px);
}
""",
    "body": r"""
<div class="ch-root">
  <div class="ch-wrap">
    <div class="ch-number" id="chNum">__CHAPTER_NUM__</div>
    <div class="ch-titlebox">
      <div class="ch-accent" id="chAccent"></div>
      <h1 class="ch-title" id="chTitle">__TITLE__</h1>
    </div>
  </div>
</div>
""",
    "seek": r"""
var n=document.getElementById('chNum');
var h=document.getElementById('chTitle');
var a=document.getElementById('chAccent');

if(n){
  var txt=(n.textContent||'').trim();
  if(txt && txt.slice(-1)!=='.'){ n.textContent=txt+'.'; }
}

if(window.__fit){
  __fit('.ch-title',1210,190,0,1);
}

var pLine=easeOutCubic(clamp((t-0.08)/0.42));
if(a){
  a.style.transform='translateX(-50%) scaleX('+pLine+')';
  a.style.opacity=pLine;
}

var pNum=easeOutCubic(clamp((t-0.18)/0.52));
if(n){
  n.style.opacity=pNum;
  n.style.transform='translateX('+(-22*(1-pNum))+'px)';
}

var pTitle=easeOutCubic(clamp((t-0.28)/0.72));
if(h){
  h.style.opacity=pTitle;
  h.style.transform='translateY('+(20*(1-pTitle))+'px)';
}
"""
}
