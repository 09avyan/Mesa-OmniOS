# Round 3: fresh layout. One solid primary per screen, quiet secondaries, Hind (bigger x-height), nothing pre-selected.
exec(open('gen2.py').read().split("home = f")[0])  # reuse icons/helpers
F = "family=Hind:wght@400;500;600;700"
CSS = CSS.replace("'Mukta'", "'Hind'").replace("color:#3F4652", "color:#2B313A").replace("#F3F5F7;color:#111418", "#F2F4F6;color:#0E1116")
CSS += """.ql{color:#0B7A4B;font-weight:700;display:inline-flex;gap:6px;align-items:center;min-height:48px}
.sub{font-size:18px;line-height:24px;color:#2B313A}.amt{font-weight:700;font-size:20px}
.bar{position:absolute;left:0;right:0;bottom:88px;padding:10px 16px 12px;background:linear-gradient(#F2F4F600,#F2F4F6 30%)}"""
GEARW = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>'
def wrap(b, on, bar=''): return f'<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?{F}&display=block" rel="stylesheet"><style>{CSS}</style></head><body>{b}{bar}{tabs(on)}</body></html>'
home = f"""<div style="padding:12px 16px 0" class="row"><div><div class="sub">Namaste 🙏</div><div style="font-weight:700;font-size:26px;line-height:30px">Test Dukaan</div></div>
<div style="display:flex;gap:8px"><div class="hbtn" style="background:#fff;box-shadow:inset 0 0 0 2px #D0D5DD;min-height:56px">{QR}QR</div><div class="hbtn" style="background:#fff;box-shadow:inset 0 0 0 2px #D0D5DD;min-height:56px">{GEARW}Settings</div></div></div>
<div class="card" style="margin-top:12px;padding:18px 20px"><div class="sub">Aaj ki bikri · 5:40 baje tak</div>
<div class="num" style="font-size:56px;line-height:60px;color:#0B7A4B">₹14,218</div>
<div class="sub" style="margin-top:4px"><b>68</b> bill · Udhaar diya <b style="color:#8A4B12">₹1,120</b></div></div>
<div class="card" style="padding:16px 20px"><div class="row" style="min-height:36px"><b style="font-size:22px">Aaj ki shuruaat</b><span style="color:#0B7A4B;font-weight:700">22 din poore ✓</span></div>
<div class="sub" style="margin:4px 0 8px">Kal ₹21,864 ki bikri hui · 101 bill</div>
<div class="btn" style="margin:0;background:#0B7A4B;color:#fff">{BOX.replace('26','24')} Aaj 3 saaman gino · 1 min</div>
<div style="font-weight:700;font-size:20px;margin-top:16px">Inse paisa lena hai</div>
{''.join(f'<div class="row" style="border-top:1px solid #E4E7EC;min-height:64px"><span style="min-width:0"><b style="font-size:19px">{n}</b><div class="sub">{d} din se baaki</div></span><span style="text-align:right;white-space:nowrap"><span class="amt" style="color:#8A4B12">{a}</span><div class="ql" style="min-height:40px;font-size:17px">{WA}Yaad dilao</div></span></div>' for n,d,a in [('Mishra ji',5,'₹2,523'),('Sharma ji · gali 4',4,'₹2,416')])}</div>
<div class="card" style="padding:4px 20px">{''.join(f'<div class="row" style="min-height:64px;border-top:{"none" if i==0 else "1px solid #E4E7EC"}"><span style="display:flex;align-items:center;gap:12px;font-weight:600"><span class="ic" style="background:#EEF1F4;color:#2B313A">{ic}</span>{t}</span><span style="font-weight:700;color:#0B7A4B">{r} ›</span></div>' for i,(t,r,ic) in enumerate([('Pura hisaab','',CHART),('Galla gino','',CASH),('Online orders','2 naye',CART),('Free thaile mangao','',BAG)]))}</div>"""
review = f"""<div style="padding:12px 16px 4px"><div class="ql" style="color:#0E1116">← Peeche</div>
<div style="font-weight:700;font-size:30px;line-height:36px">Bill check karo</div>
<div class="sub" style="margin-top:2px">Aapne bola: "Sharma ji, do kilo cheeni, ek Maggi, aadha kilo toor dal"</div></div>
<div class="card" style="margin-top:12px;padding:6px 20px"><div class="row"><span class="sub">Grahak</span><b style="font-size:20px">Sharma ji · gali 4</b></div></div>
<div class="card" style="padding:4px 20px">
<div class="row" style="min-height:68px"><span><b style="font-size:20px">Cheeni</b><div class="sub">2 kg × ₹46</div></span><b class="num" style="font-size:24px">₹92</b></div>
<div style="margin:0 -20px;padding:12px 20px 14px;background:#FFF4D1;border-left:6px solid #D99A00"><div class="row" style="min-height:40px"><span><b style="font-size:20px">Maggi chhota?</b><div class="sub" style="color:#5C4000">Yahi wali? 1 × ₹14</div></span><b class="num" style="font-size:24px">₹14</b></div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px"><div class="pay" style="min-height:56px;font-size:20px;background:#0B7A4B;border-color:#0B7A4B;color:#fff">✓ Haan, yahi</div><div class="pay" style="min-height:56px;font-size:20px">Doosri chuno</div></div></div>
<div class="row" style="min-height:68px;border-top:1px solid #E4E7EC"><span><b style="font-size:20px">Toor Dal</b><div class="sub">½ kg × ₹150</div></span><b class="num" style="font-size:24px">₹75</b></div></div>
<div class="card"><div class="row" style="min-height:44px"><b style="font-size:22px">Kul</b><span class="num" style="font-size:40px">₹181</span></div>
<div style="font-weight:700;font-size:20px;margin:10px 0 8px">Paisa kaise mila? Chuno</div>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px"><div class="pay" style="min-height:64px;font-size:20px">Cash</div><div class="pay" style="min-height:64px;font-size:20px">UPI</div><div class="pay" style="min-height:64px;font-size:20px">Udhaar</div></div></div>
<div style="height:90px"></div>"""
bar = """<div class="bar"><div class="btn" style="margin:0;background:#D7DCE2;color:#4A525E">✓ Bill save karo</div><div class="sub" style="text-align:center;margin-top:4px;font-size:17px">Pehle Maggi pakka karo, phir paisa chuno</div></div>"""
open('r3-home.html','w').write(wrap(home,'home')); open('r3-review.html','w').write(wrap(review,'bill',bar))
