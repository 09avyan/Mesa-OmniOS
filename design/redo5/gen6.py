import json
I={ # svg icons (stroke)
'mic':'<path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z"/><path d="M19 11a7 7 0 0 1-14 0M12 18v3"/>',
'cash':'<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/>',
'qr':'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v7h-4M14 18v3"/>',
'book':'<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
'check':'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
'wa':'<path d="M4 20l1.4-4.2A8 8 0 1 1 8.6 19z"/>',
'undo':'<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
'back':'<path d="M15 5l-7 7 7 7"/>',
'down':'<path d="M6 9l6 6 6-6"/>',
'home':'<path d="M4 11l8-7 8 7v9H4z"/>',
'bill':'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
'box':'<path d="M3 7l9-4 9 4-9 4z"/><path d="M3 7v10l9 4 9-4V7"/>',
'moon':'<path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z"/>',
'gear':'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
'chev':'<path d="M9 5l7 7-7 7"/>',
}
def ic(n,s=24): return f'<svg width="{s}" height="{s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{I[n]}</svg>'
# i18n: key -> (hinglish, hindi)
T={
'store':('Sharma General Store','शर्मा जनरल स्टोर'),
'today':('Aaj ki bikri','आज की बिक्री'),'bills':('68 bill','68 Bill'),
'cash':('Cash','Cash'),'upi':('UPI','UPI'),'ud':('Udhaar','उधार'),
'lena':('Paisa lena hai','पैसा लेना है'),'lena2':('15 log se','15 लोगों से'),'yaad':('Yaad dilao','याद दिलाओ'),
'aajbill':('Aaj ke bill','आज के बिल'),'online':('2 naye online order','2 नए online order'),'dekho':('Dekho','देखो'),
'bolo':('Bolo','बोलो'),'bolohint':('“Sharma ji, 2 kilo cheeni…”','“शर्मा जी, 2 किलो चीनी…”'),
'ghar':('Ghar','घर'),'billt':('Bill','Bill'),'maal':('Maal','माल'),
'sun':('Sun raha hoon','सुन रहा हूँ'),'naya':('Naya bill','नया Bill'),'abtak':('Ab tak','अब तक'),'hogaya':('Ho gaya','हो गया'),
'speech':('Sharma ji, do kilo cheeni, ek Maggi, aadha kilo','शर्मा जी, दो किलो चीनी, एक मैगी, आधा किलो'),'speech2':('toor dal','तूर दाल'),
'check':('Bill check karo','Bill जाँच लो'),'cheeni':('Cheeni','चीनी'),'maggi':('Maggi chhota','मैगी छोटा'),'toor':('Toor dal','तूर दाल'),
'kg2':('2 kg','2 किलो'),'one':('1 packet','1 पैकेट'),'half':('aadha kg','आधा किलो'),
'q':('Maggi chhota wala?','छोटा वाला मैगी?'),'qsub':('₹14 ka packet','₹14 का packet'),'haan':('Haan','हाँ'),'doosri':('Doosri','दूसरी'),
'kul':('Kul','कुल'),'aage':('Aage · Paisa','आगे · पैसा'),
'kaise':('Paisa kaise mila?','पैसा कैसे मिला?'),'khata':('Sharma ji ka khata','शर्मा जी का खाता'),
'save':('Udhaar mein likho','उधार में लिखो'),'saved':('Bill save ho gaya','Bill save हो गया'),
'agla':('Agla bill','अगला Bill'),'wa':('WhatsApp','WhatsApp'),'undo':('Wapas lo','वापस लो'),'undo5':('5 sec','5 सेकंड'),
'sharma':('Sharma ji','शर्मा जी'),'ya':('Ya bolo: “udhaar mein”','या बोलो: “उधार में”'),
'grahak':('Grahak','ग्राहक'),'item':('Saaman','सामान'),'likha':('Udhaar mein likha · khata ab ₹2,597','उधार में लिखा · खाता अब ₹2,597'),
'pehle':('pehle','पहले'),'ab':('ab','अब'),'aaya':('Aaj aaya','आज आया'),
}
def t(k): return f'<span data-t="{k}">{T[k][0]}</span>'
BILLS=[('6:12','Rekha ji','Atta, tel, sabun','240','cash'),('6:05','Verma ji','Doodh, bread','415','ud'),('5:58','Grahak','Kurkure, Frooti','60','upi'),('5:41','Gupta ji','Udhaar wapas','+500','cash')]
ITEMS=[('cheeni','kg2','2 × ₹46','92'),('maggi','one','1 × ₹14','14'),('toor','half','½ × ₹150','75')]

