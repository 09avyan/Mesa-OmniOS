import json,sys,math,random
OUT=sys.argv[1]
I={
'mic':'<rect x="9" y="2.5" width="6" height="12" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/><path d="M12 18v3.5M9 21.5h6"/>',
'cash':'<path d="M2.5 7.5h19v10h-19z"/><path d="M5 7.5a2.5 2.5 0 0 1-2.5 2.5M19 7.5a2.5 2.5 0 0 0 2.5 2.5M5 17.5a2.5 2.5 0 0 0-2.5-2.5M19 17.5a2.5 2.5 0 0 1 2.5-2.5"/><path d="M10 10.5h4M10 12.5h4M11.5 12.5l2.5 2.5M10.5 10.5c2 0 2 2 0 2"/>',
'upi':'<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M10 18.5h4"/><path d="M9.5 9.5l2.5 2.5 3-4.5"/>',
'khata':'<path d="M6 3h11.5v18H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M8 3v18"/><path d="M11 8h4M11 11.5h4"/><path d="M20.5 13.5l-5.5 5.5-2 .5.5-2 5.5-5.5z" fill="var(--bg)"/>',
'check':'<path d="M4.5 12.5l5 5L19.5 7"/>','wa':'<path d="M4 20l1.3-3.9A8.3 8.3 0 1 1 8 19z"/><path d="M9.2 8.8c.2 2.7 3.3 5.8 6 6l1-1.6-2.1-1-.9 1c-1-.4-2-1.4-2.4-2.4l1-.9-1-2.1z" stroke-width="1.4"/>',
'undo':'<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>','back':'<path d="M15 5l-7 7 7 7"/>','up':'<path d="M12 19V5M6 11l6-6 6 6"/>','x':'<path d="M6 6l12 12M18 6L6 18"/>',
'home':'<path d="M4 10.5L12 4l8 6.5V20h-5.5v-5h-5v5H4z"/>','bill':'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
'box':'<path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5l9 4.5 9-4.5M12 12v9"/>',
'gear':'<circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
'chev':'<path d="M9 5l7 7-7 7"/>','pause':'<path d="M9 5v14M15 5v14"/>','no':'<path d="M7 7l10 10M17 7L7 17"/>',
'bag':'<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>','bell':'<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
'split':'<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 0 0 17z" fill="currentColor"/>',
}
def ic(n,s=24,w=1.9): return f'<svg width="{s}" height="{s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{I[n]}</svg>'
T={
'store':('Sharma General Store','शर्मा जनरल स्टोर'),'settings':('Settings','Settings'),
'today':('Aaj ki bikri','आज की बिक्री'),'bills68':('68 bill aaj','आज 68 Bill'),
'cash':('Cash','Cash'),'upi':('UPI','UPI'),'ud':('Udhaar','उधार'),
'lena':('Paisa lena hai','पैसा लेना है'),'lenaall':('Sab 15 dekho','सब 15 देखो'),'yaad':('Yaad','याद'),
'aajbill':('Aaj ke bill','आज के Bill'),'online':('2 naye online order','2 नए online order'),'pack':('Pack karke bhejna hai','Pack करके भेजना है'),'dekho':('Dekho','देखो'),
'bolo':('Bolo','बोलो'),'bolohint':('“Sharma ji, 2 kilo cheeni…”','“शर्मा जी, 2 किलो चीनी…”'),
'ghar':('Ghar','घर'),'billt':('Bill','Bill'),'maal':('Maal','माल'),
'band':('Band','बंद'),'sun':('Sun raha hoon','सुन रहा हूँ'),'abtak':('Ab tak','अब तक'),'hogaya':('Ho gaya','हो गया'),'ruko':('Ruko','रुको'),
'sp1':('sharma ji, do kilo cheeni, ek maggi, aadha kilo','शर्मा जी, दो किलो चीनी, एक मैगी, आधा किलो'),'sp2':('toor dal','तूर दाल'),
'wapas':('Wapas','वापस'),'sharma':('Sharma ji','शर्मा जी'),'chk':('Bill check karo','Bill देख लो'),
'cheeni':('Cheeni','चीनी'),'maggi':('Maggi','मैगी'),'toor':('Toor dal','तूर दाल'),
'kg2':('2 kg','2 किलो'),'kg2x':('2 kg, ₹46 kilo','2 किलो, ₹46 किलो'),'mx':('1 packet','1 पैकेट'),'tx':('aadha kg, ₹150 kilo','आधा किलो, ₹150 किलो'),
'pakka':('Pakka nahi suna','पक्का नहीं सुना'),'q':('Yahi wali? ₹14 ka chhota packet','यही वाली? ₹14 का छोटा पैकेट'),
'haan':('Haan','हाँ'),'nahi':('Nahi','नहीं'),'kaunsi':('Kaun si Maggi?','कौन सी मैगी?'),
'o1':('Badi Maggi','बड़ी मैगी'),'o2':('Maggi 4 wala pack','मैगी 4 वाला पैक'),'o3':('Atta Maggi','आटा मैगी'),'bolke':('Bolke batao','बोलकर बताओ'),
'kulho':('Kul ho jayega','कुल हो जाएगा'),'upiid':('sharmastore@upi','sharmastore@upi'),'aagaya':('Paisa aa gaya','पैसा आ गया'),'yabolo':('ya bolo: haan / nahi','या बोलो: हाँ / नहीं'),'items3':('3 saaman','3 सामान'),'kul':('Kul','कुल'),'aage':('Paisa lo','पैसा लो'),
'kaise':('Paisa kaise mila?','पैसा कैसे मिला?'),'haath':('Haath mein','हाथ में'),'qrd':('QR se','QR से'),'khatem':('Khate mein','खाते में'),
'pehle':('Pehle Cash, UPI ya Udhaar chuno','पहले Cash, UPI या उधार चुनो'),'thoda':('Thoda abhi, baaki udhaar','थोड़ा अभी, बाक़ी उधार'),
'khata':('Sharma ji ka khata','शर्मा जी का खाता'),'save':('Udhaar mein likho','उधार में लिखो'),'cashsave':('Cash mila','Cash मिला'),'upisave':('UPI aaya','UPI आया'),
'qrwait':('Paisa aate hi bill khud save hoga','पैसा आते ही Bill अपने आप save होगा'),'scan':('Grahak se scan karwao','ग्राहक से scan करवाओ'),
'likhdiya':('Udhaar mein likh diya','उधार में लिख दिया'),'saved':('Bill 2205 save ho gaya','Bill 2205 save हो गया'),
'p1':('Pehle ka baaki','पहले का बाक़ी'),'p2':('Aaj ka bill','आज का Bill'),'p3':('Ab kul baaki','अब कुल बाक़ी'),
'agla':('Agla bill','अगला Bill'),'wa':('WhatsApp','WhatsApp'),'undo':('Wapas lo','वापस लो'),
'bhejo':('Sharma ji ko bhejo','शर्मा जी को भेजो'),'grahak':('Grahak','ग्राहक'),
'likha':('Udhaar mein likha. Khata ab ₹2,597','उधार में लिखा। खाता अब ₹2,597'),
'addr':('Rajwada, Indore','राजवाड़ा, इंदौर'),'dhanya':('Dhanyavaad, phir aana','धन्यवाद, फिर आना'),
'rk':('Atta, tel, sabun aur 3','आटा, तेल, साबुन और 3'),'vm':('Doodh, bread','दूध, bread'),'gr':('Kurkure, Frooti','Kurkure, Frooti'),'gp':('Purana udhaar jama','पुराना उधार जमा'),'ms':('Chai patti 1 kg','चाय पत्ती 1 किलो'),
'n_rekha':('Rekha ji','रेखा जी'),'n_verma':('Verma ji','वर्मा जी'),'n_gr':('Grahak','ग्राहक'),'n_gupta':('Gupta ji','गुप्ता जी'),'n_mishra':('Mishra ji','मिश्रा जी'),'n_khan':('Khan bhai','ख़ान भाई'),
'din23':('23 din se','23 दिन से'),'din9':('9 din se','9 दिन से'),'din4':('4 din se','4 दिन से'),'jama':('Jama','जमा'),
}
def t(k,tag='span',cls='',st=''):
  a=f' class="{cls}"' if cls else '';b=f' style="{st}"' if st else ''
  return f'<{tag} data-t="{k}"{a}{b}>{T[k][0]}</{tag}>'
