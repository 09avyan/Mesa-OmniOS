import json,sys
OUT=sys.argv[1] if len(sys.argv)>1 else 'df1.html'
I={
'mic':'<path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z"/><path d="M19 11a7 7 0 0 1-14 0M12 18v3"/>',
'cash':'<rect x="2.5" y="6" width="19" height="12" rx="1.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v.01M18 14.5v.01"/>',
'qr':'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v7h-4M14 18v3"/>',
'book':'<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
'check':'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
'wa':'<path d="M4 20l1.4-4.2A8 8 0 1 1 8.6 19z"/><path d="M9.5 9.5c0 2.5 2.5 5 5 5"/>',
'undo':'<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
'back':'<path d="M15 5l-7 7 7 7"/>','x':'<path d="M6 6l12 12M18 6L6 18"/>',
'home':'<path d="M4 11l8-7 8 7v9H4z"/>','bill':'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
'box':'<path d="M3 7l9-4 9 4-9 4z"/><path d="M3 7v10l9 4 9-4V7"/>',
'gear':'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
'chev':'<path d="M9 5l7 7-7 7"/>','list':'<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
'pause':'<path d="M9 5v14M15 5v14"/>',
}
def ic(n,s=24,w=2): return f'<svg width="{s}" height="{s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{I[n]}</svg>'
T={
'store':('Sharma General Store','शर्मा जनरल स्टोर'),'settings':('Settings','Settings'),
'today':('Aaj ki bikri · 68 bill','आज की बिक्री · 68 Bill'),
'cash':('Cash','Cash'),'upi':('UPI','UPI'),'ud':('Udhaar','उधार'),
'lena':('Paisa lena hai','पैसा लेना है'),'lena2':('15 log se · sabse purana Mishra ji, 23 din','15 लोगों से · सबसे पुराना मिश्रा जी, 23 दिन'),'yaad':('Yaad dilao','याद दिलाओ'),
'aajbill':('Aaj ke bill','आज के Bill'),'online':('2 naye online order','2 नए online order'),'dekho':('Dekho','देखो'),
'bolo':('Bolo','बोलो'),'bolohint':('“Sharma ji, 2 kilo cheeni…”','“शर्मा जी, 2 किलो चीनी…”'),
'ghar':('Ghar','घर'),'billt':('Bill','Bill'),'maal':('Maal','माल'),
'band':('Band','बंद'),'sun':('Sun raha hoon','सुन रहा हूँ'),'abtak':('Ab tak','अब तक'),'hogaya':('Ho gaya','हो गया'),'ruko':('Ruko','रुको'),
'sp1':('sharma ji, do kilo cheeni, ek maggi, aadha kilo','शर्मा जी, दो किलो चीनी, एक मैगी, आधा किलो'),'sp2':('toor dal','तूर दाल'),
'wapas':('Wapas','वापस'),'sharma':('Sharma ji','शर्मा जी'),
'cheeni':('Cheeni','चीनी'),'maggi':('Maggi chhota','मैगी छोटा'),'toor':('Toor dal','तूर दाल'),
'kg2':('2 kg','2 किलो'),'kg2x':('2 kg × ₹46','2 किलो × ₹46'),'mx':('1 × ₹14','1 × ₹14'),'tx':('½ kg × ₹150','आधा किलो × ₹150'),
'sawaal':('1 sawaal','1 सवाल'),'q':('Maggi chhota wala?','छोटा वाला मैगी?'),'qsub':('₹14 ka packet · 70 g','₹14 का packet · 70 ग्राम'),
'haan':('Haan','हाँ'),'doosri':('Doosri','दूसरी'),'yahaan':('Ya bolo: “haan”','या बोलो: “हाँ”'),
'saaman3':('3 saaman','3 सामान'),'kul3':('Kul · 3 saaman','कुल · 3 सामान'),'aage':('Aage · Paisa','आगे · पैसा'),
'names':('Cheeni, Maggi chhota, Toor dal','चीनी, मैगी छोटा, तूर दाल'),
'kaise':('Paisa kaise mila?','पैसा कैसे मिला?'),'haath':('haath mein','हाथ में'),'qrd':('QR dikhao','QR दिखाओ'),'khatem':('khate mein','खाते में'),
'pehle':('Pehle chuno: Cash, UPI ya Udhaar','पहले चुनो: Cash, UPI या उधार'),'yaud':('Ya bolo: “udhaar mein”','या बोलो: “उधार में”'),
'khata':('Sharma ji ka khata','शर्मा जी का खाता'),'save':('Udhaar mein likho','उधार में लिखो'),'cashsave':('Cash mila','Cash मिला'),'upisave':('UPI mila','UPI मिला'),
'lautao':('Lautao','लौटाओ'),
'saved':('Bill 2205 save','Bill 2205 save'),'kekhate':('Sharma ji ke khate mein','शर्मा जी के खाते में'),
'p1':('Pehle','पहले'),'p2':('Aaj ka bill','आज का Bill'),'p3':('Ab baaki','अब बाकी'),
'agla':('Agla bill','अगला Bill'),'wa':('WhatsApp','WhatsApp'),'undo':('Wapas lo','वापस लो'),
'bhejo':('Sharma ji ko bhejo','शर्मा जी को भेजो'),'grahak':('Grahak','ग्राहक'),
'likha':('Udhaar mein likha · khata ab ₹2,597','उधार में लिखा · खाता अब ₹2,597'),'kul':('Kul','कुल'),
'jama':('jama','जमा'),'addr':('Rajwada, Indore · 98270 12345','राजवाड़ा, इंदौर · 98270 12345'),
'rk':('Atta, tel, sabun · 6 saaman','आटा, तेल, साबुन · 6 सामान'),'vm':('Doodh, bread','दूध, bread'),'gr':('Kurkure, Frooti','Kurkure, Frooti'),'gp':('Udhaar wapas','उधार वापस'),'ms':('Chai patti 1 kg','चाय पत्ती 1 किलो'),
'n_rekha':('Rekha ji','रेखा जी'),'n_verma':('Verma ji','वर्मा जी'),'n_gr':('Grahak','ग्राहक'),'n_gupta':('Gupta ji','गुप्ता जी'),'n_mishra':('Mishra ji','मिश्रा जी'),
}
def t(k,tag='span',cls=''): return f'<{tag} data-t="{k}"{" class=%s"%chr(34)+cls+chr(34) if cls else ""}>{T[k][0]}</{tag}>'
def rs(n,neg=''): return f'<span class="m">{neg}<span class="rs">₹</span>{n}</span>'