BASE='''*{box-sizing:border-box;margin:0;padding:0}html,body{background:var(--bg);color:var(--tx)}
body{font-family:"Hanken Grotesk","Mukta","Noto Sans Devanagari",sans-serif;font-size:18px;-webkit-font-smoothing:antialiased}
.view{display:none;min-height:100dvh;position:relative;padding-bottom:140px}.view.on{display:block}
button{font:inherit;color:inherit;border:0;background:none;cursor:pointer}
.num{font-variant-numeric:tabular-nums;letter-spacing:-.01em}
.top{display:flex;align-items:center;justify-content:space-between;height:56px;padding:0 16px}
.top b{font-size:18px;font-weight:800}.top .ib{width:44px;height:44px;display:grid;place-items:center;color:var(--tx2)}
.mut{color:var(--tx2)}.dim{color:var(--tx3)}
.fix{position:fixed;left:0;right:0;bottom:0;background:var(--bg);padding:12px 16px calc(14px + env(safe-area-inset-bottom))}
.btn{min-height:60px;border-radius:14px;display:flex;align-items:center;justify-content:center;gap:10px;font-size:20px;font-weight:800;padding:0 20px}
.pri{background:var(--acc);color:var(--accink)}.ink{background:var(--tx);color:var(--bg)}.gh{background:var(--surf2);color:var(--tx)}
.tabs{display:flex;justify-content:space-around;height:64px;border-top:1px solid var(--sep);background:var(--bg)}
.tabs a{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:15px;font-weight:700;color:var(--tx3);min-width:64px}.tabs a.on{color:var(--br)}
.receipt{margin:24px 16px;background:#FFFDF8;color:#1A1A1A;border:1px solid #E7E2D6;border-radius:6px;padding:22px 18px;font-size:17px}
.receipt h3{font-size:22px;font-weight:900}.receipt .r{display:flex;justify-content:space-between;padding:7px 0}.receipt hr{border:0;border-top:1px dashed #BDB6A6;margin:10px 0}
.receipt .tot{font-size:26px;font-weight:900;border-top:2px solid #1A1A1A;margin-top:6px;padding-top:10px}
.lbl{font-size:16px;font-weight:700;color:var(--tx2)}
'''
JS='''<script>
const T=%s;const q=new URLSearchParams(location.search);
document.documentElement.dataset.theme=q.get('theme')||'light';
if(q.get('lang')==='hi')document.querySelectorAll('[data-t]').forEach(e=>{const v=T[e.dataset.t];if(v)e.textContent=v[1]});
function go(id){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('on',v.id===id));scrollTo(0,0)}
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
document.querySelectorAll('.pay').forEach(b=>b.onclick=()=>{document.querySelectorAll('.pay').forEach(x=>x.classList.remove('on'));b.classList.add('on');document.querySelectorAll('.afterpay').forEach(x=>x.hidden=false)});
</script>'''%json.dumps(T,ensure_ascii=False)
HEAD='''<!doctype html><html lang="hi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>%s</title>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@500;600;700;800;900&family=Mukta:wght@500;600;700;800&family=Noto+Sans+Devanagari:wght@500;600;700;800&display=swap" rel="stylesheet"><style>%s</style></head><body>'''
def receipt():
  rows=''.join(f'<div class="r"><span>{t(a)}</span><span class="dim" style="color:#666">{c}</span><b>{d}</b></div>' for a,b,c,d in ITEMS)
  return f'''<section class="view" id="billimg"><div class="top"><button class="ib">{ic('back')}</button><b>{t('wa')}</b><span style="width:44px"></span></div>
<div class="receipt"><h3>{t('store')}</h3><div style="color:#666;font-size:16px">Rajwada, Indore · 98270 12345</div><hr>
<div class="r"><span>Bill 2205</span><span>24.11.2026 · 6:15 pm</span></div><div class="r"><span>{t('grahak')}: <b>{t('sharma')}</b></span></div><hr>{rows}
<div class="r tot"><span>{t('kul')}</span><span class="num">₹181</span></div><div style="color:#8A5A00;font-weight:800;margin-top:8px">{t('likha')}</div><hr><div style="color:#666;text-align:center">UPI: sharmastore@upi</div></div></section>'''
def page(title,css,body):
  return HEAD%(title,BASE+css)+body+receipt()+JS+'</body></html>'

