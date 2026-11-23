import { itemName } from '../components/BillCard'
import { Icon } from '../components/Icon'
import { useEffect, useMemo, useState } from 'react'
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
type StoreData = { name: string; area: string | null; online_on: boolean; items: Item[] }
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
  hi: { search: 'सामान ढूंढो', all: 'सब', add: 'जोड़ो', out: 'खत्म है', ask: 'मंगवाओ', asked: 'माँगा', cart: 'टोकरी', order: 'ऑर्डर भेजो', name: 'आपका नाम', phone: 'मोबाइल नंबर', closed: 'अभी ऑनलाइन ऑर्डर बंद है। सामान देख सकते हैं।', pickup: 'दुकान से उठाना है · पैसे दुकान पर', again: 'पिछला ऑर्डर दोबारा', needInfo: 'नाम और 10 अंक का नंबर डालें', tooMany: 'आपके 3 ऑर्डर पहले से चल रहे हैं', askedNote: 'दुकान को बता दिया। आने पर खबर मिलेगी।', none: 'दुकान नहीं मिली', total: 'कुल', items: 'सामान' },
  hinglish: { search: 'Saaman dhundho', all: 'Sab', add: 'Jodo', out: 'Khatam hai', ask: 'Mangwao', asked: 'Maanga', cart: 'Tokri', order: 'Order bhejo', name: 'Aapka naam', phone: 'Mobile number', closed: 'Abhi online order band hai. Saaman dekh sakte hain.', pickup: 'Dukaan se uthana hai · Paise dukaan par', again: 'Pichhla order dobara', needInfo: 'Naam aur 10 ank ka number daalein', tooMany: 'Aapke 3 order pehle se chal rahe hain', askedNote: 'Dukaan ko bata diya. Aane par khabar milegi.', none: 'Dukaan nahi mili', total: 'Kul', items: 'saaman' },
  en: { search: 'Search items', all: 'All', add: 'Add', out: 'Out of stock', ask: 'Request', asked: 'Requested', cart: 'Basket', order: 'Place order', name: 'Your name', phone: 'Mobile number', closed: 'Online orders are paused. You can still browse.', pickup: 'Pick up at shop · Pay at shop', again: 'Repeat last order', needInfo: 'Enter name and 10-digit number', tooMany: 'You already have 3 open orders', askedNote: 'Shop informed. You will be told when it arrives.', none: 'Shop not found', total: 'Total', items: 'items' },
}
const get = (k: string, d = '') => { try { return localStorage.getItem(k) ?? d } catch { return d } }
const put = (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* private mode */ } }