CSS='''
:root{--bg:#FAFAF7;--surf:#FFFFFF;--surf2:#EFEFEA;--tx:#16181A;--tx2:#575C58;--tx3:#737873;--sep:#E3E4DF;--ink:#16181A;--inktx:#fff;--vf:#0E5E57;--vt:#0E5E57;--ud:#8F5300;--udsoft:#FAEEDB}
[data-theme=dark]{--bg:#111312;--surf:#1A1D1B;--surf2:#252825;--tx:#F1F2EF;--tx2:#A9AFAA;--tx3:#8A908B;--sep:#2C302D;--ink:#F1F2EF;--inktx:#111312;--vf:#2A7268;--vt:#6CC0B5;--ud:#E5A64A;--udsoft:#2E2414}
*{box-sizing:border-box;margin:0;padding:0}html,body{background:var(--bg);color:var(--tx)}
body{font-family:"Hanken Grotesk","Mukta",sans-serif;font-size:18px;line-height:26px;-webkit-font-smoothing:antialiased;font-feature-settings:"tnum"}
:lang(hi) body,[data-lang=hi] body{font-family:"Hanken Grotesk","Mukta",sans-serif}
button{font:inherit;color:inherit;border:0;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent}
.view{display:none;min-height:100dvh;position:relative}.view.on{display:block}
.m{font-variant-numeric:tabular-nums;white-space:nowrap}.rs{font-size:.7em;font-weight:600;color:var(--tx2);margin-right:.08em;position:relative;top:-.02em}
.ud .rs,.rs.c{color:inherit;opacity:.8}
.t2{color:var(--tx2)}.t3{color:var(--tx3)}.ud{color:var(--ud)}
.top{display:flex;align-items:center;justify-content:space-between;min-height:64px;padding:4px 8px 4px 16px}
.top .nm{font-size:20px;font-weight:700;letter-spacing:-.005em}.top .rt{color:var(--tx2);padding-right:8px}
.tb{min-height:56px;display:inline-flex;align-items:center;gap:6px;padding:0 12px;border-radius:12px;font-weight:600;color:var(--tx2)}
.tb.l{margin-left:-12px}
.btn{min-height:64px;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:10px;font-size:20px;font-weight:700;padding:0 16px;transition:filter 80ms}
.btn:active{filter:brightness(.88)}.btn.s56{min-height:56px}
.ink{background:var(--ink);color:var(--inktx)}.sf{background:var(--surf2);color:var(--tx)}.vo{background:var(--vf);color:#fff}
.btn[disabled]{background:var(--surf2);color:var(--tx2);font-size:18px;font-weight:600}
.fix{position:fixed;left:0;right:0;bottom:0;background:var(--bg);border-top:1px solid var(--sep);padding:12px 16px 16px}
.hint{color:var(--tx3);padding-top:10px}
.hr{height:1px;background:var(--sep);margin-left:16px}
.row{display:flex;align-items:center;gap:12px;padding:14px 16px 14px 0;margin-left:16px;border-bottom:1px solid var(--sep)}
.row .g{flex:1;min-width:0}.row b{font-size:20px;font-weight:700;line-height:28px;display:block}.row .g span{color:var(--tx2)}
.row .a{text-align:right;font-size:20px;font-weight:700;line-height:28px}.row .a small{display:block;font-size:18px;font-weight:600;color:var(--tx3)}.row .a small.ud{color:var(--ud)}
.row .tm{width:56px;flex:0 0 56px;color:var(--tx3);font-weight:600;align-self:flex-start;padding-top:1px}
.dbl{border-top:4px double var(--tx)}
.hero{font-size:52px;line-height:52px;font-weight:800;letter-spacing:-.03em;margin-left:-2px}
.hero .rs{font-size:.56em;font-weight:600;vertical-align:.38em;margin-right:.06em}
.sec{font-weight:700;color:var(--tx2);padding:28px 16px 6px}
/* home */
.bolo{display:flex;align-items:center;gap:14px;width:100%;min-height:64px;border-radius:12px;background:var(--vf);color:#fff;padding:0 16px;text-align:left}
.bolo b{font-size:20px;font-weight:700}.bolo span{opacity:.82;font-weight:500;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.tabs{display:grid;grid-template-columns:repeat(4,1fr);margin:12px -16px -16px;border-top:1px solid var(--sep)}
.tabs a{min-height:64px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-weight:600;color:var(--tx3);position:relative}
.tabs a.on{color:var(--tx)}.tabs a.on:before{content:"";position:absolute;top:-1px;left:28%;right:28%;height:3px;background:var(--ink);border-radius:0 0 2px 2px}
/* listen */
.stat{display:flex;align-items:center;gap:8px;padding:8px 16px 0;font-weight:600;color:var(--vt)}.stat i{width:8px;height:8px;border-radius:50%;background:var(--vt);animation:p 1.4s ease-in-out infinite}
@keyframes p{50%{opacity:.35}}
.tr{font-size:26px;line-height:36px;font-weight:600;padding:12px 16px 0;letter-spacing:-.005em}
.lvl{display:flex;align-items:center;gap:3px;height:32px;margin:20px 16px 8px;overflow:hidden}.lvl i{flex:0 0 3px;border-radius:1.5px;background:var(--vt)}
.newu{box-shadow:inset 0 -2px 0 var(--vt)}
/* check */
.doubt{background:var(--surf2);margin-left:0;padding-left:16px;border-bottom-color:transparent}
.qpanel{background:var(--surf)}
.qpanel .q{font-size:30px;line-height:36px;font-weight:800;letter-spacing:-.015em;margin-top:2px}
.split{display:grid;gap:8px}.s14{grid-template-columns:1fr 1.4fr}.s16{grid-template-columns:1fr 1.6fr}
/* pay */
.tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}
.pay{min-height:88px;border-radius:12px;border:1.5px solid var(--sep);background:var(--surf);display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:2px;padding:10px 10px;white-space:nowrap;position:relative;text-align:left}
.pay b{font-size:20px;font-weight:700;line-height:26px;margin-top:4px}.pay small{font-size:18px;color:var(--tx3);font-weight:500}
.pay .tk{position:absolute;top:8px;right:8px;display:none}
.pay.on{border:2px solid var(--ink);padding:9.5px 9.5px}.pay.on .tk{display:block}
.pay.u.on{border-color:var(--ud);background:var(--udsoft);color:var(--ud)}.pay.u.on small{color:var(--ud)}
.chg{font-weight:600;padding-top:10px}
.tender{display:none;gap:8px;margin-top:10px;align-items:center}.tender.on{display:flex}
.qr{display:none;width:200px;height:200px;margin:20px 0 0 16px;background:#fff;padding:10px;border:1px solid var(--sep)}
/* saved */
.stub{margin:20px 0 0 16px;padding-right:16px}.stub .r{display:flex;justify-content:space-between;padding:8px 0;font-size:20px;font-weight:600}
.drain{height:2px;background:var(--ink);transform-origin:left;animation:d 5s linear forwards;margin:0 4px}@keyframes d{to{transform:scaleX(0)}}
/* receipt */
.paper{margin:12px 16px 0;background:#FFFDF8;color:#1A1A1A;border:1px solid #E7E2D6;border-radius:2px;padding:20px 18px 18px}
.paper h3{font-size:22px;line-height:28px;font-weight:800}.paper .sm{color:#5B574F}
.paper .r{display:grid;grid-template-columns:1fr auto 64px;gap:10px;padding:5px 0;align-items:baseline}.paper .r .c{color:#5B574F;text-align:right}.paper .r b{text-align:right;font-weight:700}
.paper .rule{border-top:1px dashed #BDB6A6;margin:10px 0}.paper .rs{color:inherit}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
'''
def top(left,right=''):
  return f'<div class="top">{left}<span class="rt">{right}</span></div>'
