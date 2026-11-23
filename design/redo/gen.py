# Generates Home + Review prototypes for 3 directions with the same real TEST data.
V = {
 'signboard': dict(font='Khand:wght@500;600;700&family=Hind:wght@400;500;600', head="'Khand',sans-serif", body="'Hind',sans-serif",
   bg='#F4F1EA', surf='#FFFFFF', ink='#101828', ink2='#475067', ac='#123C8C', acink='#FFFFFF', hi='#FFC629', hiink='#101828', ud='#8A3B12', soft='#E3EAF8', line='#DAD5C9',
   hero=f"background:#123C8C;color:#fff;border-bottom:6px solid #FFC629", herolab='#C9D6F2', mic='background:#FFC629;color:#101828;box-shadow:0 0 0 4px #123C8C', okbtn='background:#123C8C;color:#fff', radius='10px', title_tt='uppercase', ls='0.5px'),
 'khata': dict(font='Rozha+One&family=Hind:wght@400;500;600', head="'Rozha One',serif", body="'Hind',sans-serif",
   bg='#FBF5EC', surf='#FFFDF8', ink='#2A1410', ink2='#6B4E44', ac='#9B1C1C', acink='#FFFFFF', hi='#E8A317', hiink='#2A1410', ud='#7A4A12', soft='#F6E3DA', line='#E9D8C4',
   hero=f"background:#9B1C1C;color:#fff;border-bottom:4px double #E8A317", herolab='#F3C9C0', mic='background:#9B1C1C;color:#fff;box-shadow:0 0 0 4px #E8A317', okbtn='background:#9B1C1C;color:#fff', radius='6px', title_tt='none', ls='0'),
 'clean': dict(font='Mukta:wght@500;600;700&family=Mukta:wght@800', head="'Mukta',sans-serif", body="'Mukta',sans-serif",
   bg='#F5F6F8', surf='#FFFFFF', ink='#111418', ink2='#5B6270', ac='#0B7A4B', acink='#FFFFFF', hi='#0B7A4B', hiink='#fff', ud='#8A4B12', soft='#E3F3EA', line='#E4E7EC',
   hero="background:#FFFFFF;color:#111418;border-bottom:1px solid #E4E7EC", herolab='#5B6270', mic='background:#0B7A4B;color:#fff;box-shadow:0 4px 14px rgba(11,122,75,.35)', okbtn='background:#0B7A4B;color:#fff', radius='14px', title_tt='none', ls='0'),
}
MIC = '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>'
def page(k, v, screen):
    css = f"""*{{box-sizing:border-box;margin:0}}body{{background:{v['bg']};color:{v['ink']};font:500 18px/26px {v['body']};width:390px;min-height:844px;position:relative;padding-bottom:120px}}
h1,.h{{font-family:{v['head']};font-weight:700}}.num{{font-family:{v['head']};font-variant-numeric:tabular-nums}}
.card{{background:{v['surf']};border-radius:{v['radius']};margin:0 16px 14px;padding:16px 18px;box-shadow:0 1px 2px rgba(0,0,0,.05),0 4px 14px rgba(0,0,0,.04);border:1px solid {v['line']}}}
.row{{display:flex;justify-content:space-between;align-items:center;min-height:48px}}.lab{{color:{v['ink2']}}}
.tabs{{position:absolute;bottom:0;left:0;right:0;height:84px;background:{v['surf']};border-top:1px solid {v['line']};display:grid;grid-template-columns:1fr 1fr 96px 1fr 1fr;align-items:center;text-align:center;font-weight:600;font-size:17px}}
.tab.on{{color:{v['ac']}}}.mic{{width:76px;height:76px;border-radius:50%;margin:-40px auto 0;display:grid;place-items:center;{v['mic']}}}.micw{{font-weight:700;font-size:16px;margin-top:2px}}
.btn{{display:flex;align-items:center;justify-content:center;min-height:60px;border-radius:{v['radius']};font-weight:700;font-size:20px;margin:0 16px;{v['okbtn']}}}
.pill{{display:inline-block;padding:2px 10px;border-radius:999px;font-size:15px;font-weight:600;background:{v['soft']};color:{v['ac']}}}
.unsure{{background:#FFF4D1;border-left:5px solid #D99A00}}"""
    hero = f"""<div style="{v['hero']};padding:18px 20px 22px;margin-bottom:16px">
<div class="row" style="min-height:40px"><div><div style="font-size:16px;color:{v['herolab']}">Namaste</div>
<div class="h" style="font-size:30px;line-height:34px;text-transform:{v['title_tt']};letter-spacing:{v['ls']}">Test Dukaan</div></div>
<div style="display:flex;gap:8px"><span style="border:1.5px solid currentColor;border-radius:10px;padding:6px 10px;font-size:15px;opacity:.9">QR</span><span style="border:1.5px solid currentColor;border-radius:10px;padding:6px 10px;font-size:15px;opacity:.9">Settings</span></div></div>
<div style="margin-top:14px;color:{v['herolab']}">Aaj ki bikri · 5:40 baje tak</div>
<div class="num" style="font-size:54px;line-height:58px;font-weight:700">₹14,218</div>
<div style="display:flex;gap:10px;margin-top:10px"><div style="flex:1;padding:10px 12px;border-radius:{v['radius']};background:rgba(127,127,127,.14)"><div style="font-size:15px;color:{v['herolab']}">Bill</div><b class="num" style="font-size:24px">68</b></div>
<div style="flex:1;padding:10px 12px;border-radius:{v['radius']};background:rgba(127,127,127,.14)"><div style="font-size:15px;color:{v['herolab']}">Udhaar diya</div><b class="num" style="font-size:24px">₹1,120</b></div></div></div>"""
    if screen == 'home':
        body = hero + f"""<div class="card"><div class="row"><span class="h" style="font-size:22px">Aaj ki shuruaat</span><span class="pill">22 din poore</span></div>
<div class="row"><span class="lab">Kal</span><span>₹21,864 · 101 bill</span></div>
<div class="lab" style="margin-top:4px">Aaj inse udhaar maango</div>
<div class="row"><span>Mishra ji <span class="lab" style="font-size:15px">· 5 din</span></span><b style="color:{v['ud']}">₹2,523</b></div>
<div class="row"><span>Sharma ji · gali 4</span><b style="color:{v['ud']}">₹2,416</b></div>
<div style="margin-top:10px;min-height:52px;border:2px solid {v['ac']};color:{v['ac']};border-radius:{v['radius']};display:flex;align-items:center;justify-content:center;font-weight:700">Aaj 3 cheezein gino</div></div>
<div class="card" style="padding:4px 18px">{''.join(f'<div class="row" style="min-height:60px;border-top:{"none" if i==0 else "1px solid "+v["line"]}"><span style="font-weight:600">{t}</span><span class="lab">{r} ›</span></div>' for i,(t,r) in enumerate([('Pura hisaab',''),('Galla milao',''),('Online orders','2 naye'),('Free thaile','')]))}</div>"""
    else:
        body = f"""<div style="padding:18px 20px 6px"><div class="lab">← Peeche</div><h1 style="font-size:30px;line-height:36px;margin-top:8px">Bill check karo</h1>
<div class="lab" style="margin-top:2px">"Sharma ji, do kilo cheeni, ek Maggi, aadha kilo toor dal"</div></div>
<div class="card" style="margin-top:12px"><div class="row"><span class="lab">Grahak</span><b>Sharma ji · gali 4</b></div></div>
<div class="card" style="padding:4px 18px">
<div class="row" style="min-height:64px"><span><b>Cheeni</b><div class="lab" style="font-size:15px">2 kg × ₹46</div></span><b class="num" style="font-size:22px">₹92</b></div>
<div class="row unsure" style="min-height:64px;margin:0 -18px;padding:0 18px"><span><b>Maggi chhota?</b><div style="font-size:15px;color:#6B4A00">Yahi wali? · Haan / Doosri</div></span><b class="num" style="font-size:22px">₹14</b></div>
<div class="row" style="min-height:64px;border-top:1px solid {v['line']}"><span><b>Toor Dal</b><div class="lab" style="font-size:15px">½ kg × ₹150</div></span><b class="num" style="font-size:22px">₹75</b></div></div>
<div class="card"><div class="row"><span class="h" style="font-size:22px">Kul</span><span class="num" style="font-size:34px;font-weight:700">₹181</span></div>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:8px">{''.join(f'<div style="min-height:56px;border-radius:{v["radius"]};display:grid;place-items:center;font-weight:700;{s}">{t}</div>' for t,s in [('Cash','border:2px solid '+v['line']),('UPI','border:2px solid '+v['line']),('Udhaar',f"background:{v['soft']};color:{v['ud']};border:2px solid {v['ud']}")])}</div>
<div class="lab" style="margin-top:8px;font-size:16px">Udhaar ke baad Sharma ji: <b style="color:{v['ud']}">₹2,597</b></div></div>
<div class="btn" style="background:#FBE7B0;color:#6B4A00">Peela item pehle theek karo</div>"""
    tabs = f"""<div class="tabs"><div class="tab {'on' if screen=='home' else ''}">Ghar</div><div class="tab {'on' if screen!='home' else ''}">Bill</div>
<div><div class="mic">{MIC}</div><div class="micw">Bolo</div></div><div class="tab">Maal</div><div class="tab">Udhaar</div></div>"""
    return f"""<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family={v['font']}&display=block" rel="stylesheet"><style>{css}</style></head><body>{body}{tabs}</body></html>"""
for k, v in V.items():
    for s in ('home', 'review'):
        open(f'{k}-{s}.html', 'w').write(page(k, v, s))