# ================= D13D · LEDGER =================
L_CSS='''
:root{--bg:#FBFBF9;--surf:#fff;--surf2:#F0F0EC;--tx:#161816;--tx2:#5A5F5B;--tx3:#8C918D;--sep:#E2E3DE;--br:#0E5E57;--acc:#E8A33D;--accink:#1A1300;--ud:#9A5B00;--udsoft:#FBF0DE}
[data-theme=dark]{--bg:#111312;--surf:#1A1D1B;--surf2:#232624;--tx:#F1F2EF;--tx2:#AAB0AB;--tx3:#7D847F;--sep:#2C302D;--br:#5FB8AD;--ud:#E5A64A;--udsoft:#2E2414}
.big{font-size:44px;font-weight:900;letter-spacing:-.02em;line-height:1}
.split{display:flex;gap:6px;flex-wrap:wrap;font-size:18px;font-weight:700;color:var(--tx2);padding:10px 16px 0}.split b{color:var(--tx)}
.rule{border-top:1px solid var(--sep);margin:0 16px}
.row{display:flex;align-items:center;gap:14px;padding:14px 16px;border-bottom:1px solid var(--sep);margin:0}
.row .t{width:48px;font-size:16px;color:var(--tx3);font-weight:700}.row .m{flex:1}.row .m b{display:block;font-size:19px}.row .m span{font-size:16px;color:var(--tx2)}
.row .a{text-align:right;font-weight:800;font-size:19px}.row .a small{display:block;font-size:15px;font-weight:700}
.sec{font-size:15px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--tx3);padding:26px 16px 8px}
.bolo{display:flex;align-items:center;gap:14px;height:68px;border-radius:16px;background:var(--br);color:#fff;padding:0 10px 0 20px}
.bolo .w{flex:1}.bolo .w b{font-size:20px;display:block}.bolo .w span{font-size:16px;opacity:.8}.bolo .m{width:52px;height:52px;border-radius:50%;background:var(--acc);color:var(--accink);display:grid;place-items:center}
.speech{font-size:26px;line-height:36px;font-weight:700;padding:8px 16px 0}.speech .dim{opacity:.7}
.live{display:flex;align-items:center;gap:8px;padding:6px 16px;font-size:16px;font-weight:700;color:var(--br)}.live i{width:8px;height:8px;border-radius:50%;background:var(--br)}
.ln{display:flex;justify-content:space-between;align-items:baseline;padding:15px 0;border-bottom:1px solid var(--sep);margin:0 16px;font-size:20px;font-weight:700}.ln span span{color:var(--tx3);font-weight:600}
.doubt{border-left:4px solid var(--acc);padding:14px 14px 16px 14px;margin:0 16px;background:var(--surf)}
.doubt .qq{font-size:21px;font-weight:800}.doubt .two{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}
.totl{display:flex;justify-content:space-between;align-items:baseline;padding:18px 16px}.totl b{font-size:34px;font-weight:900}
.payrow{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:1.5px solid var(--sep);border-radius:14px;overflow:hidden}
.pay{min-height:76px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-size:19px;font-weight:800;background:var(--surf);border-right:1.5px solid var(--sep)}.pay:last-child{border-right:0}
.pay.on{background:var(--tx);color:var(--bg)}.pay.u.on{background:var(--udsoft);color:var(--ud);box-shadow:inset 0 0 0 2px var(--ud)}
.chg{font-size:19px;font-weight:700;color:var(--ud);padding:12px 2px 2px}
.cust{display:flex;justify-content:space-between;align-items:center;padding:6px 16px 14px;font-size:19px;font-weight:700}.cust span{color:var(--ud);font-weight:700}
.tick{width:44px;height:44px;border-radius:50%;border:2px solid var(--br);color:var(--br);display:grid;place-items:center}
.link{display:flex;align-items:center;gap:8px;font-weight:800;font-size:19px;min-height:56px;color:var(--br)}
'''
def l_home():
  rows=''.join(f'<div class="row"><span class="t">{a}</span><div class="m"><b>{b}</b><span>{c}</span></div><div class="a num">{'+₹'+d[1:] if d[0]=='+' else '₹'+d}<small style="color:{"var(--ud)" if e=="ud" else "var(--tx3)"}">{t(e)}</small></div></div>' for a,b,c,d,e in BILLS)
  return f'''<section class="view on" id="home"><div class="top"><b>{t('store')}</b><div style="display:flex"><button class="ib">{ic('moon')}</button><button class="ib">{ic('gear')}</button></div></div>
<div style="padding:18px 16px 0"><div class="lbl">{t('today')} · {t('bills')}</div><div class="big num" style="margin-top:8px">₹14,218</div></div>
<div class="split num"><span>{t('cash')} <b>9,642</b></span>·<span>{t('upi')} <b>3,456</b></span>·<span>{t('ud')} <b style="color:var(--ud)">1,120</b></span></div>
<div class="sec" style="padding-top:28px">{t('lena')}</div><div class="row" style="border-top:1px solid var(--sep)"><div class="m"><b class="num" style="font-size:24px;color:var(--ud)">₹32,484</b><span>{t('lena2')}</span></div><button class="btn gh" style="min-height:52px;font-size:18px">{t('yaad')}</button></div>
<div class="sec">{t('aajbill')}</div><div class="row" style="border-top:1px solid var(--sep)"><span class="t" style="color:var(--br)">●</span><div class="m"><b>{t('online')}</b></div><span class="link" style="min-height:0">{t('dekho')} {ic('chev',18)}</span></div>{rows}
<div class="fix" style="padding-bottom:0"><button class="bolo" id="voicebar" data-go="listen" style="width:100%;text-align:left"><div class="w"><b>{t('bolo')}</b><span>{t('bolohint')}</span></div><span class="m">{ic('mic',26)}</span></button>
<nav class="tabs" style="margin:10px -16px 0"><a class="on">{ic('home')}{t('ghar')}</a><a>{ic('bill')}{t('billt')}</a><a>{ic('box')}{t('maal')}</a><a>{ic('book')}{t('ud')}</a></nav></div></section>'''
def l_listen():
  return f'''<section class="view" id="listen"><div class="top"><button class="ib">{ic('down')}</button><b class="mut" style="font-weight:700">{t('naya')}</b></div>
<div class="live"><i></i>{t('sun')}</div><p class="speech">{t('speech')} <span class="dim">{t('speech2')}</span></p>
<div style="height:28px"></div><div class="rule"></div>
<div class="ln"><span>{t('cheeni')} <span>{t('kg2')}</span></span><span class="num">₹92</span></div><div class="ln"><span>{t('maggi')} <span>1</span></span><span class="num">₹14</span></div>
<div class="fix" style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--sep)"><div><div class="lbl">{t('abtak')}</div><div class="num" style="font-size:34px;font-weight:900">₹106</div></div><button class="btn ink" data-go="review">{ic('check')}{t('hogaya')}</button></div></section>'''
def l_review():
  return f'''<section class="view" id="review"><div class="top"><button class="ib">{ic('back')}</button><span class="mut">Bill 2205</span></div>
<h1 style="font-size:30px;font-weight:900;padding:4px 16px 8px">{t('check')}</h1>
<div class="cust"><b>{t('sharma')}</b><span class="num">{t('ud')} ₹2,416 ›</span></div><div class="rule"></div>
<div class="ln"><span>{t('cheeni')} <span>{t('kg2')}</span></span><span class="num">₹92</span></div>
<div class="doubt" style="margin-top:0"><div class="qq">{t('q')}</div><div class="mut">{t('qsub')}</div><div class="two"><button class="btn gh">{t('doosri')}</button><button class="btn ink" >{ic('check')}{t('haan')}</button></div></div>
<div class="ln" style="border-top:1px solid var(--sep)"><span>{t('toor')} <span>{t('half')}</span></span><span class="num">₹75</span></div>
<div class="fix" style="border-top:1px solid var(--sep)"><div class="totl" style="padding:2px 0 12px"><span class="lbl">{t('kul')} · 3</span><b class="num">₹181</b></div><button class="btn pri" style="width:100%" data-go="pay">{t('aage')} {ic('chev',20)}</button></div></section>'''
def l_pay():
  return f'''<section class="view" id="pay"><div class="top"><button class="ib" data-go="review">{ic('back')}</button><span class="mut">Bill 2205 · {t('sharma')}</span></div>
<div style="padding:40px 16px 0"><div class="lbl">{t('kul')} · 3 saaman</div><div class="big num" style="font-size:56px;margin-top:8px">₹181</div></div>
<div class="fix"><div class="lbl" style="padding:0 2px 10px">{t('kaise')}</div>
<div class="payrow"><button class="pay" data-p="c">{ic('cash')}{t('cash')}</button><button class="pay" data-p="p">{ic('qr')}{t('upi')}</button><button class="pay u on" data-p="u">{ic('book')}{t('ud')}</button></div>
<div class="chg num afterpay">{t('khata')}: ₹2,416 → <b>₹2,597</b></div>
<button class="btn pri afterpay" id="cf" style="width:100%;margin-top:12px" data-go="done">{t('save')} · ₹181</button></div></section>'''
def l_done():
  return f'''<section class="view" id="done"><div style="padding:48px 16px 0"><span class="tick">{ic('check',26)}</span>
<div class="lbl" style="margin-top:20px">{t('saved')} · Bill 2205</div><div class="big num" style="font-size:56px;margin-top:8px">₹181</div>
<div style="font-size:20px;font-weight:700;margin-top:10px">{t('sharma')} · <span style="color:var(--ud)">{t('khata')} ₹2,597</span></div></div>
<div class="fix"><button class="btn pri" style="width:100%">{ic('mic')}{t('agla')} · {t('bolo')}</button>
<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px"><button class="link" data-go="billimg">{ic('wa',20)}{t('wa')} bhejo</button><button class="link" style="color:var(--tx2)">{ic('undo',20)}{t('undo')} · {t('undo5')}</button></div></div></section>'''
open('d13d.html','w').write(page('Ledger · D13D',L_CSS,l_home()+l_listen()+l_review()+l_pay()+l_done()))