def rs(n,pre=''): return f'<span class="m">{pre}<span class="rs">₹</span>{n}</span>'

CSS='''
:root{--bg:#F7F7F4;--surf:#FFFFFF;--surf2:#EDEDE8;--tx:#141517;--tx2:#55595A;--tx3:#6F7471;--sep:#E2E2DC;--sep2:#D3D3CC;--ink:#141517;--inktx:#fff;--vf:#0D5C55;--vt:#0D5C55;--ud:#8A5000;--udsoft:#F8ECD8;--udline:#D9B27A;--wbar:.45}
[data-theme=dark]{--bg:#0E0F0F;--surf:#18191A;--surf2:#232525;--tx:#F2F2EF;--tx2:#ABB0AD;--tx3:#8E9390;--sep:#272929;--sep2:#363939;--ink:#F2F2EF;--inktx:#0E0F0F;--vf:#1F6B62;--vt:#7CCABF;--ud:#E9AC55;--udsoft:#2B2114;--udline:#6B4E22;--wbar:.55}
*{box-sizing:border-box;margin:0;padding:0}[hidden]{display:none!important}html,body{background:var(--bg);color:var(--tx)}
body{font-family:"Hanken Grotesk","Mukta",sans-serif;font-size:18px;line-height:26px;-webkit-font-smoothing:antialiased;font-feature-settings:"tnum","ss01"}
button{font:inherit;color:inherit;border:0;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent;text-align:inherit}
.view{display:none;min-height:100dvh;position:relative}.view.on{display:block}
.m{font-variant-numeric:tabular-nums;white-space:nowrap}.rs{font-size:.85em;margin-right:.04em}
.t2{color:var(--tx2)}.t3{color:var(--tx3)}.ud{color:var(--ud)}
.top{display:flex;align-items:center;justify-content:space-between;min-height:64px;padding:4px 4px 4px 16px}
.nm{font-size:20px;font-weight:700;letter-spacing:-.01em}
.tb{min-height:56px;display:inline-flex;align-items:center;gap:8px;padding:0 16px;font-weight:600;color:var(--tx2);border-radius:14px}.tb.l{margin-left:-16px}.tb.l{margin-left:-14px}
.ctx{color:var(--tx2);font-weight:600;padding-right:12px;text-align:right;line-height:24px}
.btn{min-height:64px;border-radius:14px;display:flex;align-items:center;justify-content:center;gap:12px;font-size:20px;font-weight:700;padding:0 20px;white-space:nowrap}.btn,.pay,.opt{transition:transform 180ms cubic-bezier(.2,.8,.2,1),filter 180ms,box-shadow 180ms}
.btn svg{flex:0 0 auto}.btn:active,.opt:active{transition-duration:80ms;filter:brightness(.92);transform:scale(.98)}:focus-visible{outline:3px solid var(--tx);outline-offset:2px;border-radius:14px}::selection{background:var(--vt);color:#fff}.b56{min-height:56px;font-size:20px}
.ink{background:var(--ink);color:var(--inktx)}.sf{background:var(--surf2);color:var(--tx)}.ol{background:var(--surf);box-shadow:inset 0 0 0 1.5px var(--sep2);color:var(--tx)}.vo{background:var(--vf);color:#fff}
.btn[disabled]{background:transparent;box-shadow:inset 0 0 0 1.5px var(--sep);color:var(--tx2);font-size:20px;font-weight:600}
.fix{position:fixed;left:0;right:0;bottom:0;background:var(--bg);padding:12px 16px max(20px,env(safe-area-inset-bottom));box-shadow:0 -1px 0 var(--sep),0 -12px 24px rgba(0,0,0,.06)}[data-theme=dark] .fix{box-shadow:0 -1px 0 var(--sep),0 -12px 24px rgba(0,0,0,.45)}
.hint{color:var(--tx3);padding-top:10px;display:flex;align-items:center;gap:6px}
.lab{color:var(--tx2);font-weight:600}
.row{display:flex;align-items:center;gap:14px;min-height:72px;padding:12px 16px 12px 0;margin-left:16px;border-bottom:1px solid var(--sep)}
.row .g{flex:1;min-width:0}.row b,.nmr{font-size:20px;font-weight:700;line-height:27px;display:block;letter-spacing:-.005em}.row .g>span{color:var(--tx2)}
.row .a{text-align:right;font-size:20px;font-weight:700;line-height:27px}.row .a small{display:block;font-size:18px;font-weight:600;color:var(--tx3)}.row .a small.ud{color:var(--ud)}
.row .tm{width:52px;flex:0 0 52px;color:var(--tx3);font-weight:600;align-self:flex-start;padding-top:1px}
.dbl{border-top:3px double var(--tx)}
.hero{font-size:56px;line-height:56px;font-weight:800;letter-spacing:-.035em;font-variant-numeric:proportional-nums}.kul .m{font-variant-numeric:proportional-nums}
.hero .rs{font-size:.62em;font-weight:700;vertical-align:.34em;margin-right:.05em;letter-spacing:0}
.sec{display:flex;justify-content:space-between;align-items:center;padding:28px 4px 4px 16px}.sec h4{font-size:20px;font-weight:800;letter-spacing:-.01em}
/* home */
.bolo{display:flex;align-items:center;gap:14px;width:100%;min-height:64px;border-radius:18px;background:var(--vf);color:#fff;padding:0 8px 0 18px}
.bolo b{font-size:20px;font-weight:700}.bolo span{opacity:.8;flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.bolo .mk{width:48px;height:48px;border-radius:14px;background:rgba(255,255,255,.14);display:grid;place-items:center}
.tabs{display:grid;grid-template-columns:repeat(4,1fr);margin:12px -16px -18px;box-shadow:0 -1px 0 var(--sep)}
.tabs a{min-height:64px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-weight:600;color:var(--tx3);position:relative}
.tabs a.on{color:var(--tx)}.tabs a.on:before{content:"";position:absolute;top:0;left:30%;right:30%;height:3px;background:var(--ink);border-radius:0 0 3px 3px}
.splitline{display:grid;grid-template-columns:repeat(3,auto);justify-content:start;gap:0 28px;margin-top:18px}
.splitline div{font-size:18px;color:var(--tx2);font-weight:600}.splitline b{display:block;font-size:20px;color:var(--tx);font-weight:700}
.pill{display:inline-flex;align-items:center;justify-content:center;min-width:28px;height:28px;padding:0 8px;border-radius:8px;background:var(--ink);color:var(--inktx);font-size:18px;font-weight:800}
/* listen */
.stat{display:flex;align-items:center;gap:10px;padding:12px 16px 0;font-size:24px;font-weight:700;color:var(--vt)}
.stat .mk{width:40px;height:40px;border-radius:12px;background:var(--vf);color:#fff;display:grid;place-items:center;position:relative}
.stat .mk:after{content:"";position:absolute;inset:-5px;border-radius:15px;border:2px solid var(--vt);opacity:.35;animation:p 1.6s ease-out infinite}
@keyframes p{0%{transform:scale(.9);opacity:.5}100%{transform:scale(1.15);opacity:0}}
.tr{font-size:28px;line-height:38px;font-weight:600;padding:20px 16px 0;letter-spacing:-.01em}
.lvl{display:flex;align-items:center;gap:3px;height:36px;margin:22px 16px 0;overflow:hidden}.lvl i{flex:0 0 3px;border-radius:2px;background:var(--vt)}
.livebox{position:fixed;left:0;right:0;bottom:104px}
.newrow{animation:in .22s cubic-bezier(.2,.8,.2,1)}@keyframes in{from{transform:translateY(6px);opacity:0}}
/* check */
.dt{position:relative;background:var(--surf);margin-left:0;padding-left:16px;border-bottom:0}
.dt:before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--ink)}
.flag{display:inline-flex;align-items:center;gap:6px;font-size:18px;font-weight:700;color:var(--tx);line-height:22px}.flag{border-bottom:2px dotted var(--tx);padding-bottom:1px}
.ask{background:var(--surf);padding:4px 16px 12px 16px;position:relative;border-bottom:1px solid var(--sep)}
.ask:before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--ink)}
.ask .qq{font-size:20px;font-weight:700;line-height:28px}
.yn{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
.opts{margin-top:12px;border-radius:14px;box-shadow:inset 0 0 0 1.5px var(--sep2);overflow:hidden}
.opt{display:flex;justify-content:space-between;align-items:center;width:100%;min-height:64px;padding:8px 16px;font-size:20px;font-weight:700;text-align:left}.opt small{display:block;font-size:18px;font-weight:500;color:var(--tx3);line-height:24px}.opt+.opt{box-shadow:0 -1px 0 var(--sep)}
.opt .m{font-weight:700}
.kul{display:flex;justify-content:space-between;align-items:baseline;padding:12px 16px 0}
.kul .m{font-size:36px;line-height:42px;font-weight:800;letter-spacing:-.025em}
/* pay */
.tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}
.pay{min-height:100px;border-radius:18px;background:var(--surf);box-shadow:inset 0 0 0 1.5px var(--sep2);display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-end;gap:0;padding:14px;position:relative;white-space:nowrap}
.pay svg{margin-bottom:auto}.pay b{font-size:20px;font-weight:700;line-height:26px}.pay small{font-size:18px;color:var(--tx3);font-weight:500}
.pay .tk{position:absolute;top:12px;right:12px;width:24px;height:24px;border-radius:8px;background:var(--ink);color:var(--inktx);display:none;place-items:center}
.pay:active{transition-duration:80ms;transform:scale(.97);box-shadow:inset 0 0 0 2.5px var(--tx3)}.pay.on{box-shadow:inset 0 0 0 2.5px var(--ink)}.pay.on .tk{display:grid}
.pay.u.on{box-shadow:inset 0 0 0 2.5px var(--ud);background:var(--udsoft);color:var(--ud)}.pay.u.on small{color:var(--ud)}.pay.u.on .tk{background:var(--ud);color:var(--udsoft)}
.chg{min-height:30px;font-weight:600;padding-top:10px;display:flex;gap:6px;align-items:baseline}
.tender{display:none;gap:8px;margin-top:10px;align-items:center}.tender.on{display:flex}
.qrbox{display:none;margin:20px 16px 0;padding:18px;border-radius:18px;background:var(--surf);box-shadow:inset 0 0 0 1.5px var(--sep);gap:18px;align-items:center}
.qrbox.on{display:flex}.qrbox .q{background:#fff;padding:8px;border-radius:8px}
.waitdot{display:inline-block;width:18px;height:18px;border-radius:50%;border:2.5px solid var(--sep2);border-top-color:var(--tx);margin-right:8px;vertical-align:-3px;animation:spin .9s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
/* saved */
.done-h{padding:28px 16px 0}.done-h .ok{display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:19px;color:var(--tx)}
.done-h .ok i{width:28px;height:28px;border-radius:8px;background:var(--ink);color:var(--inktx);display:grid;place-items:center;animation:stamp 220ms cubic-bezier(.3,1.4,.5,1) both}@keyframes stamp{from{transform:scale(.6);opacity:0}}.pay.on .tk{animation:stamp 220ms cubic-bezier(.3,1.4,.5,1) both}.rise{animation:rise 200ms cubic-bezier(.2,.8,.2,1) both}@keyframes rise{from{opacity:0;transform:translateY(6px)}}
.done-h h2{font-size:28px;line-height:36px;font-weight:800;letter-spacing:-.02em;margin-top:18px}
.done-h .hero{margin-top:6px}
.stub{margin:22px 16px 0;padding:6px 16px;border-radius:14px;background:var(--surf);box-shadow:inset 0 0 0 1px var(--sep)}
.stub .r{display:flex;justify-content:space-between;align-items:baseline;padding:10px 0;font-size:20px;font-weight:600}
.undo{position:relative;overflow:hidden;width:100%;margin-top:8px;color:var(--tx2);font-size:20px;font-weight:600;box-shadow:inset 0 0 0 1.5px var(--sep)}
.undo .bar{position:absolute;left:0;bottom:0;height:4px;width:100%;background:var(--tx);opacity:.85;transform-origin:left;animation:d 10s linear forwards}@keyframes d{to{transform:scaleX(0)}}
/* receipt */
.paperwrap{margin:16px 16px 0;filter:drop-shadow(0 1px 0 #E2DCCD)}
.paper{background:#FFFDF8;color:#1A1A1A;padding:22px 18px 26px;-webkit-mask:radial-gradient(circle 6px at 50% 100%,transparent 5.5px,#000 6px) 0 0/14px 100% repeat-x;mask:linear-gradient(#000,#000) top/100% calc(100% - 7px) no-repeat,radial-gradient(circle at 7px 100%,transparent 5px,#000 5.5px) bottom/14px 8px repeat-x}
.paper h3{font-size:24px;line-height:28px;font-weight:800;letter-spacing:-.01em}.paper .sm{color:#55524B}
.paper .r{display:grid;grid-template-columns:1fr auto 56px;gap:12px;padding:6px 0;align-items:baseline}.paper .r .c{color:#55524B;text-align:right}.paper .r b{text-align:right;font-weight:700}
.paper .rule{border-top:1px dashed #BDB6A6;margin:12px 0}
html[lang=hi] :is(.hero,.nm,h1,h2,.sec h4,.kul .m,.ask .qq){font-weight:700}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
'''
def top(left,right=''): return f'<div class="top">{left}<span class="ctx">{right}</span></div>'
def back(k='wapas',to='home',icon='back'): return f'<button class="tb l" data-go="{to}">{ic(icon,22)}{t(k)}</button>'