def back(k='wapas',to='home',icon='back'):
  return f'<button class="tb l" data-go="{to}">{ic(icon,22)}{t(k)}</button>'

BILLS=[('6:12','n_rekha','rk','240',None,'cash'),('6:05','n_verma','vm','415',None,'ud'),('5:58','n_gr','gr','60',None,'upi'),('5:41','n_gupta','gp','500','+','jama'),('5:27','n_mishra','ms','520',None,'ud')]
def home():
  rows=''
  for tm,n,it,a,sg,mt in BILLS:
    cls=' class="ud"' if mt=='ud' else (' style="color:var(--vt)"' if mt=='jama' else '')
    amt=rs(a,sg or '')
    rows+=f'<div class="row"><span class="tm m">{tm}</span><div class="g">{t(n,"b")}<span data-t="{it}">{T[it][0]}</span></div><div class="a">{amt}<small{cls}>{t(mt)}</small></div></div>'
  return f'''<section class="view on" id="home" style="padding-bottom:196px">
{top('<span class="nm" data-t="store">'+T['store'][0]+'</span>','<button class="tb">'+ic('gear',22)+t('settings')+'</button>')}
<div style="padding:16px 16px 0">{t('today','div','t2')}<div class="hero m" style="margin-top:10px">{rs('14,218')}</div>
<div style="margin-top:12px;font-weight:600;color:var(--tx2)">{t('cash')} <b class="m" style="color:var(--tx)">9,642</b> · {t('upi')} <b class="m" style="color:var(--tx)">3,456</b> · {t('ud')} <b class="m ud">1,120</b></div></div>
<div style="margin-top:28px;border-top:1px solid var(--sep)"></div>
<div class="row" style="align-items:center"><div class="g">{t('lena','div','t2')}<div class="m ud" style="font-size:30px;line-height:36px;font-weight:800;margin:2px 0 2px -1px">{rs('32,484')}</div><span data-t="lena2">{T['lena2'][0]}</span></div><button class="btn sf s56" style="flex:0 0 auto;font-size:18px">{ic('wa',22)}{t('yaad')}</button></div>
<div class="row"><div class="g"><b data-t="online">{T['online'][0]}</b></div><span style="display:flex;align-items:center;gap:2px;font-weight:700;min-height:56px">{t('dekho')}{ic('chev',20)}</span></div>
<div class="sec" data-t="aajbill">{T['aajbill'][0]}</div><div class="hr"></div>{rows}
<div class="fix" style="border-top:0;padding-top:8px"><button class="bolo" id="voicebar" data-go="listen">{ic('mic',26)}<b data-t="bolo">{T['bolo'][0]}</b><span data-t="bolohint">{T['bolohint'][0]}</span></button>
<nav class="tabs"><a class="on">{ic('home',22)}{t('ghar')}</a><a>{ic('bill',22)}{t('billt')}</a><a>{ic('box',22)}{t('maal')}</a><a>{ic('book',22)}{t('ud')}</a></nav></div></section>'''