# ================= D2D · PRIORITY CARDS =================
P_CSS='''
:root{--bg:#F3F4F2;--surf:#fff;--surf2:#E8EAE7;--tx:#121614;--tx2:#545C58;--tx3:#87908B;--sep:#E1E4E1;--br:#14524C;--brsoft:#E2EEEC;--acc:#F2B035;--accink:#1A1300;--ud:#94570A;--udsoft:#FBEFD9}
[data-theme=dark]{--bg:#0D100F;--surf:#171B19;--surf2:#222724;--tx:#EEF1EF;--tx2:#A6AFAA;--tx3:#7A837E;--sep:#262B28;--br:#6CC0B5;--brsoft:#16302C;--ud:#E8A84E;--udsoft:#2E2312}
.band{background:var(--br);color:#fff;padding:6px 16px 22px}[data-theme=dark] .band{background:#123C37}
.band .top{padding:0;color:#fff}.band .top .ib{color:#fff}
.duo{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 16px;margin-top:-1px}
.card{background:var(--surf);border-radius:18px;padding:16px}
.faces{display:flex;gap:10px;overflow:auto;padding:4px 16px 4px;scrollbar-width:none}
.face{flex:0 0 112px;background:var(--surf);border-radius:16px;padding:14px 12px}.face .av{width:44px;height:44px;border-radius:50%;background:var(--udsoft);color:var(--ud);display:grid;place-items:center;font-weight:900;font-size:20px}
.face b{display:block;margin-top:10px;font-size:18px}.face .num{color:var(--ud);font-weight:800}.face small{display:block;color:var(--tx3);font-size:15px}
.h2{font-size:21px;font-weight:900;padding:24px 16px 10px;display:flex;justify-content:space-between;align-items:baseline}.h2 a{font-size:17px;color:var(--br);font-weight:800}
.task{display:flex;align-items:center;justify-content:space-between;margin:0 16px}
.mic{position:fixed;right:16px;bottom:84px;height:64px;border-radius:32px;padding:0 24px 0 18px;background:var(--acc);color:var(--accink);display:flex;align-items:center;gap:10px;font-size:20px;font-weight:900;box-shadow:0 6px 18px rgba(0,0,0,.18)}
.tabs{position:fixed;left:0;right:0;bottom:0}
.tr{padding:16px;font-size:24px;line-height:33px;font-weight:700;min-height:220px;display:flex;flex-direction:column;justify-content:flex-end}
.stack{position:fixed;left:0;right:0;bottom:96px;padding:0 16px;display:flex;flex-direction:column;gap:8px}
.chip{background:var(--surf);border-radius:16px;padding:14px 16px;display:flex;justify-content:space-between;font-size:20px;font-weight:800}.chip span span{color:var(--tx3);font-weight:600}.chip.new{outline:2px solid var(--br)}
.list .it{display:flex;justify-content:space-between;padding:14px 16px;font-size:20px;font-weight:700;background:var(--surf)}.list .it+.it{border-top:1px solid var(--sep)}.list .it small{display:block;font-size:16px;color:var(--tx3);font-weight:600}
.list{border-radius:18px;overflow:hidden;margin:0 16px}
.scrim{position:fixed;inset:0;background:rgba(0,0,0,.32)}
.sheet{position:fixed;left:0;right:0;bottom:0;background:var(--surf);border-radius:24px 24px 0 0;padding:10px 16px 22px}.sheet .grab{width:40px;height:5px;border-radius:3px;background:var(--sep);margin:0 auto 18px}
.payrow{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.pay{min-height:132px;border-radius:18px;background:var(--surf);display:flex;flex-direction:column;align-items:flex-start;justify-content:space-between;padding:14px;font-size:21px;font-weight:900;border:2px solid transparent;text-align:left}
.pay small{font-size:15px;font-weight:700;color:var(--tx3);display:block}.pay.on{border-color:var(--tx)}.pay.u.on{border-color:var(--ud);background:var(--udsoft);color:var(--ud)}.pay.u.on small{color:var(--ud)}
'''
def p_home():
  faces=''.join(f'<div class="face"><span class="av">{n[0]}</span><b>{n}</b><span class="num">₹{a}</span><small>{d} din</small></div>' for n,a,d in [('Mishra ji','2,523',5),('Gupta ji','1,980',3),('Rekha ji','1,240',9),('Khan bhai','860',2)])
  rows=''.join(f'<div class="it"><span>{b}<small>{a} · {c}</small></span><span class="num" style="text-align:right">₹{d}<small style="color:{"var(--ud)" if e=="ud" else "var(--tx3)"}">{t(e)}</small></span></div>' for a,b,c,d,e in BILLS[:3])
  return f'''<section class="view on" id="home" style="padding-bottom:170px"><div class="band"><div class="top"><b>{t('store')}</b><div style="display:flex"><button class="ib">{ic('moon')}</button><button class="ib">{ic('gear')}</button></div></div>
<div style="font-size:17px;opacity:.8;margin-top:10px">{t('today')} · {t('bills')}</div><div class="num" style="font-size:44px;font-weight:900;margin-top:4px">₹14,218</div></div>
<div class="duo" style="margin-top:14px"><div class="card"><div class="lbl">{t('aaya')}</div><div class="num" style="font-size:26px;font-weight:900;margin-top:6px">₹13,098</div><div class="mut num" style="font-size:16px;margin-top:4px">{t('cash')} 9,642<br>{t('upi')} 3,456</div></div>
<div class="card" style="background:var(--udsoft)"><div class="lbl" style="color:var(--ud)">{t('lena')}</div><div class="num" style="font-size:26px;font-weight:900;margin-top:6px;color:var(--ud)">₹32,484</div><div class="num" style="font-size:16px;margin-top:4px;color:var(--ud)">{t('lena2')}</div></div></div>
<div class="h2">{t('lena')}<a>{t('yaad')}</a></div><div class="faces">{faces}</div>
<div class="h2">{t('aajbill')}<a>{t('dekho')}</a></div><div class="list">{rows}</div>
<button class="mic" id="voicebar" data-go="listen">{ic('mic',26)}{t('bolo')}</button>
<nav class="tabs"><a class="on">{ic('home')}{t('ghar')}</a><a>{ic('bill')}{t('billt')}</a><a>{ic('box')}{t('maal')}</a><a>{ic('book')}{t('ud')}</a></nav></section>'''
def p_listen():
  return f'''<section class="view" id="listen"><div class="top"><button class="ib">{ic('down')}</button><b style="display:flex;gap:8px;align-items:center;color:var(--br)"><i style="width:9px;height:9px;border-radius:50%;background:var(--br)"></i>{t('sun')}</b><span style="width:44px"></span></div>
<p class="tr">{t('speech')} <span class="dim">{t('speech2')}</span></p>
<div class="stack"><div class="chip"><span>{t('cheeni')} <span>{t('kg2')}</span></span><span class="num">₹92</span></div><div class="chip new"><span>{t('maggi')} <span>1</span></span><span class="num">₹14</span></div></div>
<div class="fix" style="display:flex;justify-content:space-between;align-items:center"><div><div class="lbl">{t('abtak')}</div><div class="num" style="font-size:32px;font-weight:900">₹106</div></div><button class="btn ink" data-go="review">{ic('check')}{t('hogaya')}</button></div></section>'''
def p_review():
  its=''.join(f'<div class="it"><span>{t(a)}<small>{c}</small></span><span class="num">₹{d}</span></div>' for a,b,c,d in ITEMS)
  return f'''<section class="view" id="review"><div class="top"><button class="ib">{ic('back')}</button><b>{t('check')}</b><span class="mut">2205</span></div>
<div class="card" style="margin:6px 16px 12px;display:flex;justify-content:space-between;align-items:center"><b style="font-size:20px">{t('sharma')}</b><span class="num" style="color:var(--ud);font-weight:800">{t('ud')} ₹2,416</span></div>
<div class="list">{its}</div><div class="h2"><span>{t('kul')}</span><span class="num" style="font-size:30px">₹181</span></div>
<div class="scrim"></div><div class="sheet"><div class="grab"></div><div style="font-size:26px;font-weight:900">{t('q')}</div><div class="mut" style="margin-top:4px">{t('qsub')}</div>
<div style="display:grid;grid-template-columns:1fr 1.4fr;gap:10px;margin-top:20px"><button class="btn gh">{t('doosri')}</button><button class="btn pri" data-go="pay">{ic('check')}{t('haan')}</button></div></div></section>'''
def p_pay():
  return f'''<section class="view" id="pay"><div class="top"><button class="ib" data-go="review">{ic('back')}</button><b>{t('sharma')}</b><span class="mut">2205</span></div>
<div style="text-align:center;padding:36px 16px 0"><div class="lbl">{t('kul')}</div><div class="num" style="font-size:60px;font-weight:900">₹181</div></div>
<div class="fix"><div style="font-size:21px;font-weight:900;padding:0 2px 12px">{t('kaise')}</div>
<div class="payrow"><button class="pay" data-p="c">{ic('cash',28)}<span>{t('cash')}<small>abhi mila</small></span></button><button class="pay" data-p="p">{ic('qr',28)}<span>{t('upi')}<small>QR dikhao</small></span></button><button class="pay u on" data-p="u">{ic('book',28)}<span>{t('ud')}<small class="num">→ ₹2,597</small></span></button></div>
<button class="btn pri afterpay" id="cf" style="width:100%;margin-top:14px" data-go="done">{t('save')} · ₹181</button></div></section>'''
def p_done():
  return f'''<section class="view" id="done"><div class="top"><span></span><span class="mut">{t('saved')}</span><span style="width:44px"></span></div>
<div class="card" style="margin:20px 16px 0;padding:22px;background:var(--udsoft)"><div class="lbl" style="color:var(--ud)">{t('khata')}</div>
<div class="num" style="font-size:48px;font-weight:900;color:var(--ud);margin-top:6px">₹2,597</div><div class="num" style="font-size:19px;font-weight:700;color:var(--ud);margin-top:4px">+₹181 · Bill 2205 · 6:15 pm</div></div>
<div class="list" style="margin-top:12px"><div class="it"><span>3 saaman<small>{t('cheeni')}, Maggi, {t('toor')}</small></span><span class="mut">›</span></div></div>
<div class="fix"><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><button class="btn gh" data-go="billimg">{ic('wa')}{t('wa')}</button><button class="btn pri">{ic('mic')}{t('agla')}</button></div>
<button class="btn" style="width:100%;color:var(--tx2);font-size:18px;min-height:56px">{ic('undo',20)}{t('undo')} · {t('undo5')}</button></div></section>'''
open('d2d.html','w').write(page('Priority · D2D',P_CSS,p_home()+p_listen()+p_review()+p_pay()+p_done()))