BILLS=[('6:12','n_rekha','rk','240','','cash'),('6:05','n_verma','vm','415','','ud'),('5:58','n_gr','gr','60','','upi'),('5:41','n_gupta','gp','500','+','jama'),('5:27','n_mishra','ms','520','','ud')]
def home():
  rows=''.join(f'<div class="row"><span class="tm m">{tm}</span><div class="g">{t(n,"b")}{t(it)}</div><div class="a">{rs(a,sg)}{t(mt,"small","ud" if mt=="ud" else "")}</div></div>' for tm,n,it,a,sg,mt in BILLS)
  owe=''.join(f'<div class="row"><div class="g">{t(n,"b")}{t(d)}</div><span class="m ud" style="font-size:20px;font-weight:700">{rs(a)}</span><button class="btn ol b56" style="padding:0 14px">{ic("wa",20)}{t("yaad")}</button></div>' for n,a,d in [('n_mishra','2,523','din23'),('n_gupta','1,980','din9'),('n_khan','860','din4')])
  return f'''<section class="view on" id="home" style="padding-bottom:260px">
{top('<span class="nm" data-t="store">'+T['store'][0]+'</span>','<button class="tb">'+ic('gear',22)+t('settings')+'</button>')}
<div style="padding:14px 16px 0"><div class="lab" style="display:flex;justify-content:space-between">{t('today')}{t('bills68','span','t3')}</div><div class="hero m" style="margin-top:10px">{rs('14,218')}</div>
<div class="splitline"><div><span>Cash</span><b class="m">9,642</b></div><div>UPI<b class="m">3,456</b></div><div><span data-t="ud" class="ud">Udhaar</span><b class="m ud">1,120</b></div></div></div>
<div class="row" style="margin-top:22px;border-top:1px solid var(--sep);min-height:80px"><span class="pill m">2</span><div class="g">{t('online','b')}{t('pack')}</div><button class="btn ink b56" style="padding:0 16px">{ic('bag',20)}{t('dekho')}</button></div>
<div class="sec"><h4 data-t="lena">{T['lena'][0]}</h4><span class="m ud" style="font-weight:700;padding-right:12px">{rs('32,484')}</span></div>{owe}
<div class="sec"><h4 data-t="aajbill">{T['aajbill'][0]}</h4></div>{rows}
<div class="fix" style="padding-top:8px"><button class="bolo" id="voicebar" data-go="listen"><b data-t="bolo">{T['bolo'][0]}</b><span data-t="bolohint">{T['bolohint'][0]}</span><i class="mk">{ic('mic',26)}</i></button>
<nav class="tabs"><a class="on">{ic('home',22)}{t('ghar')}</a><a>{ic('bill',22)}{t('billt')}</a><a>{ic('box',22)}{t('maal')}</a><a>{ic('khata',22)}{t('ud')}</a></nav></div></section>'''