def listen():
  import math
  bars=''
  for i in range(58):
    env=0.25+0.75*abs(math.sin(i*0.37)*math.cos(i*0.11+1))
    h=max(3,round(30*env*(0.55+0.45*((i*7919)%13)/13)))
    op=0.18+0.82*(i/57)**1.6
    bars+=f'<i style="height:{h}px;opacity:{op:.2f}"></i>'
  return f'''<section class="view" id="listen" style="padding-bottom:120px">{top(back('band','home','x'),'Bill 2205')}
<div class="stat"><i></i>{t('sun')}<span class="t3 m" style="font-weight:500;margin-left:4px">0:07</span></div>
<p class="tr"><span data-t="sp1">{T['sp1'][0]}</span> <span class="t3" data-t="sp2">{T['sp2'][0]}</span></p>
<div class="lvl" id="lvl">{bars}</div><div class="hr" style="margin-top:12px"></div>
<div class="row"><div class="g">{t('cheeni','b')}<span data-t="kg2">{T['kg2'][0]}</span></div><div class="a">{rs('92')}</div></div>
<div class="row newu"><div class="g">{t('maggi','b')}<span>1</span></div><div class="a">{rs('14')}</div></div>
<div class="fix" style="display:flex;align-items:center;justify-content:space-between;gap:8px"><div>{t('abtak','div','t2')}<div class="m" style="font-size:34px;line-height:40px;font-weight:800;letter-spacing:-.02em">{rs('106')}</div></div>
<div style="display:flex;gap:8px"><button class="btn sf s56">{ic('pause',20)}{t('ruko')}</button><button class="btn ink s56" data-go="review">{ic('check',22)}{t('hogaya')}</button></div></div></section>'''