export function StorePage({ slug }: { slug: string }) {
  const [d, setD] = useState<StoreData | null | undefined>(undefined)
  const [lang, setLang] = useState<Lang>((get('omni-bill-lang', 'hi') as Lang) || 'hi')
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
  useEffect(() => {
    pub.rpc('store_public', { p_slug: slug }).then(({ data }) => setD((data as StoreData) ?? null))
    if (editTok) pub.rpc('order_status', { p_token: editTok }).then(({ data }) => { const o = data as { lines: { item_id: string; qty: number }[] } | null; if (o) setCart(Object.fromEntries(o.lines.map((l) => [l.item_id, Number(l.qty)]))) })
  }, [slug, editTok])
  const nm = (i: Item) => { const c = i.catalog_id ? CAT.get(i.catalog_id) : undefined; return lang === 'hi' ? c?.hi ?? i.name_hi ?? i.name : lang === 'en' ? c?.en ?? i.name : c?.hinglish ?? i.name }
  const catOf = (i: Item) => (i.catalog_id ? (CAT.get(i.catalog_id) as { category?: string } | undefined)?.category : undefined) ?? 'frozen-misc'
  const cats = useMemo(() => [...new Set((d?.items ?? []).map(catOf))], [d]) // eslint-disable-line react-hooks/exhaustive-deps
  const shown = (d?.items ?? []).filter((i) => (!cat || catOf(i) === cat) && (!q || (nm(i) + ' ' + i.name).toLowerCase().includes(q.toLowerCase())))
  const lines = Object.entries(cart).filter(([, n]) => n > 0)
  const total = lines.reduce((s, [id, n]) => s + n * Number(d?.items.find((i) => i.id === id)?.price ?? 0), 0)
  const last = get('omni-last-order-' + slug)
  const infoOk = who.name.trim().length >= 2 && who.phone.replace(/\D/g, '').length >= 10
  const add = (id: string, dlt: number) => { tapFx(); setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) + dlt) })) }

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

  if (d === undefined) return <main className="bc-page"><div className="skel" style={{ width: '100%', maxWidth: 480, height: 300, borderRadius: 24 }} /></main>
  if (!d) return <main className="bc-page"><h1 className="h1" style={{ marginTop: 40 }}>{L.none}</h1></main>
  const info = (
    <div className="stack" style={{ marginTop: 12 }}>
      <input className="input" placeholder={L.name} value={who.name} onChange={(e) => setWho({ ...who, name: e.target.value })} />
      <input className="input" inputMode="tel" placeholder={L.phone} value={who.phone} onChange={(e) => setWho({ ...who, phone: e.target.value.replace(/[^\d+]/g, '') })} />
    </div>
  )
  return (
    <main className="shop">
      <header className="cx-head">
        <div className="cx-langs" role="group" aria-label="language">
          {(['hi', 'hinglish', 'en'] as const).map((l) => <button key={l} className={`tap ${lang === l ? 'on' : ''}`} onClick={() => { setLang(l); put('omni-bill-lang', l) }}>{l === 'hi' ? 'हिंदी' : l === 'en' ? 'English' : 'Hinglish'}</button>)}
        </div>
        <div className="cx-shop"><div className="cx-av">{d.name.charAt(0).toUpperCase()}</div>
          <div style={{ minWidth: 0 }}><h1 className="cx-name">{d.name}</h1>{d.area && <div className="cx-area"><Icon name="pin" size={18} />{d.area}</div>}</div></div>
        <div className={`cx-open ${d.online_on ? 'on' : ''}`}>{d.online_on ? L.pickup : L.closed}</div>
      </header>
      {last && d.online_on && <button className="tap cx-again" onClick={() => { const ls = JSON.parse(last) as { item_id: string; qty: number }[]; setCart(Object.fromEntries(ls.map((l) => [l.item_id, l.qty]))) }}><Icon name="back" size={20} />{L.again}</button>}
      <div className="cx-sticky">
      <label className="cx-search"><Icon name="search" size={22} /><input placeholder={L.search} value={q} onChange={(e) => setQ(e.target.value)} /></label>
      <div className="shop-cats cx-cats">
        <button className={`tap ${!cat ? 'on' : ''}`} onClick={() => setCat('')}>{L.all}</button>
        {cats.map((c) => <button key={c} className={`tap ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{CATS[c]?.[lang === 'hi' ? 1 : lang === 'en' ? 2 : 0] ?? c}</button>)}
      </div>
      </div>
      <div className="cx-list">
        {shown.map((i) => (
          <div key={i.id} className={`cx-item ${!i.in_stock ? 'out' : ''}`}>
            <div className="cx-info">
              <div className="cx-nm">{nm(i)}</div>
              <div className="cx-pr">₹{+Number(i.price).toFixed(2)}<span>{units[i.unit] ? ' / ' + units[i.unit] : ''}</span>{!i.in_stock && <span className="cx-outtag"> · {L.out}</span>}</div>
            </div>
            <div className="cx-act">
              {!i.in_stock ? (asked[i.id] ? <span className="cx-asked">{L.asked}</span> : <button className="tap cx-ask" onClick={() => request(i)}>{L.ask}</button>)
                : !d.online_on ? null
                : cart[i.id] ? <div className="cx-step"><button className="tap" aria-label="minus" onClick={() => add(i.id, -1)}>−</button><b>{cart[i.id]}</b><button className="tap" aria-label="plus" onClick={() => add(i.id, 1)}>+</button></div>
                : <button className="tap cx-add" onClick={() => add(i.id, 1)}>{L.add}</button>}
            </div>
          </div>
        ))}
      </div>
      {lines.length > 0 && d.online_on && <div className="shop-bar"><button className="tap cx-cart" onClick={() => setCheckout(true)}><span className="cx-cnt">{lines.reduce((a, [, n]) => a + n, 0)}</span><span>{L.cart}</span><b>{rupees(total)} ›</b></button></div>}
      {(checkout || askFor) && <>
        <div className="scrim" onClick={() => { setCheckout(false); setAskFor(null) }} />
        <div className="sheet" role="dialog">
          {askFor ? <>
            <h2 className="h2">{L.ask}: {nm(askFor)}</h2><p className="lab">{L.askedNote}</p>{info}
            {err && <div className="err" style={{ marginTop: 10 }}>{err}</div>}
            <div className="gap16" /><button className="tap btn primary" onClick={() => request(askFor)}>{L.ask}</button>
          </> : <>
            <h2 className="h2">{L.cart}</h2>
            {lines.map(([id, n]) => { const i = d.items.find((x) => x.id === id)!; return <div key={id} className="bc-row"><span>{nm(i)} × {n}</span><b>{rupees(n * Number(i.price))}</b></div> })}
            <div className="bc-grand"><span>{L.total}</span><span>{rupees(total)}</span></div>
            <p className="lab">{L.pickup}</p>{info}
            {err && <div className="err" style={{ marginTop: 10 }}>{err}</div>}
            <div className="gap16" /><button className="tap btn primary" disabled={busy} onClick={place}>✓ {L.order}</button>
          </>}
        </div>
      </>}
    </main>
  )
}

// Order status page (/o/<token>): live steps; a declined order says clearly that nothing is owed.
const S = {
  hi: { steps: ['भेजा', 'मान लिया', 'पैक हो रहा', 'तैयार है'], ready: 'आपका सामान तैयार है! दुकान से ले लें।', done: 'हो गया · धन्यवाद', cancelled: 'आपने यह ऑर्डर रद्द किया', rejected: 'दुकान यह ऑर्डर नहीं ले पाई', oos: 'सामान स्टॉक में नहीं है', nothing: 'आपको कुछ नहीं देना है', cancel: 'ऑर्डर रद्द करो', na: 'नहीं मिला', total: 'कुल', bill: 'बिल देखो', back: 'दुकान पर वापस', again: 'दोबारा ऑर्डर करो', call: 'दुकान को कॉल करें', edit: 'ऑर्डर बदलो', order: 'ऑर्डर', why: 'कारण' },
  hinglish: { steps: ['Bheja', 'Maan liya', 'Pack ho raha', 'Taiyaar hai'], ready: 'Aapka saaman taiyaar hai! Dukaan se le lein.', done: 'Ho gaya · Dhanyavaad', cancelled: 'Aapne yeh order radd kiya', rejected: 'Dukaan yeh order nahi le payi', oos: 'Saaman stock mein nahi hai', nothing: 'Aapko kuch nahi dena hai', cancel: 'Order radd karo', na: 'Nahi mila', total: 'Kul', bill: 'Bill dekho', back: 'Dukaan par wapas', again: 'Dobara order karo', call: 'Dukaan ko call karein', edit: 'Order badlo', order: 'Order', why: 'Kaaran' },
  en: { steps: ['Sent', 'Accepted', 'Packing', 'Ready'], ready: 'Your order is ready! Pick it up at the shop.', done: 'Done · Thank you', cancelled: 'You cancelled this order', rejected: 'The shop could not take this order', oos: 'Items are out of stock', nothing: 'You owe nothing', cancel: 'Cancel order', na: 'Not available', total: 'Total', bill: 'See bill', back: 'Back to shop', again: 'Order again', call: 'Call the shop', edit: 'Change order', order: 'Order', why: 'Reason' },
}
type OS = { store: string; slug: string; phone: string | null; status: string; reason: string | null; name: string; at: string; bill: string | null; lines: { item_id: string; name: string; catalog_id: string | null; name_hi: string | null; unit: string; qty: number; price: number; available: boolean }[] }
export function OrderPage({ token }: { token: string }) {
  const [o, setO] = useState<OS | null | undefined>(undefined)
  const [lang, setLang] = useState<Lang>(() => (get('omni-bill-lang', 'hi') as Lang) || 'hi')
  const L = S[lang] ?? S.hi
  const load = () => pub.rpc('order_status', { p_token: token }).then(({ data }) => setO((data as OS) ?? null))
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t) }, [token]) // eslint-disable-line react-hooks/exhaustive-deps
  if (o === undefined) return <main className="bc-page"><div className="skel" style={{ width: '100%', maxWidth: 420, height: 300, borderRadius: 24 }} /></main>
  if (!o) return <main className="bc-page"><h1 className="h1">—</h1></main>
  const idx = { new: 0, accepted: 1, packing: 2, ready: 3, billing: 3, done: 4 }[o.status as 'new'] ?? -1
  const closed = o.status === 'rejected' || o.status === 'cancelled'
  const total = o.lines.filter((l) => l.available).reduce((s, l) => s + l.qty * l.price, 0)
  const reason = o.reason && /out of stock|stock/i.test(o.reason) ? L.oos : o.reason
  const nmL = (l: OS['lines'][number]) => itemName({ ...l, amount: 0 }, lang)
  const when = new Date(o.at).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
  return (
    <main className="bc-page">
      <div className="bc-langs">{(['hi', 'hinglish', 'en'] as const).map((l) => <button key={l} className={lang === l ? 'on' : ''} onClick={() => { setLang(l); put('omni-bill-lang', l) }}>{l === 'hi' ? 'हिंदी' : l === 'en' ? 'English' : 'Hinglish'}</button>)}</div>
      <article className="bc">
        <header className="bc-shop"><div className="bc-av">{o.store.charAt(0)}</div><div><div className="bc-store">{o.store}</div><div className="bc-area">{L.order} {token.slice(0, 4).toUpperCase()} · {when}</div></div></header>
        <section className="bc-hero">
          {idx >= 0 && idx < 4 && <div className="ostep">{L.steps.map((st, i) => <div key={st} className={i <= idx ? 'on' : ''}><i />{st}</div>)}</div>}
          <div className="h2" style={{ marginTop: idx >= 0 && idx < 4 ? 14 : 0, color: closed ? 'var(--ink)' : 'var(--ac)' }}>
            {o.status === 'ready' || o.status === 'billing' ? L.ready : o.status === 'done' ? L.done : o.status === 'cancelled' ? L.cancelled : o.status === 'rejected' ? L.rejected : L.steps[idx]}
          </div>
          {o.status === 'rejected' && reason && <p className="bc-meta">{L.why}: {reason}</p>}
          {closed && <div className="bc-status ok" style={{ marginTop: 12 }}>{L.nothing}</div>}
        </section>
        <section className="bc-items" style={closed ? { opacity: 0.75 } : undefined}>
          {o.lines.map((l) => <div key={l.item_id} className="bc-row">
            <div><div className="bc-name">{nmL(l)}</div><div className="bc-sub">{+l.qty} {units[l.unit]} × ₹{+l.price}{!l.available && ' · ' + L.na}</div></div>
            <div className="bc-amt" style={{ textDecoration: l.available && !closed ? 'none' : 'line-through', color: closed ? 'var(--ink2)' : undefined }}>{rupees(l.qty * l.price)}</div></div>)}
          {!closed && <div className="bc-grand"><span>{L.total}</span><span>{rupees(total)}</span></div>}
        </section>
        <div style={{ padding: '4px 20px 18px' }} className="stack">
          {o.bill && <button className="tap btn primary" onClick={() => navigate('/b/' + o.bill)}>{L.bill}</button>}
          {closed && <button className="tap btn primary" onClick={() => navigate('/s/' + o.slug)}>{L.again}</button>}
          {o.status === 'new' && <><button className="tap btn quiet" onClick={() => navigate('/s/' + o.slug + '?edit=' + token)}>{L.edit}</button><button className="tap btn quiet" onClick={async () => { await pub.rpc('customer_edit_order', { p_token: token, p_lines: [], p_cancel: true }); load() }}>{L.cancel}</button></>}
          {o.phone && <a className="tap btn quiet" style={{ textDecoration: 'none' }} href={'tel:' + o.phone}><Icon name="phone" size={22} />{L.call}</a>}
          {!closed && <button className="tap btn quiet" onClick={() => navigate('/s/' + o.slug)}>{L.back}</button>}
        </div>
      </article>
    </main>
  )
}