def listen():
  bars=''
  for i in range(56):
    env=0.22+0.78*abs(math.sin(i*0.37)*math.cos(i*0.11+1))
    h=max(4,round(34*env*(0.55+0.45*((i*7919)%13)/13)))
    op=0.28+0.72*(i/55)**1.4
    bars+=f'<i style="height:{h}px;opacity:{op:.2f}"></i>'
  return f'''<section class="view" id="listen">{top(back('band','home','x'),'Bill 2205')}
<div class="stat"><span class="mk">{ic('mic',22)}</span>{t('sun')}<span class="t3 m" style="font-weight:600;font-size:18px;margin-left:auto">0:07</span></div>
<p class="tr" aria-live="polite"><span data-t="sp1">{T['sp1'][0]}</span> <span class="t3" data-t="sp2">{T['sp2'][0]}</span></p>
<div class="lvl">{bars}</div>
<div class="livebox"><div class="row" style="border-top:1px solid var(--sep)"><div class="g">{t('cheeni','b')}{t('kg2')}</div><div class="a">{rs('92')}</div></div>
<div class="row newrow" style="border-bottom:0"><div class="g">{t('maggi','b')}{t('mx')}</div><div class="a">{rs('14')}</div></div></div>
<div class="fix" style="display:flex;align-items:center;justify-content:space-between;gap:8px"><div>{t('abtak','div','lab')}<div class="m" style="font-size:36px;line-height:42px;font-weight:800;letter-spacing:-.025em">{rs('106')}</div></div>
<div style="display:flex;gap:8px"><button class="btn ol b56" style="padding:0 14px">{ic('pause',20)}{t('ruko')}</button><button class="btn ink" style="padding:0 22px" data-go="review">{ic('check',22)}{t('hogaya')}</button></div></div></section>'''