def review():
  return f'''<section class="view" id="review" style="padding-bottom:300px">{top(back('wapas','listen'),'Bill 2205')}
<div class="row" style="border-top:1px solid var(--sep)"><div class="g">{t('sharma','b')}</div><span class="ud" style="display:flex;align-items:center;font-weight:700;min-height:44px">{t('ud')}&nbsp;{rs('2,416')}{ic('chev',20)}</span></div>
<div class="row"><div class="g">{t('cheeni','b')}<span data-t="kg2x">{T['kg2x'][0]}</span></div><div class="a">{rs('92')}</div></div>
<div class="row doubt"><div class="g">{t('maggi','b')}<span data-t="mx">{T['mx'][0]}</span> <span class="t3">· ?</span></div><div class="a">{rs('14')}</div></div>
<div class="row"><div class="g">{t('toor','b')}<span data-t="tx">{T['tx'][0]}</span></div><div class="a">{rs('75')}</div></div>
<div style="margin:14px 16px 0" class="dbl"></div>
<div style="display:flex;justify-content:space-between;align-items:baseline;padding:10px 16px 0">{t('kul3','span','t2')}<span class="m" style="font-size:34px;line-height:40px;font-weight:800;letter-spacing:-.02em">{rs('181')}</span></div>
<div class="fix qpanel" id="qp">{t('sawaal','div','t2')}<div class="q" data-t="q">{T['q'][0]}</div>{t('qsub','div','t2')}
<div class="split s14" style="margin-top:16px"><button class="btn sf">{ic('list',22)}{t('doosri')}</button><button class="btn ink" id="haan">{ic('check',22)}{t('haan')}</button></div>{t('yahaan','div','hint')}</div>
<div class="fix" id="aage" style="display:none"><button class="btn ink" style="width:100%" data-go="pay">{t('aage')}{ic('chev',22)}</button></div></section>'''

