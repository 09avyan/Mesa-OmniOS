import { itemName } from '../components/BillCard'
import { CxBrand, CxError, CxLangs, CxSkeleton, Letterhead, readLang, saveLang } from '../components/Cx'
import { Icon } from '../components/Icon'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_KEY, SUPABASE_URL } from '../lib/config'
import { rupees } from '../lib/i18n'
import { CATALOG } from '../voice/catalog'
import { navigate } from '../lib/router'
import { tapFx, successFx, errorFx } from '../lib/feedback'

// Customer side of the online store. No login: name + phone remembered on the customer's own phone.
const pub = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
const CAT = new Map(CATALOG.map((c) => [c.id, c]))
type Item = { id: string; name: string; name_hi: string | null; catalog_id: string | null; unit: string; price: number; in_stock: boolean }
type StoreData = { name: string; area: string | null; phone?: string | null; online_on: boolean; items: Item[] }
type Lang = 'hi' | 'hinglish' | 'en'
const units: Record<string, string> = { kg: 'kg', g: 'g', l: 'L', ml: 'ml', pc: '', pack: 'pkt' }
const CATS: Record<string, [string, string, string]> = {
  'atta-rice-dal': ['Atta-Chawal-Dal', 'आटा-चावल-दाल', 'Atta, rice, dal'], 'oil-ghee': ['Tel-Ghee', 'तेल-घी', 'Oil & ghee'], spices: ['Masale', 'मसाले', 'Spices'],
  'sugar-salt': ['Cheeni-Namak', 'चीनी-नमक', 'Sugar & salt'], 'tea-coffee': ['Chai-Coffee', 'चाय-कॉफ़ी', 'Tea & coffee'], 'snacks-biscuits': ['Namkeen-Biscuit', 'नमकीन-बिस्किट', 'Snacks'],
  'noodles-pasta': ['Maggi-Noodles', 'मैगी-नूडल्स', 'Noodles'], 'dairy-bread': ['Doodh-Bread', 'दूध-ब्रेड', 'Dairy & bread'], beverages: ['Thanda', 'ठंडा', 'Drinks'],
  'personal-care': ['Saabun-Shampoo', 'साबुन-शैम्पू', 'Personal care'], cleaning: ['Safai', 'सफ़ाई', 'Cleaning'], household: ['Ghar ka saaman', 'घर का सामान', 'Household'],
  baby: ['Bacche', 'बच्चे', 'Baby'], 'frozen-misc': ['Aur', 'और', 'Other'],
}
const T = {
  hi: { search: 'सामान ढूंढो', all: 'सब', add: 'जोड़ो', out: 'खत्म है', ask: 'मंगवाओ', asked: 'माँगा', cart: 'टोकरी', order: 'ऑर्डर भेजो', go: 'ऑर्डर करो', name: 'आपका नाम', phone: 'मोबाइल नंबर', closed: 'अभी ऑनलाइन ऑर्डर बंद है', pickup: 'दुकान से उठाना है · पैसे दुकान पर', again: 'पिछला ऑर्डर दोबारा', needInfo: 'नाम और 10 अंक का नंबर डालें', tooMany: 'आपके 3 ऑर्डर पहले से चल रहे हैं', none: 'दुकान नहीं मिली', total: 'कुल', items: 'सामान', call: 'दुकान को कॉल करें', minus: 'कम', plus: 'ज़्यादा', none2: 'कुछ नहीं मिला' },
  hinglish: { search: 'Saaman dhundho', all: 'Sab', add: 'Jodo', out: 'Khatam hai', ask: 'Mangwao', asked: 'Maanga', cart: 'Tokri', order: 'Order bhejo', go: 'Order karo', name: 'Aapka naam', phone: 'Mobile number', closed: 'Abhi online order band hai', pickup: 'Dukaan se uthana hai · Paise dukaan par', again: 'Pichhla order dobara', needInfo: 'Naam aur 10 ank ka number daalein', tooMany: 'Aapke 3 order pehle se chal rahe hain', none: 'Dukaan nahi mili', total: 'Kul', items: 'saaman', call: 'Dukaan ko call karein', minus: 'Kam', plus: 'Zyada', none2: 'Kuch nahi mila' },
  en: { search: 'Search items', all: 'All', add: 'Add', out: 'Out of stock', ask: 'Request', asked: 'Requested', cart: 'Basket', order: 'Place order', go: 'Order', name: 'Your name', phone: 'Mobile number', closed: 'Online orders are paused', pickup: 'Pick up at shop · Pay at shop', again: 'Repeat last order', needInfo: 'Enter name and 10-digit number', tooMany: 'You already have 3 open orders', none: 'Shop not found', total: 'Total', items: 'items', call: 'Call the shop', minus: 'Less', plus: 'More', none2: 'Nothing found' },
}
const get = (k: string, d = '') => { try { return localStorage.getItem(k) ?? d } catch { return d } }
const put = (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* private mode */ } }