def review():
  opts=''.join(f'<button class="opt" data-go="pay"><span><span data-t="{k}">{T[k][0]}</span><small><span data-t="kulho">Kul ho jayega</span> <span class="m">{rs(n)}</span></small></span><span class="m">{rs(p)}</span></button>' for k,p,n in [('o1','28','195'),('o2','56','223'),('o3','25','192')])
  return f'''<section class="view" id="review" style="padding-bottom:120px">{top(back('wapas','listen'),'Bill 2205')}
<h1 style="font-size:30px;line-height:36px;font-weight:800;letter-spacing:-.02em;padding:6px 16px 14px" data-t="chk">{T['chk'][0]}</h1>
<button class="row" style="width:calc(100% - 16px);border-top:1px solid var(--sep)"><div class="g">{t('sharma','b')}<span class="ud" style="font-weight:600;color:var(--ud)">{t('ud')} {rs('2,416')}</span></div>{ic('chev',22)}</button>
<div class="row"><div class="g">{t('cheeni','b')}{t('kg2x')}</div><div class="a">{rs('92')}</div></div>
<div class="row dt"><div class="g">{t('maggi','b')}{t('pakka','span','flag')}</div><div class="a">{rs('14')}</div></div>
<div class="ask" id="ask"><div id="askyn"><div class="qq" data-t="q">{T['q'][0]}</div>
<div class="yn"><button class="btn ol b56" id="nahi">{ic('no',20)}{t('nahi')}</button><button class="btn ink b56" id="haan">{ic('check',22)}{t('haan')}</button></div><div class="hint" style="padding-top:8px"><span style="color:var(--vt)">{ic('mic',18)}</span>{t('yabolo')}</div></div>
<div id="askwhich" hidden><div class="qq" data-t="kaunsi">{T['kaunsi'][0]}</div><div class="opts">{opts}</div>
<button class="btn sf b56" style="width:100%;margin-top:8px">{ic('mic',20)}{t('bolke')}</button></div></div>
<div class="row"><div class="g">{t('toor','b')}{t('tx')}</div><div class="a">{rs('75')}</div></div>
<div class="fix" style="display:flex;align-items:center;justify-content:space-between;gap:12px"><div class="kul" style="padding:0;display:block">{t('kul','div','lab')}<span class="m">{rs('181')}</span></div><button class="btn ink" style="flex:0 0 auto;padding:0 24px" data-go="pay">{ic('cash',24)}{t('aage')}</button></div></section>'''