def pay():
  # tiny deterministic QR-ish
  import random;random.seed(7);cells=''
  for y in range(25):
    for x in range(25):
      f=(x<7 and y<7) or (x>17 and y<7) or (x<7 and y>17)
      on=(f and (x in(0,6,18,24) or y in(0,6,18,24) or (2<=x%18<=4 and 2<=y%18<=4))) or (not f and random.random()<.47)
      if on: cells+=f'<rect x="{x}" y="{y}" width="1" height="1"/>'
  qr=f'<svg viewBox="0 0 25 25" width="180" height="180" shape-rendering="crispEdges" fill="#111">{cells}</svg>'
  return f'''<section class="view" id="pay" style="padding-bottom:340px">{top(back('wapas','review'),'Bill 2205 · <span data-t="sharma">Sharma ji</span>')}
<div style="padding:20px 16px 0">{t('kul3','div','t2')}<div class="hero m" style="font-size:64px;line-height:64px;margin-top:8px">{rs('181')}</div>
<button id="names" class="t2" data-go="review" style="margin-top:12px;display:flex;align-items:center;gap:2px;min-height:44px">{t('names')}{ic('chev',18)}</button></div>
<div class="qr" id="qrb">{qr}</div>
<div class="fix"><div style="font-weight:700;font-size:20px" data-t="kaise">{T['kaise'][0]}</div>
<div class="tiles"><button class="pay" data-p="c"><span class="tk">{ic('check',20,2.4)}</span>{ic('cash',26)}<b data-t="cash">Cash</b><small data-t="haath">{T['haath'][0]}</small></button>
<button class="pay" data-p="p"><span class="tk">{ic('check',20,2.4)}</span>{ic('qr',26)}<b data-t="upi">UPI</b><small data-t="qrd">{T['qrd'][0]}</small></button>
<button class="pay u" data-p="u"><span class="tk">{ic('check',20,2.4)}</span>{ic('book',26)}<b data-t="ud">{T['ud'][0]}</b><small data-t="khatem">{T['khatem'][0]}</small></button></div>
<div class="chg ud" id="chg" hidden><span data-t="khata">{T['khata'][0]}</span> <span class="m">{rs('2,416')} → <b>{rs('2,597')}</b></span></div>
<div class="tender" id="tender"><button class="btn sf s56 m" style="flex:1">{rs('200')}</button><button class="btn sf s56 m" style="flex:1">{rs('500')}</button><span class="t2" style="flex:1.2;font-weight:600"><span data-t="lautao">Lautao</span> <b class="m" style="color:var(--tx)">{rs('19')}</b></span></div>
<button class="btn ink" id="cf" style="width:100%;margin-top:12px" disabled data-go="done"><span data-t="pehle">{T['pehle'][0]}</span></button>{t('yaud','div','hint')}</div></section>'''

def done():
  return f'''<section class="view" id="done" style="padding-bottom:220px">{top('<span style="display:flex;align-items:center;gap:6px;font-weight:700;color:var(--vt)">'+ic('check',22,2.4)+'<span data-t="saved">Bill 2205 save</span></span>','<span class="m">6:15 pm</span>')}
<h2 style="font-size:34px;line-height:40px;font-weight:800;letter-spacing:-.02em;padding:20px 16px 0"><span class="ud m">{rs('181')}</span> <span data-t="kekhate">{T['kekhate'][0]}</span></h2>
<div class="stub"><div class="r"><span class="t2" data-t="p1">Pehle</span><span class="m">{rs('2,416')}</span></div><div class="r"><span class="t2" data-t="p2">Aaj ka bill</span><span class="m">+{rs('181')}</span></div>
<div class="dbl" style="margin-top:6px"></div><div class="r" style="padding-top:10px"><span style="font-weight:700" data-t="p3">Ab baaki</span><span class="m ud" style="font-size:24px;font-weight:800">{rs('2,597')}</span></div></div>
<div class="hr" style="margin-top:20px"></div><div class="row"><div class="g">{t('saaman3','b')}<span data-t="names">{T['names'][0]}</span></div>{ic('chev',20)}</div>
<div class="fix"><div class="split s16"><button class="btn sf" data-go="billimg">{ic('wa',22)}{t('wa')}</button><button class="btn vo" data-go="listen">{ic('mic',24)}{t('agla')}</button></div>
<button class="btn s56" style="width:100%;color:var(--tx2);font-size:18px;font-weight:600;margin-top:4px">{ic('undo',20)}{t('undo')} <span class="m t3">· 5</span></button><div class="drain"></div></div></section>'''