export function StorePage({ slug }: { slug: string }) {
  const [d, setD] = useState<StoreData | null | undefined>(undefined)
  const [failed, setFailed] = useState(false)
  const [lang, setLang] = useState<Lang>(readLang())
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [asked, setAsked] = useState<Record<string, boolean>>({})
  const [checkout, setCheckout] = useState(false)
  const [who, setWho] = useState({ name: get('omni-cust-name'), phone: get('omni-cust-phone') })
  const [askFor, setAskFor] = useState<Item | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const L = T[lang]
  const editTok = new URLSearchParams(location.search).get('edit')
  const load = useCallback(() => {
    setFailed(false); setD(undefined)
    pub.rpc('store_public', { p_slug: slug }).then(({ data, error }) => { if (error) setFailed(true); else setD((data as StoreData) ?? null) }, () => setFailed(true))
    if (editTok) pub.rpc('order_status', { p_token: editTok }).then(({ data }) => { const o = data as { lines: { item_id: string; qty: number }[] } | null; if (o) setCart(Object.fromEntries(o.lines.map((l) => [l.item_id, Number(l.qty)]))) }, () => {})
  }, [slug, editTok])
  useEffect(load, [load])
  const nm = (i: Item) => { const c = i.catalog_id ? CAT.get(i.catalog_id) : undefined; return lang === 'hi' ? c?.hi ?? i.name_hi ?? i.name : lang === 'en' ? c?.en ?? i.name : c?.hinglish ?? i.name }
  const catOf = (i: Item) => (i.catalog_id ? (CAT.get(i.catalog_id) as { category?: string } | undefined)?.category : undefined) ?? 'frozen-misc'
  const cats = useMemo(() => [...new Set((d?.items ?? []).map(catOf))], [d]) // eslint-disable-line react-hooks/exhaustive-deps
  const shown = (d?.items ?? []).filter((i) => (!cat || catOf(i) === cat) && (!q || (nm(i) + ' ' + i.name).toLowerCase().includes(q.toLowerCase())))
  const lines = Object.entries(cart).filter(([, n]) => n > 0)
  const count = lines.reduce((a, [, n]) => a + n, 0)
  const total = lines.reduce((s, [id, n]) => s + n * Number(d?.items.find((i) => i.id === id)?.price ?? 0), 0)
  const last = get('omni-last-order-' + slug)
  const infoOk = who.name.trim().length >= 2 && who.phone.replace(/\D/g, '').length >= 10
  const add = (id: string, dlt: number) => { tapFx(); setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) + dlt) })) }
  const pickLang = (l: Lang) => { setLang(l); saveLang(l) }

  async function place() {
    if (!infoOk) { setErr(L.needInfo); return }
    setBusy(true); setErr('')
    put('omni-cust-name', who.name.trim()); put('omni-cust-phone', who.phone)
    const p_lines = lines.map(([item_id, qty]) => ({ item_id, qty }))
    if (editTok) {
      const { error } = await pub.rpc('customer_edit_order', { p_token: editTok, p_lines, p_cancel: false })
      setBusy(false)
      if (error) { errorFx(); setErr(L.needInfo); return }
      successFx(); navigate('/o/' + editTok); return
    }
    const { data, error } = await pub.rpc('place_order', { p_slug: slug, p_name: who.name, p_phone: who.phone, p_lines })
    setBusy(false)
    if (error) { errorFx(); setErr(error.message.includes('too_many') ? L.tooMany : error.message.includes('closed') ? L.closed : L.needInfo); return }
    successFx(); put('omni-last-order-' + slug, JSON.stringify(p_lines)); navigate('/o/' + data)
  }
  async function request(i: Item) {
    if (!infoOk) { setAskFor(i); return }
    put('omni-cust-name', who.name.trim()); put('omni-cust-phone', who.phone)
    const { error } = await pub.rpc('request_item', { p_slug: slug, p_item: i.id, p_name: who.name, p_phone: who.phone })
    if (error) { errorFx(); setErr(L.needInfo); return }
    successFx(); setAsked((a) => ({ ...a, [i.id]: true })); setAskFor(null)
  }

  const langs = <CxLangs lang={lang} onPick={pickLang} />
  if (failed) return <main className="cx-page">{langs}<CxError lang={lang} onRetry={load} /></main>
  if (d === undefined) return <main className="cx-page">{langs}<CxSkeleton /></main>
  if (!d) return <main className="cx-page">{langs}<h1 className="cx-state" style={{ marginTop: 40 }}>{L.none}</h1></main>
  const info = (
    <>
      <input className="cx-in" autoComplete="name" placeholder={L.name} aria-label={L.name} value={who.name} onChange={(e) => setWho({ ...who, name: e.target.value })} />
      <input className="cx-in" autoComplete="tel" inputMode="tel" placeholder={L.phone} aria-label={L.phone} value={who.phone} onChange={(e) => setWho({ ...who, phone: e.target.value.replace(/[^\d+]/g, '') })} />
    </>
  )
  return (
    <main className={`cx-page ${lines.length > 0 && d.online_on ? 'has-foot' : ''}`}>
      {langs}
      <Letterhead name={d.name} area={d.area} phone={d.phone} callLabel={L.call} />
      <div className={`cx-note ${d.online_on ? '' : 'bad'}`}>{d.online_on ? <><Icon name="store" size={22} />{L.pickup}</> : <><Icon name="alert" size={22} />{L.closed}</>}</div>
      {last && d.online_on && <button className="btn outline" style={{ width: '100%', marginTop: 12, gap: 10 }} onClick={() => { const ls = JSON.parse(last) as { item_id: string; qty: number }[]; setCart(Object.fromEntries(ls.map((l) => [l.item_id, l.qty]))) }}><Icon name="undo" size={22} />{L.again}</button>}
      <label className="cx-find"><Icon name="search" size={24} /><input placeholder={L.search} aria-label={L.search} value={q} onChange={(e) => setQ(e.target.value)} /></label>
      <div className="cx-chips">
        <button className={!cat ? 'on' : ''} onClick={() => setCat('')}>{L.all}</button>
        {cats.map((c) => <button key={c} className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>{CATS[c]?.[lang === 'hi' ? 1 : lang === 'en' ? 2 : 0] ?? c}</button>)}
      </div>
      <div className="cx-rows cx-lst">
        {shown.length === 0 && <div className="cx-pi"><div className="g"><b>{L.none2}</b></div></div>}
        {shown.map((i) => (
          <div key={i.id} className={`cx-pi ${!i.in_stock ? 'out' : ''}`}>
            <div className="g">
              <b>{nm(i)}</b>
              <small>{i.in_stock ? <>₹{+Number(i.price).toFixed(2)}{units[i.unit] ? ' / ' + units[i.unit] : ''}</> : L.out}</small>
            </div>
            {!i.in_stock ? (asked[i.id] ? <span className="cx-chip ok"><Icon name="tick" size={20} stroke={3} />{L.asked}</span> : <button className="btn outline" onClick={() => request(i)}>{L.ask}</button>)
              : !d.online_on ? null
              : cart[i.id] ? <div className="cx-stp"><button aria-label={L.minus} onClick={() => add(i.id, -1)}><Icon name="minus" size={24} stroke={2.6} /></button><b>{cart[i.id]}</b><button aria-label={L.plus} onClick={() => add(i.id, 1)}><Icon name="plus" size={24} stroke={2.6} /></button></div>
              : <button className="btn outline" onClick={() => add(i.id, 1)}><Icon name="plus" size={22} stroke={2.6} />{L.add}</button>}
          </div>
        ))}
      </div>
      <CxBrand />
      {lines.length > 0 && d.online_on && <div className="cx-foot"><button className="btn primary" onClick={() => setCheckout(true)}><Icon name="bag" size={24} /><span className="m">{count} {L.items} · {rupees(total)}</span><span>{L.go}</span><Icon name="chev" size={22} /></button></div>}
      {(checkout || askFor) && <>
        <div className="cx-scrim" onClick={() => { setCheckout(false); setAskFor(null) }} />
        <div className="cx-sheet" role="dialog" aria-modal="true">
          {askFor ? <>
            <h2>{nm(askFor)}</h2>{info}
            {err && <div className="cx-note bad">{err}</div>}
            <button className="btn primary" onClick={() => request(askFor)}><Icon name="send" size={22} />{L.ask}</button>
          </> : <>
            <h2>{L.cart}</h2>
            <div className="cx-rows">{lines.map(([id, n]) => { const i = d.items.find((x) => x.id === id); if (!i) return null; return <div key={id} className="cx-row"><div className="g"><b>{nm(i)}</b><small>{n} × ₹{+Number(i.price).toFixed(2)}</small></div><span className="a">{rupees(n * Number(i.price))}</span></div> })}</div>
            <div className="cx-kv tot" style={{ marginTop: 12 }}><span>{L.total}</span><b>{rupees(total)}</b></div>
            {info}
            {err && <div className="cx-note bad">{err}</div>}
            <button className="btn primary" disabled={busy} onClick={place}><Icon name="tick" size={22} stroke={3} />{L.order}</button>
          </>}
        </div>
      </>}
    </main>
  )
}

