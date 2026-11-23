# Round 4: new review flow. Action dock above the mic (never behind it), consequence written on Save, payment tiles with icons.
src3 = open('gen3.py').read()
exec('\n'.join(l for l in src3.splitlines() if not l.startswith("open('r3")))
CSS = CSS.replace(".tabs{position:absolute",".tabs{position:fixed")
CSS += """.dock{position:fixed;left:0;right:0;bottom:132px;padding:12px 16px 10px;background:#fff;border-top:1px solid #E4E7EC;box-shadow:0 -6px 16px rgba(16,24,40,.06)}
.tile{min-height:72px;border-radius:14px;border:2px solid #C4CAD3;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-weight:700;font-size:19px}
.tile.sel{border-color:#0B7A4B;background:#0B7A4B;color:#fff}.tile.selu{border-color:#8A4B12;background:#8A4B12;color:#fff}"""
UPI = svg('<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>', 24)
BOOK2 = BOOK.replace('26', '24')
ROWS = ''.join(f'<div style="border-top:1px solid #E4E7EC;padding:10px 0"><div class="row" style="min-height:36px"><b style="font-size:20px">{n}</b><span class="amt" style="color:#8A4B12;font-size:22px">{a}</span></div><div class="row" style="min-height:52px"><span class="sub">{d} din se baaki</span><span class="wa">{WA}WhatsApp pe yaad</span></div></div>' for n,d,a in [('Mishra ji',5,'₹2,523'),('Sharma ji · gali 4',4,'₹2,416')])
i0 = home.index('<div class="row" style="border-top:1px solid #E4E7EC;min-height:64px">'); i1 = home.index('</div>\n<div class="card" style="padding:4px 20px">')
home = home[:i0] + ROWS + home[i1:]
home = home.replace('<div class="sub" style="margin-top:4px"><b>68</b> bill · Udhaar diya <b style="color:#8A4B12">₹1,120</b></div>',
  '<div style="display:flex;gap:24px;margin-top:6px;font-size:19px"><span><b>68</b> bill</span><span>Udhaar diya <b style="color:#8A4B12">₹1,120</b></span></div>')
def review(state):
    maggi = ('<div style="margin:0 -20px;padding:12px 20px 14px;background:#FFF4D1;border-left:6px solid #D99A00"><div class="row" style="min-height:40px"><span><b style="font-size:20px">Maggi chhota?</b><div class="sub" style="color:#5C4000">Yahi wali? 1 × ₹14</div></span><b class="num" style="font-size:24px">₹14</b></div>'
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px"><div class="pay" style="min-height:56px;font-size:20px;background:#0B7A4B;border-color:#0B7A4B;color:#fff">✓ Haan, yahi</div><div class="pay" style="min-height:56px;font-size:20px">Doosri chuno</div></div></div>'
      if state == 'pending' else
      '<div class="row" style="min-height:68px;border-top:1px solid #E4E7EC"><span><b style="font-size:20px">Maggi chhota</b><div class="sub">1 × ₹14</div></span><b class="num" style="font-size:24px">₹14</b></div>')
    sel = '' if state == 'pending' else 'udhaar'
    tiles = ''.join(f'<div class="tile {("selu" if k=="udhaar" else "sel") if sel==k else ""}">{ic}{t}</div>' for k,t,ic in [('cash','Cash',CASH),('upi','UPI',UPI),('udhaar','Udhaar',BOOK2)])
    dock = ('<div class="dock"><div class="btn" style="margin:0;background:#D7DCE2;color:#3A414C;flex-direction:column;gap:0;min-height:68px"><span>Bill save karo</span><span style="font-size:17px;font-weight:600">Pehle: Maggi pakka karo · paisa chuno</span></div></div>'
            if state == 'pending' else
            '<div class="dock"><div class="btn" style="margin:0;background:#0B7A4B;color:#fff;flex-direction:column;gap:0;min-height:68px"><span>✓ Bill save karo · ₹181</span><span style="font-size:17px;font-weight:600;color:#D7F0E3">Udhaar → Sharma ji ke khate mein (ab ₹2,597)</span></div></div>')
    body = f"""<div style="padding:12px 16px 4px"><div class="ql" style="color:#0E1116">← Peeche</div>
<div style="font-weight:700;font-size:30px;line-height:36px">Bill check karo</div>
<div class="sub" style="margin-top:2px">Aapne bola: "Sharma ji, do kilo cheeni, ek Maggi, aadha kilo toor dal"</div></div>
<div class="card" style="margin-top:12px;padding:6px 20px"><div class="row"><span class="sub">Grahak</span><b style="font-size:20px">Sharma ji · gali 4</b></div></div>
<div class="card" style="padding:4px 20px">
<div class="row" style="min-height:68px"><span><b style="font-size:20px">Cheeni</b><div class="sub">2 kg × ₹46</div></span><b class="num" style="font-size:24px">₹92</b></div>{maggi}
<div class="row" style="min-height:68px;border-top:1px solid #E4E7EC"><span><b style="font-size:20px">Toor Dal</b><div class="sub">½ kg × ₹150</div></span><b class="num" style="font-size:24px">₹75</b></div></div>
<div class="card"><div class="row" style="min-height:44px"><b style="font-size:22px">Kul</b><span class="num" style="font-size:40px">₹181</span></div>
<div style="font-weight:700;font-size:20px;margin:10px 0 8px">Paisa kaise mila?</div>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">{tiles}</div></div><div style="height:120px"></div>"""
    return wrap(body, 'bill', dock)
saved = wrap(f"""<div style="padding:40px 20px 0;text-align:center"><div style="width:84px;height:84px;border-radius:50%;background:#0B7A4B;color:#fff;display:grid;place-items:center;margin:0 auto;font-size:44px">✓</div>
<div style="font-weight:700;font-size:30px;margin-top:14px">Bill ban gaya</div><div class="sub" style="font-size:20px">₹181 · Udhaar · Sharma ji (ab ₹2,597)</div></div>
<div class="card" style="margin-top:20px;display:flex;flex-direction:column;gap:10px"><div class="btn" style="margin:0;background:#1FA855;color:#fff">{WA} Sharma ji ko WhatsApp bhejo</div>
<div class="btn" style="margin:0;background:#fff;box-shadow:inset 0 0 0 2px #C4CAD3;color:#0E1116">Ghar</div></div>
<div style="margin:16px;padding:14px 16px;border-radius:14px;background:#0E1116;color:#fff;display:flex;justify-content:space-between;align-items:center;font-size:19px"><span>Galat hua?</span><b style="color:#7BE0AE;min-height:48px;display:flex;align-items:center">↶ Wapas lo (10s)</b></div>""", 'bill')
open('r4-home.html','w').write(wrap(home,'home')); open('r4-pending.html','w').write(review('pending')); open('r4-ready.html','w').write(review('ready')); open('r4-saved.html','w').write(saved)