def pay():
  random.seed(7);cells=''
  for y in range(25):
    for x in range(25):
      f=(x<7 and y<7) or (x>17 and y<7) or (x<7 and y>17)
      on=(f and (x%18 in(0,6) or y%18 in(0,6) or (2<=x%18<=4 and 2<=y%18<=4))) or (not f and random.random()<.47)
      if on: cells+=f'<rect x="{x}" y="{y}" width="1.02" height="1.02"/>'
  qr=f'<svg viewBox="0 0 25 25" width="132" height="132" shape-rendering="crispEdges" fill="#111">{cells}</svg>'
  its=''.join(f'<div class="row" style="min-height:60px"><div class="g">{t(k,"b")}</div><div class="a" style="font-weight:600">{rs(a)}</div></div>' for k,a in [('cheeni','92'),('maggi','14'),('toor','75')])
  return f'''<section class="view" id="pay" style="padding-bottom:350px">{top(back('wapas','review'),'<b style="color:var(--tx);font-weight:600" data-t="sharma">Sharma ji</b>&nbsp; <span class="t3">2205</span>')}
<div style="padding:12px 16px 0">{t('kul','div','lab')}<div class="hero m" style="font-size:64px;line-height:64px;margin-top:8px">{rs('181')}</div></div>
<div id="its" style="margin-top:18px;border-top:1px solid var(--sep)">{its}</div>
<div class="qrbox" id="qrb"><div class="q">{qr}</div><div><div style="font-weight:700;font-size:20px" data-t="scan">{T['scan'][0]}</div><div class="t2" style="margin-top:6px"><i style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--tx3);margin-right:8px;vertical-align:3px"></i><span data-t="qrwait">{T['qrwait'][0]}</span></div><div class="m" style="font-size:34px;line-height:40px;font-weight:800;margin-top:10px;letter-spacing:-.02em">{rs('181')}</div><div class="t2" style="margin-top:2px">sharmastore@upi</div></div></div>
<div class="fix"><div style="font-weight:700;font-size:20px" data-t="kaise">{T['kaise'][0]}</div>
<div class="tiles" role="radiogroup" aria-label="Paisa kaise mila"><button class="pay" data-p="c"><span class="tk">{ic('check',16,2.6)}</span>{ic('cash',28)}<b>Cash</b><small data-t="haath">{T['haath'][0]}</small></button>
<button class="pay" data-p="p"><span class="tk">{ic('check',16,2.6)}</span>{ic('upi',28)}<b>UPI</b><small data-t="qrd">{T['qrd'][0]}</small></button>
<button class="pay u" data-p="u"><span class="tk">{ic('check',16,2.6)}</span>{ic('khata',28)}<b data-t="ud">{T['ud'][0]}</b><small data-t="khatem">{T['khatem'][0]}</small></button></div>
<div class="chg ud" id="chg"><span id="chgt" style="visibility:hidden"><span data-t="khata">{T['khata'][0]}</span> <span class="m">{rs('2,416')} → <b>{rs('2,597')}</b></span></span></div>
<div class="tender" id="tender"><button class="btn ol b56 m" style="flex:1">{rs('200')}</button><button class="btn ol b56 m" style="flex:1">{rs('500')}</button><span class="t2" style="flex:1.2;font-weight:600;text-align:right">Lautao <b class="m" style="color:var(--tx)">{rs('19')}</b></span></div>
<button class="btn ink" id="cf" aria-live="polite" style="width:100%;margin-top:10px" disabled data-go="done">{ic('up',22)}<span data-t="pehle" style="transform:rotate(0)">{T['pehle'][0]}</span></button>
<button class="btn ol b56" id="aagaya" hidden style="width:100%;margin-top:8px" data-go="done">{ic('check',22)}{t('aagaya')}</button>
<button class="btn ol b56" id="thoda" style="width:100%;margin-top:8px;font-weight:700">{ic('split',20)}{t('thoda')}</button></div></section>'''