def bill():
  its=[('cheeni','2 kg × 46','2 किलो × 46','92'),('maggi','1 × 14','1 × 14','14'),('toor','½ kg × 150','आधा किलो × 150','75')]
  rows=''.join(f'<div class="r"><span data-t="{k}">{T[k][0]}</span><span class="c" data-hi="{h}">{e}</span><b class="m">{a}</b></div>' for k,e,h,a in its)
  return f'''<section class="view" id="billimg" style="padding-bottom:110px">{top(back('wapas','done'),'WhatsApp')}
<div class="paper"><h3 data-t="store">{T['store'][0]}</h3><div class="sm" data-t="addr">{T['addr'][0]}</div><div class="rule"></div>
<div class="sm m">Bill 2205 · 24.11.2026 · 6:15 pm</div><div><span data-t="grahak">Grahak</span>: <b data-t="sharma">Sharma ji</b></div><div class="rule"></div>{rows}
<div style="border-top:2px solid #1A1A1A;margin-top:8px;padding-top:10px;display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:22px" data-t="kul">Kul</b><b class="m" style="font-size:26px;font-weight:800">{rs('181')}</b></div>
<div style="color:#8A5A00;font-weight:700;margin-top:8px" data-t="likha">{T['likha'][0]}</div><div class="rule"></div><div class="sm">UPI: sharmastore@upi</div></div>
<div class="fix"><button class="btn ink" style="width:100%">{ic('wa',22)}{t('bhejo')}</button></div></section>'''

JS='''<script>
const T=%s;const q=new URLSearchParams(location.search);const HI=q.get('lang')==='hi';
document.documentElement.dataset.theme=q.get('theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
if(HI){document.documentElement.dataset.lang='hi';document.querySelectorAll('[data-t]').forEach(e=>{const v=T[e.dataset.t];if(v)e.textContent=v[1]});document.querySelectorAll('[data-hi]').forEach(e=>e.textContent=e.dataset.hi)}
function go(id){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('on',v.id===id));scrollTo(0,0)}
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>{if(!b.disabled)go(b.dataset.go)}));
document.getElementById('haan').onclick=()=>{document.getElementById('qp').style.display='none';document.getElementById('aage').style.display='block';document.querySelector('.doubt').classList.remove('doubt')};
const L={c:['cashsave','₹181'],p:['upisave','₹181'],u:['save','₹181']};
document.querySelectorAll('.pay').forEach(b=>b.onclick=()=>{document.querySelectorAll('.pay').forEach(x=>x.classList.toggle('on',x===b));const p=b.dataset.p;
 document.getElementById('chg').hidden=p!=='u';document.getElementById('tender').classList.toggle('on',p==='c');
 document.getElementById('qrb').style.display=p==='p'?'block':'none';document.getElementById('names').style.display=p==='p'?'none':'flex';
 const cf=document.getElementById('cf');cf.disabled=false;const k=L[p][0];cf.innerHTML='<span>'+(HI?T[k][1]:T[k][0])+'</span><span class="m" style="opacity:.75">· '+L[p][1]+'</span>'});
</script>'''%json.dumps(T,ensure_ascii=False)
HEAD='''<!doctype html><html lang="hi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dukaan · Final</title>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@500;600;700;800&family=Mukta:wght@500;600;700;800&display=swap" rel="stylesheet"><style>'''+CSS+'</style></head><body>'
open(OUT,'w').write(HEAD+home()+listen()+review()+pay()+done()+bill()+JS+'</body></html>')
