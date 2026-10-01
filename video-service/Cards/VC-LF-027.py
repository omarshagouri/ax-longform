# VC-LF-027 | AmpCoreX long-form 1920x1080 conversion v1
# Motion is duration-aware and reserves only the final 1.0 s as a settled hold.
CARD = {
    "id": 'VC-LF-027',
    "slots": [],
    "default_duration": 2.5,
    "css": r'''.sting-wrap{position:absolute;left:0;top:0;width:1080px;height:100%;display:flex;align-items:center;justify-content:center;}
.sting-x{font-family:'Space Grotesk';font-weight:700;font-size:420px;color:#00D4AA;opacity:0;transform:scale(0.6);text-shadow:0 0 60px rgba(0,212,170,.0);}
/* LF native full-canvas sting */
.sting-wrap{position:absolute!important;left:0!important;top:0!important;width:1920px!important;height:1080px!important;}
.sting-x{font-size:520px!important;}
''',
    "body": r'''<div class="sting-wrap"><div class="sting-x" id="stingX">X</div></div>''',
    "seek": r'''
var x=(typeof x!=='undefined'&&x>0)?x:2.5;
var HOLD=1.0;
var ACTIVE=Math.max(0.25,x-HOLD);
var p=clamp(t/ACTIVE);
var e=easeOutCubic(p);
var xel=document.getElementById('stingX');
xel.style.opacity=Math.min(1,e*1.15);
xel.style.transform='scale('+(0.6+0.4*e)+')';
var glow=40+80*Math.sin(p*Math.PI);
xel.style.textShadow='0 0 '+glow+'px rgba(0,212,170,'+(0.35+0.45*e)+')';
''',
}