def done():
  return f'''<section class="view" id="done" style="padding-bottom:260px">{top('<span></span>','<span class="m">6:15 pm</span>')}
<div class="done-h"><span class="ok"><i>{ic('check',18,2.8)}</i>{t('saved')}</span><h2 data-t="likhdiya">{T['likhdiya'][0]}</h2><div class="hero m ud rise">{rs('181')}</div></div>
<div class="stub"><div class="r"><span class="t2" data-t="p1">{T['p1'][0]}</span><span class="m">{rs('2,416')}</span></div><div class="r"><span class="t2" data-t="p2">{T['p2'][0]}</span><span class="m">{rs('181','+ ')}</span></div>
<div class="dbl" style="margin-top:4px"></div><div class="r" style="padding-top:12px"><span style="font-weight:700" data-t="p3">{T['p3'][0]}</span><span class="m ud" style="font-size:28px;font-weight:800"><span class="rs">₹</span><span id="cu">2,597</span></span></div></div>
<div class="row" style="margin-top:12px;border-bottom:0"><div class="g">{t('items3','b')}<span>{t('cheeni')}, {t('maggi')}, {t('toor')}</span></div>{ic('chev',22)}</div>
<div class="fix"><div style="display:grid;grid-template-columns:auto 1fr;gap:8px"><button class="btn ol" data-go="billimg">{ic('wa',22)}WhatsApp</button><button class="btn vo" data-go="listen">{ic('mic',24)}{t('agla')}</button></div>
<button class="btn b56 undo">{ic('undo',20)}{t('undo')}<span class="m t3" id="ucount" style="margin-left:6px">10 sec</span><i class="bar"></i></button></div></section>'''

def bill():
  its=[('cheeni','2 kg × 46','2 किलो × 46','92'),('maggi','1 × 14','1 × 14','14'),('toor','½ kg × 150','आधा किलो × 150','75')]
  rows=''.join(f'<div class="r"><span data-t="{k}">{T[k][0]}</span><span class="c" data-hi="{h}">{e}</span><b class="m">{a}</b></div>' for k,e,h,a in its)
  return f'''<section class="view" id="billimg" style="padding-bottom:110px">{top(back('wapas','done'),'WhatsApp')}
<div class="paperwrap"><div class="paper"><h3 data-t="store">{T['store'][0]}</h3><div class="sm"><span data-t="addr">{T['addr'][0]}</span>, 98270 12345</div><div class="rule"></div>
<div style="display:flex;justify-content:space-between" class="sm m"><span>Bill 2205</span><span>24.11.2026, 6:15 pm</span></div><div style="margin-top:4px"><span data-t="grahak">Grahak</span>: <b data-t="sharma">Sharma ji</b></div><div class="rule"></div>{rows}
<div style="border-top:2px solid #1A1A1A;margin-top:10px;padding-top:12px;display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:22px" data-t="kul">Kul</b><b class="m" style="font-size:28px;font-weight:800">{rs('181')}</b></div>
<div style="color:#7A4A00;font-weight:700;margin-top:10px" data-t="likha">{T['likha'][0]}</div><div class="rule"></div><div class="sm" style="display:flex;justify-content:space-between"><span>UPI: sharmastore@upi</span></div><div class="sm" style="margin-top:4px" data-t="dhanya">{T['dhanya'][0]}</div></div></div>
<div class="fix"><button class="btn ink" style="width:100%">{ic('wa',22)}{t('bhejo')}</button></div></section>'''