// Order status page (/o/<token>): live steps; a declined order says clearly that nothing is owed.
const S = {
  hi: { steps: ['भेजा', 'मान लिया', 'पैक हो रहा', 'तैयार है'], ready: 'आपका सामान तैयार है! दुकान से ले लें।', done: 'हो गया · धन्यवाद', cancelled: 'आपने यह ऑर्डर रद्द किया', rejected: 'दुकान यह ऑर्डर नहीं ले पाई', oos: 'सामान स्टॉक में नहीं है', nothing: 'आपको कुछ नहीं देना है', which: 'दुकान ने नहीं बताया कौन सा सामान नहीं था — कॉल करके पूछ लें।', cancel: 'ऑर्डर रद्द करो', na: 'नहीं मिला', total: 'कुल', bill: 'बिल देखो', back: 'दुकान पर वापस', again: 'दोबारा ऑर्डर करो', call: 'दुकान को कॉल करें', edit: 'ऑर्डर बदलो', order: 'ऑर्डर', why: 'कारण' },
  hinglish: { steps: ['Bheja', 'Maan liya', 'Pack ho raha', 'Taiyaar hai'], ready: 'Aapka saaman taiyaar hai! Dukaan se le lein.', done: 'Ho gaya · Dhanyavaad', cancelled: 'Aapne yeh order radd kiya', rejected: 'Dukaan yeh order nahi le payi', oos: 'Saaman stock mein nahi hai', nothing: 'Aapko kuch nahi dena hai', which: 'Dukaan ne nahi bataya kaunsa saaman nahi tha — call karke poochh lein.', cancel: 'Order radd karo', na: 'Nahi mila', total: 'Kul', bill: 'Bill dekho', back: 'Dukaan par wapas', again: 'Dobara order karo', call: 'Dukaan ko call karein', edit: 'Order badlo', order: 'Order', why: 'Kaaran' },
  en: { steps: ['Sent', 'Accepted', 'Packing', 'Ready'], ready: 'Your order is ready! Pick it up at the shop.', done: 'Done · Thank you', cancelled: 'You cancelled this order', rejected: 'The shop could not take this order', oos: 'Items are out of stock', nothing: 'You owe nothing', which: 'The shop did not say which item was missing — please call to ask.', cancel: 'Cancel order', na: 'Not available', total: 'Total', bill: 'See bill', back: 'Back to shop', again: 'Order again', call: 'Call the shop', edit: 'Change order', order: 'Order', why: 'Reason' },
}
type OS = { store: string; slug: string; phone: string | null; status: string; reason: string | null; name: string; at: string; bill: string | null; area?: string | null; lines: { item_id: string; name: string; catalog_id: string | null; name_hi: string | null; unit: string; qty: number; price: number; available: boolean }[] }
export function OrderPage({ token }: { token: string }) {
  const [o, setO] = useState<OS | null | undefined>(undefined)
  const [failed, setFailed] = useState(false)
  const [lang, setLang] = useState<Lang>(readLang())
  const L = S[lang] ?? S.hi
  const load = useCallback(() => pub.rpc('order_status', { p_token: token }).then(({ data, error }) => { if (error) { setO((p) => { if (p === undefined) setFailed(true); return p }); return }; setFailed(false); setO((data as OS) ?? null) }, () => setO((p) => { if (p === undefined) setFailed(true); return p })), [token])
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t) }, [load])
  const langs = <CxLangs lang={lang} onPick={(l) => { setLang(l); saveLang(l) }} />
  if (failed && o === undefined) return <main className="cx-page">{langs}<CxError lang={lang} onRetry={() => { setFailed(false); load() }} /></main>
  if (o === undefined) return <main className="cx-page">{langs}<CxSkeleton /></main>
  if (!o) return <main className="cx-page">{langs}<h1 className="cx-state" style={{ marginTop: 40 }}>—</h1></main>
  const idx = { new: 0, accepted: 1, packing: 2, ready: 3, billing: 3, done: 4 }[o.status as 'new'] ?? -1
  const closed = o.status === 'rejected' || o.status === 'cancelled'
  const total = o.lines.filter((l) => l.available).reduce((s, l) => s + l.qty * l.price, 0)
  const reason = o.reason && /out of stock|stock/i.test(o.reason) ? L.oos : o.reason
  const nmL = (l: OS['lines'][number]) => itemName({ ...l, amount: 0 }, lang)
  const when = new Date(o.at).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
  const state = o.status === 'ready' || o.status === 'billing' ? L.ready : o.status === 'done' ? L.done : o.status === 'cancelled' ? L.cancelled : o.status === 'rejected' ? L.rejected : L.steps[idx]
  return (
    <main className="cx-page">
      {langs}
      <Letterhead name={o.store} area={o.area} phone={o.phone} callLabel={L.call} />
      <section className="cx-card">
        <div style={{ color: 'var(--ink2)' }}>{L.order} · {when}{!closed && ` · ${rupees(total)}`}</div>
        <div className="cx-state" style={{ marginTop: 4 }}>{state}</div>
        {idx >= 0 && idx < 4 && <div className="cx-tl">{L.steps.map((st, i) => <div key={st} className={i < idx ? 'on' : i === idx ? 'on now' : ''}><i>{i < idx && <Icon name="tick" size={20} stroke={3} />}</i>{st}</div>)}</div>}
        {o.status === 'rejected' && reason && <p style={{ color: 'var(--ink2)' }}>{L.why}: {reason}</p>}
        {o.status === 'rejected' && o.lines.every((l) => l.available) && <p style={{ color: 'var(--ink2)' }}>{L.which}</p>}
        {closed && <p><b>{L.nothing}</b></p>}
      </section>
      <section className="cx-rows" style={{ marginTop: 12, opacity: closed ? 0.75 : 1 }}>
        {o.lines.map((l) => <div key={l.item_id} className="cx-row">
          <div className="g"><b>{nmL(l)}</b><small>{+l.qty} {units[l.unit]} × ₹{+l.price}{!l.available && ' · ' + L.na}</small></div>
          <div className="a" style={{ textDecoration: l.available && !closed ? 'none' : 'line-through' }}>{rupees(l.qty * l.price)}</div></div>)}
      </section>
      <div className="cx-acts">
        {o.bill && <button className="btn primary" onClick={() => navigate('/b/' + o.bill)}><Icon name="receipt" size={22} />{L.bill}</button>}
        {closed && <button className="btn primary" onClick={() => navigate('/s/' + o.slug)}><Icon name="cart" size={22} />{L.again}</button>}
        {o.status === 'new' && <><button className="btn outline" onClick={() => navigate('/s/' + o.slug + '?edit=' + token)}><Icon name="doc" size={22} />{L.edit}</button><button className="btn outline" onClick={async () => { await pub.rpc('customer_edit_order', { p_token: token, p_lines: [], p_cancel: true }); load() }}><Icon name="x" size={22} />{L.cancel}</button></>}
        {o.phone && <a className="btn outline" href={'tel:' + o.phone}><Icon name="phone" size={22} />{L.call}</a>}
        {<button className="btn outline" onClick={() => navigate('/s/' + o.slug)}><Icon name="home" size={22} />{L.back}</button>}
      </div>
      <CxBrand />
    </main>
  )
}
