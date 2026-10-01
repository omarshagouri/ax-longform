# VC-LF-030 | AmpCoreX long-form 1920x1080 conversion v1
# Motion is duration-aware and reserves only the final 1.0 s as a settled hold.
CARD = {
    "id": 'VC-LF-030',
    "name": 'Blueprint Sequential Build',
    "slots": ['HOOK', 'DATA_LABEL', 'DATA_VALUE', 'TAKEAWAY'],
    "default_duration": 6.0,
    "css": r'''
        .grid-container { display: flex; flex-direction: column; height: 100%; padding: 30px; box-sizing: border-box; background: #0f1115; color: #e2e8f0; border: 1px solid #334155; border-radius: 8px; }
        .header-block, .data-block, .footer-block { opacity: 0; }
        .header-block { border-bottom: 1px solid #334155; padding-bottom: 20px; }
        .tag { font-family: 'JetBrains Mono', monospace; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
        .title { font-family: 'Space Grotesk', sans-serif; font-size: 24px; font-weight: 700; color: #f8fafc; line-height: 1.2; }
        .data-block { flex-grow: 1; display: flex; flex-direction: column; justify-content: center; }
        .data-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 15px; }
        .chem-label { font-family: 'Space Grotesk', sans-serif; font-size: 20px; font-weight: 700; }
        .chem-value { font-family: 'JetBrains Mono', monospace; font-size: 22px; font-weight: 400; color: #38bdf8; }
        .footer-block { background: #1e293b; padding: 20px; border-radius: 6px; border-left: 3px solid #38bdf8; }
        .footer-title { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; color: #38bdf8; margin-bottom: 8px; text-transform: uppercase;}
        .footer-text { font-size: 13px; line-height: 1.5; color: #cbd5e1; }
    
/* LF native landscape engineering blueprint */
.grid-container{
  position:absolute!important;left:120px!important;top:110px!important;
  width:1180px!important;height:860px!important;
  padding:54px!important;box-sizing:border-box!important;
  background:rgba(15,17,21,.82)!important;
  border:1px solid rgba(0,212,170,.32)!important;border-radius:18px!important;
}
.header-block{padding-bottom:30px!important;}
.tag{font-size:18px!important;letter-spacing:2px!important;margin-bottom:14px!important;}
.title{font-size:58px!important;line-height:1.12!important;}
.data-row{margin-bottom:20px!important;}
.chem-label{font-size:48px!important;}
.chem-value{font-size:60px!important;color:#00D4AA!important;}
.footer-block{padding:30px!important;border-radius:12px!important;border-left:5px solid #00D4AA!important;}
.footer-title{font-size:18px!important;color:#00D4AA!important;margin-bottom:12px!important;}
.footer-text{font-size:32px!important;line-height:1.35!important;}
''',
    "body": r'''
        <div class="grid-container">
            <div class="header-block" id="block-1">
                <div class="tag">Analysis</div>
                <div class="title">__HOOK__</div>
            </div>
            <div class="data-block" id="block-2">
                <div class="data-row">
                    <div class="chem-label">__DATA_LABEL__</div>
                    <div class="chem-value">__DATA_VALUE__</div>
                </div>
            </div>
            <div class="footer-block" id="block-3">
                <div class="footer-title">Engineering Note</div>
                <div class="footer-text">__TAKEAWAY__</div>
            </div>
        </div>
    ''',
    "seek": r'''
var x=(typeof x!=='undefined'&&x>0)?x:6.0;
var HOLD=1.0, ENTER=0.55;
function S(i,N){
  var a=0.08*x, end=x-HOLD-ENTER;
  return N<2?a:a+(i/(N-1))*(end-a);
}
function E(i,N){return N<2?x-HOLD:S(i,N)+ENTER;}
function reveal(id,a,b,dy){
  var p=easeOutCubic(clamp((t-a)/(b-a)));
  var el=document.getElementById(id);
  if(el){el.style.opacity=p;el.style.transform='translateY('+((1-p)*dy)+'px)';}
}
reveal('block-1',S(0,3),E(0,3),20);
reveal('block-2',S(1,3),E(1,3),20);
reveal('block-3',S(2,3),E(2,3),20);
''',
}
