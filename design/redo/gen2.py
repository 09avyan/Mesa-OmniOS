# Version C, round 2: panel fixes applied. Same real TEST data.
F = "family=Mukta:wght@500;600;700;800"
CSS = """*{box-sizing:border-box;margin:0}body{background:#F3F5F7;color:#111418;font:500 18px/26px 'Mukta',sans-serif;width:390px;min-height:844px;position:relative;padding-bottom:130px}
.num{font-variant-numeric:tabular-nums;font-weight:800;letter-spacing:-.5px}.lab{color:#3F4652}
.card{background:#fff;border-radius:16px;margin:0 16px 14px;padding:16px 18px;box-shadow:0 1px 2px rgba(16,24,40,.06),0 6px 16px rgba(16,24,40,.05)}
.row{display:flex;justify-content:space-between;align-items:center;gap:10px;min-height:56px}
.ic{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;flex:none}
.hbtn{min-height:52px;padding:0 12px;border-radius:14px;background:#F3F5F7;display:flex;gap:6px;align-items:center;font-weight:700;font-size:17px;color:#111418}
.tabs{position:absolute;bottom:0;left:0;right:0;height:88px;background:#fff;border-top:1px solid #E4E7EC;display:grid;grid-template-columns:1fr 1fr 100px 1fr 1fr;align-items:center;text-align:center;font-weight:700;font-size:18px;color:#3F4652}
.tab svg{display:block;margin:0 auto 2px}.tab.on{color:#0B7A4B}
.mic{width:78px;height:78px;border-radius:50%;margin:-42px auto 0;display:grid;place-items:center;background:#0B7A4B;color:#fff;box-shadow:0 0 0 5px #fff,0 6px 16px rgba(11,122,75,.35)}.micw{font-weight:800;font-size:18px;color:#0B7A4B}
.btn{display:flex;align-items:center;justify-content:center;gap:8px;min-height:64px;border-radius:16px;font-weight:800;font-size:20px;margin:0 16px}
.pay{min-height:60px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:800;font-size:18px;border:2px solid #D0D5DD;background:#fff}
.wa{min-height:48px;padding:0 12px;border-radius:12px;border:2px solid #1FA855;color:#137A3C;font-weight:700;font-size:17px;display:flex;align-items:center;gap:6px}"""
def svg(d, s=24, w=2.2): return f'<svg width="{s}" height="{s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round">{d}</svg>'
MIC = svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>', 32)
HOME = svg('<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>', 26)
BILL = svg('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>', 26)
BOX = svg('<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>', 26)
BOOK = svg('<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M9 9h6M9 13h4"/>', 26)
QR = svg('<rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><path d="M14 14h2v2M18 18h2v2M14 20h2"/>', 22)
GEAR = svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>', 22)
CHART = svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', 22); CASH = svg('<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>', 22)
CART = svg('<path d="M3 4h2l2.5 11h11L21 7H7"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>', 22); BAG = svg('<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>', 22)
WA = svg('<path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z"/>', 20)
def tabs(on): return f"""<div class="tabs"><div class="tab {'on' if on=='home' else ''}">{HOME}Ghar</div><div class="tab {'on' if on=='bill' else ''}">{BILL}Bill</div>
<div><div class="mic">{MIC}</div><div class="micw">Bolo</div></div><div class="tab">{BOX}Maal</div><div class="tab">{BOOK}Udhaar</div></div>"""
def wrap(b, on): return f'<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?{F}&display=block" rel="stylesheet"><style>{CSS}</style></head><body>{b}{tabs(on)}</body></html>'
home = f"""<div style="background:#fff;padding:14px 16px 18px;margin-bottom:14px;border-bottom:1px solid #E4E7EC">
<div class="row" style="min-height:52px"><div style="display:flex;gap:10px;align-items:center;min-width:0"><div style="width:44px;height:44px;border-radius:14px;background:#0B7A4B;color:#fff;display:grid;place-items:center;font-weight:800;font-size:22px">T</div>
<div><div class="lab" style="font-size:17px;line-height:20px">Namaste 🙏</div><div style="font-weight:800;font-size:24px;line-height:28px">Test Dukaan</div></div></div>
<div style="display:flex;gap:8px"><div class="hbtn">{QR}QR</div><div class="hbtn">{GEAR}</div></div></div>
<div style="margin-top:14px;background:#0B7A4B;color:#fff;border-radius:18px;padding:16px 18px">
<div style="font-size:18px;color:#CFEBDD">Aaj ki bikri · 5:40 baje tak</div><div class="num" style="font-size:52px;line-height:58px">₹14,218</div>
<div style="display:flex;gap:10px;margin-top:8px"><div style="flex:1;padding:8px 12px;border-radius:12px;background:rgba(255,255,255,.14)"><div style="font-size:17px;color:#CFEBDD">Bill</div><b class="num" style="font-size:24px">68</b></div>
<div style="flex:1;padding:8px 12px;border-radius:12px;background:rgba(255,255,255,.14)"><div style="font-size:17px;color:#CFEBDD">Udhaar diya</div><b class="num" style="font-size:24px">₹1,120</b></div></div></div></div>
<div class="card"><div class="row" style="min-height:40px"><b style="font-size:22px;font-weight:800">Aaj ki shuruaat</b><span style="background:#E3F3EA;color:#0B7A4B;border-radius:999px;padding:2px 12px;font-weight:700;font-size:17px">22 din poore ✓</span></div>
<div class="row" style="min-height:44px"><span class="lab">Kal ki bikri</span><b>₹21,864 · 101 bill</b></div>
<div style="margin-top:6px;font-weight:700">Inse paisa lena hai</div>
<div class="row"><span>Mishra ji<div class="lab" style="font-size:17px;line-height:20px">5 din se · <b style="color:#8A4B12">₹2,523</b></div></span><span class="wa">{WA}Yaad dilao</span></div>
<div class="row"><span>Sharma ji · gali 4<div class="lab" style="font-size:17px;line-height:20px">4 din se · <b style="color:#8A4B12">₹2,416</b></div></span><span class="wa">{WA}Yaad dilao</span></div>
<div class="btn" style="margin:10px 0 0;min-height:56px;font-size:19px;border:2px solid #0B7A4B;color:#0B7A4B">{BOX.replace('26','22')} Aaj 3 saaman gino · 1 minute</div></div>
<div class="card" style="padding:4px 18px">{''.join(f'<div class="row" style="min-height:64px;border-top:{"none" if i==0 else "1px solid #E4E7EC"}"><span style="display:flex;align-items:center;gap:12px;font-weight:700"><span class="ic" style="background:{c}1F;color:{c}">{ic}</span>{t}</span><span class="lab" style="font-weight:700">{r} ›</span></div>' for i,(t,r,ic,c) in enumerate([('Pura hisaab','',CHART,'#6B4FA0'),('Galla gino','',CASH,'#8A6A00'),('Online orders','<span style="background:#B42318;color:#fff;border-radius:999px;padding:0 9px">2 naye</span>',CART,'#0E7490'),('Free thaile mangao','',BAG,'#9D174D')]))}</div>"""
review = f"""<div style="padding:12px 16px 4px"><div class="hbtn" style="display:inline-flex;background:none;padding:0">← Peeche</div>
<div style="font-weight:800;font-size:30px;line-height:36px;margin-top:4px">Bill check karo</div>
<div class="lab" style="margin-top:2px">Aapne bola: "Sharma ji, do kilo cheeni, ek Maggi, aadha kilo toor dal"</div></div>
<div class="card" style="margin-top:12px;padding:8px 18px"><div class="row"><span class="lab">Grahak</span><b>Sharma ji · gali 4 ›</b></div></div>
<div class="card" style="padding:4px 18px">
<div class="row" style="min-height:66px"><span><b>Cheeni</b><div class="lab">2 kg × ₹46</div></span><b class="num" style="font-size:24px">₹92</b></div>
<div style="margin:0 -18px;padding:10px 18px 12px;background:#FFF4D1;border-left:6px solid #D99A00"><div class="row" style="min-height:40px"><span><b>Maggi chhota?</b><div style="color:#6B4A00">1 × ₹14 · yahi wali?</div></span><b class="num" style="font-size:24px">₹14</b></div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><div class="pay" style="min-height:54px;border-color:#0B7A4B;color:#0B7A4B">✓ Haan, yahi</div><div class="pay" style="min-height:54px">Doosri chuno</div></div></div>
<div class="row" style="min-height:66px;border-top:1px solid #E4E7EC"><span><b>Toor Dal</b><div class="lab">½ kg × ₹150</div></span><b class="num" style="font-size:24px">₹75</b></div></div>
<div class="card"><div class="row" style="min-height:44px"><b style="font-size:22px">Kul</b><span class="num" style="font-size:38px">₹181</span></div>
<div style="font-weight:700;margin:8px 0 6px">Paisa kaise mila?</div>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px"><div class="pay">Cash</div><div class="pay">UPI</div><div class="pay" style="border-color:#8A4B12;background:#FBEFE3;color:#8A4B12">✓ Udhaar</div></div>
<div style="margin-top:10px;color:#8A4B12;font-weight:600">Sharma ji ke khate mein likhenge · ab kul ₹2,597</div></div>
<div class="btn" style="background:#FBE7B0;color:#6B4A00">↑ Pehle 1 item pakka karo</div>"""
open('clean2-home.html','w').write(wrap(home,'home')); open('clean2-review.html','w').write(wrap(review,'bill'))
