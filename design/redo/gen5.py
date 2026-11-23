# Round 5: payment choice lives IN the dock (never hidden); saved screen: one solid action (Ghar, owner decision), big persistent undo.
src = open('gen4.py').read()
exec('\n'.join(l for l in src.splitlines() if not l.startswith("open('r4")))
CSS += """.dock2{position:fixed;left:0;right:0;bottom:132px;padding:12px 16px 12px;background:#fff;border-top:1px solid #E4E7EC;box-shadow:0 -8px 20px rgba(16,24,40,.08);border-radius:20px 20px 0 0}
.t2{min-height:60px;border-radius:14px;border:2px solid #C4CAD3;background:#fff;display:flex;align-items:center;justify-content:center;gap:6px;font-weight:700;font-size:19px}
.t2.sel{border-color:#0B7A4B;background:#0B7A4B;color:#fff}.t2.selu{border-color:#8A4B12;background:#8A4B12;color:#fff}"""
def review5(state):
    maggi = ('<div style="margin:0 -20px;padding:12px 20px 14px;background:#FFF4D1;border-left:6px solid #D99A00"><div class="row" style="min-height:40px"><span><b style="font-size:20px">Maggi chhota?</b><div class="sub" style="color:#5C4000">Yahi wali? 1 × ₹14</div></span><b class="num" style="font-size:24px">₹14</b></div>'
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px"><div class="pay" style="min-height:56px;font-size:20px;background:#0B7A4B;border-color:#0B7A4B;color:#fff">✓ Haan, yahi</div><div class="pay" style="min-height:56px;font-size:20px">Doosri chuno</div></div></div>'
      if state == 'pending' else '<div class="row" style="min-height:68px;border-top:1px solid #E4E7EC"><span><b style="font-size:20px">Maggi chhota</b><div class="sub">1 × ₹14</div></span><b class="num" style="font-size:24px">₹14</b></div>')
    sel = '' if state == 'pending' else 'udhaar'
    tiles = ''.join(f'<div class="t2 {("selu" if k=="udhaar" else "sel") if sel==k else ""}">{ic}{t}</div>' for k,t,ic in [('cash','Cash',CASH),('upi','UPI',UPI),('udhaar','Udhaar',BOOK2)])
    save = ('<div class="btn" style="margin:10px 0 0;background:#E9ECF0;color:#2B313A;flex-direction:column;gap:0;min-height:64px;font-size:19px"><span>Bill save karo</span><span style="font-size:18px;font-weight:600;color:#2B313A">Pehle upar peela item pakka karo</span></div>'
            if state == 'pending' else
            '<div class="btn" style="margin:10px 0 0;background:#0B7A4B;color:#fff;flex-direction:column;gap:0;min-height:64px"><span>✓ Bill save karo · ₹181</span><span style="font-size:18px;font-weight:600;color:#D7F0E3">Udhaar → Sharma ji ka khata (ab ₹2,597)</span></div>')
    dock = f'<div class="dock2"><div class="row" style="min-height:32px"><b style="font-size:19px">Paisa kaise mila?</b><b class="num" style="font-size:26px">₹181</b></div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:6px">{tiles}</div>{save}</div>'
    body = f"""<div style="padding:12px 16px 4px"><div class="ql" style="color:#0E1116">← Peeche</div>
<div style="font-weight:700;font-size:30px;line-height:36px">Bill check karo</div>
<div class="sub" style="margin-top:2px">Aapne bola: "Sharma ji, do kilo cheeni, ek Maggi, aadha kilo toor dal"</div></div>
<div class="card" style="margin-top:12px;padding:6px 20px"><div class="row"><span class="sub">Grahak</span><b style="font-size:20px">Sharma ji · gali 4</b></div></div>
<div class="card" style="padding:4px 20px">
<div class="row" style="min-height:68px"><span><b style="font-size:20px">Cheeni</b><div class="sub">2 kg × ₹46</div></span><b class="num" style="font-size:24px">₹92</b></div>{maggi}
<div class="row" style="min-height:68px;border-top:1px solid #E4E7EC"><span><b style="font-size:20px">Toor Dal</b><div class="sub">½ kg × ₹150</div></span><b class="num" style="font-size:24px">₹75</b></div></div>
<div style="height:300px"></div>"""
    return wrap(body, 'bill', dock)
saved5 = wrap(f"""<div style="padding:36px 20px 0;text-align:center"><div style="width:84px;height:84px;border-radius:50%;background:#0B7A4B;color:#fff;display:grid;place-items:center;margin:0 auto;font-size:44px">✓</div>
<div style="font-weight:700;font-size:30px;margin-top:14px">Bill ban gaya</div><div class="sub" style="font-size:20px;line-height:28px">₹181 · Udhaar<br>Sharma ji ka khata ab ₹2,597</div></div>
<div style="margin:20px 16px 0;display:flex;flex-direction:column;gap:12px">
<div class="btn" style="margin:0;background:#fff;box-shadow:inset 0 0 0 2px #1FA855;color:#137A3C">{WA} Sharma ji ko WhatsApp bhejo</div>
<div class="btn" style="margin:0;background:#0B7A4B;color:#fff">{HOME.replace('26','24')} Ghar</div></div>
<div style="margin:20px 16px 0;padding:14px 16px;border-radius:16px;background:#FFF4D1;color:#5C4000"><div style="font-size:19px;font-weight:600">Galti ho gayi? Agla bill banane tak wapas le sakte hain.</div>
<div class="btn" style="margin:10px 0 0;min-height:60px;background:#fff;box-shadow:inset 0 0 0 2px #8A6A00;color:#5C4000;font-size:20px">↶ Bill wapas lo</div></div>""", 'bill')
open('r5-pending.html','w').write(review5('pending')); open('r5-ready.html','w').write(review5('ready')); open('r5-saved.html','w').write(saved5)