# ================= D6E · VOICE-FIRST =================
V_CSS='''
:root{--bg:#FFFFFF;--surf:#F5F5F4;--surf2:#EDEDEB;--tx:#1D1D1F;--tx2:#5E5E62;--tx3:#8E8E93;--sep:#E5E5E3;--br:#1D1D1F;--acc:#C98200;--accink:#fff;--ud:#9A5B00;--udsoft:#FBF0DE}
[data-theme=dark]{--bg:#000;--surf:#141415;--surf2:#1F1F21;--tx:#F5F5F7;--tx2:#A1A1A6;--tx3:#6E6E73;--sep:#232325;--br:#F5F5F7;--acc:#E0A030;--accink:#141000;--ud:#E5A64A;--udsoft:#2A2012}
.dock{position:fixed;left:0;right:0;bottom:0;background:var(--bg);border-top:1px solid var(--sep);padding:6px 16px calc(14px + env(safe-area-inset-bottom))}
.dock .tb{display:flex;justify-content:space-around;margin-bottom:8px}.dock .tb a{font-size:16px;font-weight:700;color:var(--tx3);padding:8px 10px;display:flex;gap:6px;align-items:center}.dock .tb a.on{color:var(--tx)}
.voice{width:100%;height:72px;border-radius:20px;background:var(--acc);color:var(--accink);display:flex;align-items:center;justify-content:center;gap:12px;font-size:23px;font-weight:900}
.tl{margin:0 16px;border-left:2px solid var(--sep);padding-left:16px}.tl .e{position:relative;padding:10px 0;display:flex;justify-content:space-between}.tl .e:before{content:"";position:absolute;left:-22px;top:18px;width:10px;height:10px;border-radius:50%;background:var(--bg);border:2px solid var(--tx3)}
.tl .e b{font-size:19px}.tl .e small{display:block;font-size:15px;color:var(--tx3)}
.wave{position:absolute;left:0;right:0;top:420px;display:flex;justify-content:center;align-items:center;gap:6px;height:120px}.wave i{width:8px;border-radius:4px;background:var(--acc)}
.chips{display:flex;flex-wrap:wrap;gap:8px;padding:18px 16px}.chips span{background:var(--surf);border-radius:999px;padding:10px 16px;font-size:19px;font-weight:800}.chips span em{font-style:normal;color:var(--tx3);font-weight:600}
.prompt{padding:24px 16px 0}.prompt h2{font-size:34px;line-height:40px;font-weight:900;letter-spacing:-.02em}
.mini .r{display:flex;justify-content:space-between;padding:11px 16px;font-size:18px;color:var(--tx2);border-bottom:1px solid var(--sep)}
.payrow{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.pay{min-height:88px;border-radius:18px;background:var(--surf);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;font-size:20px;font-weight:800;border:2px solid transparent}
.pay.on{border-color:var(--tx)}.pay.u.on{border-color:var(--ud);background:var(--udsoft);color:var(--ud)}
.hint{text-align:center;color:var(--tx3);font-size:17px;font-weight:700;padding:10px 0}
.micsq{width:72px;height:72px;border-radius:20px;background:var(--surf2);display:grid;place-items:center;flex:0 0 72px}
'''
def v_home():
  ev=''.join(f'<div class="e"><span><b>{b}</b><small>{a} · {c}</small></span><span class="num" style="font-weight:800;text-align:right">{'+₹'+d[1:] if d[0]=='+' else '₹'+d}<small style="color:{"var(--ud)" if e=="ud" else "var(--tx3)"}">{t(e)}</small></span></div>' for a,b,c,d,e in BILLS)
  return f'''<section class="view on" id="home" style="padding-bottom:180px"><div class="top"><b>{t('store')}</b><div style="display:flex"><button class="ib">{ic('moon')}</button><button class="ib">{ic('gear')}</button></div></div>
<div style="padding:22px 16px 6px"><div class="lbl">{t('today')}</div><div class="num" style="font-size:52px;font-weight:900;letter-spacing:-.03em;line-height:1.05">₹14,218</div>
<div class="mut num" style="font-size:18px;font-weight:700;margin-top:6px">{t('bills')} · {t('ud')} <span style="color:var(--ud)">₹1,120</span></div></div>
<div style="margin:18px 16px;display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-radius:16px;background:var(--udsoft);color:var(--ud)"><span><b class="num" style="font-size:22px">₹32,484</b><br><span style="font-size:16px;font-weight:700">{t('lena')} · {t('lena2')}</span></span>{ic('chev')}</div>
<div class="lbl" style="padding:10px 16px 6px">{t('aajbill')}</div><div class="tl">{ev}</div>
<div class="dock"><div class="tb"><a class="on">{ic('home',20)}{t('ghar')}</a><a>{ic('bill',20)}{t('billt')}</a><a>{ic('box',20)}{t('maal')}</a><a>{ic('book',20)}{t('ud')}</a></div>
<button class="voice" id="voicebar" data-go="listen">{ic('mic',28)}{t('bolo')}</button></div></section>'''
def v_listen():
  hs=[24,46,70,98,60,84,40,66,30,52,22]
  bars=''.join(f'<i style="height:{h}px"></i>' for h in hs)
  return f'''<section class="view" id="listen"><div class="top"><button class="ib">{ic('down')}</button><span class="mut" style="font-weight:700">{t('sun')}</span><span style="width:44px"></span></div>
<p style="font-size:28px;line-height:38px;font-weight:800;padding:12px 16px 0;letter-spacing:-.01em">{t('speech')} <span class="dim">{t('speech2')}</span></p>
<div class="chips"><span>{t('cheeni')} <em>2 kg</em> ₹92</span><span>Maggi <em>1</em> ₹14</span></div>
<div class="wave">{bars}</div>
<div class="fix" style="display:flex;align-items:center;justify-content:space-between"><div><div class="lbl">{t('abtak')}</div><div class="num" style="font-size:34px;font-weight:900">₹106</div></div><button class="btn ink" data-go="review" style="min-height:64px">{ic('check')}{t('hogaya')}</button></div></section>'''
def v_review():
  mini=''.join(f'<div class="r"><span>{t(a)} · {t(b)}</span><span class="num">₹{d}</span></div>' for a,b,c,d in ITEMS)
  return f'''<section class="view" id="review"><div class="top"><button class="ib">{ic('back')}</button><span class="mut">{t('sharma')} · 2205</span><span style="width:44px"></span></div>
<div class="prompt"><div class="lbl">1 sawaal</div><h2>{t('q')}</h2><div class="mut" style="font-size:20px;margin-top:6px">{t('qsub')}</div></div>
<div class="lbl" style="padding:30px 16px 6px">{t('check')}</div><div class="mini">{mini}<div class="r" style="color:var(--tx);font-weight:900;font-size:20px;border:0"><span>{t('kul')}</span><span class="num">₹181</span></div></div>
<div class="fix"><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><button class="btn gh" style="min-height:64px">{t('doosri')}</button><button class="btn ink" style="min-height:64px" data-go="pay">{ic('check')}{t('haan')}</button></div><div class="hint">{t('ya')[:0]}Ya bolo: “haan”</div></div></section>'''
def v_pay():
  return f'''<section class="view" id="pay"><div class="top"><button class="ib" data-go="review">{ic('back')}</button><span class="mut">{t('sharma')} · 2205</span><span style="width:44px"></span></div>
<div style="text-align:center;padding:70px 16px 0"><div class="lbl">{t('kaise')}</div><div class="num" style="font-size:72px;font-weight:900;letter-spacing:-.03em">₹181</div><div class="num afterpay" style="color:var(--ud);font-size:19px;font-weight:700">{t('khata')} ₹2,416 → ₹2,597</div></div>
<div class="fix"><div class="payrow"><button class="pay" data-p="c">{ic('cash',28)}{t('cash')}</button><button class="pay" data-p="p">{ic('qr',28)}{t('upi')}</button><button class="pay u on" data-p="u">{ic('book',28)}{t('ud')}</button></div>
<div class="hint">{t('ya')}</div><div style="display:flex;gap:10px"><button class="btn pri afterpay" id="cf" style="flex:1;min-height:72px" data-go="done">{t('save')}</button><span class="micsq">{ic('mic',28)}</span></div></div></section>'''
def v_done():
  return f'''<section class="view" id="done"><div style="padding:90px 20px 0"><span style="color:var(--acc)">{ic('check',40)}</span>
<h2 style="font-size:38px;line-height:44px;font-weight:900;letter-spacing:-.02em;margin-top:16px"><span class="num">₹181</span> <span data-t="sharma">Sharma ji</span> ke khate mein</h2>
<div class="mut num" style="font-size:19px;margin-top:10px">{t('khata')} ab <b style="color:var(--ud)">₹2,597</b> · Bill 2205</div>
<button class="btn gh" style="margin-top:22px;display:inline-flex" data-go="billimg">{ic('wa')}{t('wa')}</button></div>
<div class="fix"><button class="btn" style="width:100%;color:var(--tx2);font-size:18px;min-height:56px">{ic('undo',20)}{t('undo')} · {t('undo5')}</button><button class="voice">{ic('mic',28)}{t('agla')} · {t('bolo')}</button></div></section>'''
open('d6e.html','w').write(page('Voice · D6E',V_CSS,v_home()+v_listen()+v_review()+v_pay()+v_done()))