JS='''<script>
const T=%s;const q=new URLSearchParams(location.search);const HI=q.get('lang')==='hi';const $=s=>document.querySelector(s);
document.documentElement.dataset.theme=q.get('theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
document.documentElement.lang=HI?'hi':'en-IN';if(HI){document.querySelectorAll('[data-t]').forEach(e=>{const v=T[e.dataset.t];if(v)e.textContent=v[1]});document.querySelectorAll('[data-hi]').forEach(e=>e.textContent=e.dataset.hi)}
const fmt=n=>n.toLocaleString('en-IN');let prev='home';
function go(id){const cur=document.querySelector('.view.on');if(cur)prev=cur.id;document.querySelectorAll('.view').forEach(v=>v.classList.toggle('on',v.id===id));scrollTo(0,0);if(id==='done')countUp();if(id==='pay')upiTimer&&clearInterval(upiTimer);}
function countUp(){const e=$('#cu');const t0=performance.now()+220;const f=t=>{const k=Math.max(0,Math.min(1,(t-t0)/480));e.textContent=fmt(Math.round(2416+181*(1-Math.pow(1-k,3))));if(k<1)requestAnimationFrame(f)};requestAnimationFrame(f);
 let n=10;const u=$('#ucount');const SEC=HI?' सेकंड':' sec';u.textContent=n+SEC;clearInterval(window._u);window._u=setInterval(()=>{n--;u.textContent=n>0?n+SEC:'';if(n<=0)clearInterval(window._u)},1000)}
let sx=null;addEventListener('touchstart',e=>{sx=e.touches[0].clientX<24?e.touches[0].clientX:null});addEventListener('touchend',e=>{if(sx!==null&&e.changedTouches[0].clientX-sx>60)go(prev);sx=null});
let upiTimer=null;
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>{if(!b.disabled)go(b.dataset.go)}));
$('#haan').onclick=()=>{navigator.vibrate?.(10);$('#ask').hidden=true;const d=$('.dt');d.classList.remove('dt');d.querySelector('.flag').textContent=HI?'छोटा पैकेट':'chhota packet';d.querySelector('.flag').className=''};
$('#nahi').onclick=()=>{$('#askyn').hidden=true;const w=$('#askwhich');w.hidden=false;w.classList.add('rise');$('.dt .flag').style.display='none';$('.dt').style.cssText='min-height:56px;padding-top:12px;padding-bottom:4px'};
const L={c:['cashsave','cash'],p:['upisave','upi'],u:['save','khata']};const ICO={cash:`%s`,upi:`%s`,khata:`%s`};
document.querySelectorAll('.pay').forEach(b=>{b.setAttribute('role','radio');b.setAttribute('aria-checked','false')});
document.querySelectorAll('.pay').forEach(b=>b.onclick=()=>{navigator.vibrate?.(10);document.querySelectorAll('.pay').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-checked',x===b)});const p=b.dataset.p;
 $('#chgt').style.visibility=p==='u'?'visible':'hidden';$('#tender').classList.toggle('on',p==='c');$('#chg').style.display=p==='c'?'none':'flex';
 $('#qrb').classList.toggle('on',p==='p');$('#its').style.display=p==='p'?'none':'block';
 const cf=$('#cf');cf.disabled=p==='p';const k=L[p][0];
 clearInterval(upiTimer);$('#aagaya').hidden=true;if(p==='p'){let sec=0;upiTimer=setInterval(()=>{sec++;const w=$('#waitt');if(w)w.textContent='0:'+String(sec).padStart(2,'0');if(sec>=20)$('#aagaya').hidden=false},1000)}
 cf.innerHTML=p==='p'?'<span class="waitdot"></span><span>'+(HI?'₹181 का इंतज़ार':'₹181 ka intezaar')+'</span><span class="m" id="waitt" style="opacity:.7">0:00</span>':ICO[L[p][1]]+'<span class="m">₹181</span><span>'+(HI?T[k][1]:T[k][0])+'</span>'});
</script>'''%(json.dumps(T,ensure_ascii=False),ic('cash',24),ic('upi',24),ic('khata',24))
HEAD='''<!doctype html><html lang="hi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dukaan</title>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@500;600;700;800&family=Mukta:wght@500;600;700;800&display=swap" rel="stylesheet"><style>'''+CSS+'</style></head><body>'
open(OUT,'w').write(HEAD+home()+listen()+review()+pay()+done()+bill()+JS+'</body></html>')
