import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { useT, rupees } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { useStore } from '../lib/store'
import { navigate } from '../lib/router'
import { errorFx, successFx } from '../lib/feedback'
import { askText, BackBar, Tap, toast } from '../components/ui'
import { Icon } from '../components/Icon'
import { itemName } from '../components/BillCard'

type OLine = { id: string; item_id: string | null; name: string; unit: string; qty: number; price: number; available: boolean; items?: { catalog_id: string | null; name_hi: string | null } | null }
type Order = { id: string; token: string; customer_name: string; phone: string; status: string; reason: string | null; created_at: string; order_lines: OLine[] }
type Req = { id: string; item_id: string; name: string; customer_name: string; phone: string; status: string; created_at: string }
const time = (s: string) => new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
const sum = (o: Order) => o.order_lines.filter((l) => l.available).reduce((s, l) => s + l.qty * l.price, 0)
const wa = (phone: string, msg: string) => `https://wa.me/${phone.length === 10 ? '91' + phone : phone}?text=${encodeURIComponent(msg)}`

// New-order chime (no audio file needed). Played by useNewOrders when the count of new orders grows.
function chime() { try { const c = new AudioContext(); [660, 880, 990].forEach((f, i) => { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = f; g.gain.setValueAtTime(0.08, c.currentTime + i * 0.15); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.15 + 0.3); o.connect(g).connect(c.destination); o.start(c.currentTime + i * 0.15); o.stop(c.currentTime + i * 0.15 + 0.3) }) } catch { /* no audio */ } }
let lastNew = -1
/** Count of new orders, polled every 20 s while the app is open; plays a chime when it goes up. */
export function useNewOrders() {
  const [n, setN] = useState(0)
  useEffect(() => {
    const check = () => supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'new').then(({ count }) => {
      const c = count ?? 0
      if (lastNew >= 0 && c > lastNew) chime()
      lastNew = c; setN(c)
    })
    check(); const t = setInterval(check, 20000); return () => clearInterval(t)
  }, [])
  return n
}

export function Orders() {
  const { t } = useT()
  const [tab, setTab] = useState<'new' | 'active' | 'done' | 'req'>('new')
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [reqs, setReqs] = useState<Req[]>([])
  const load = () => {
    supabase.from('orders').select('id,token,customer_name,phone,status,reason,created_at,order_lines(id,item_id,name,unit,qty,price,available,items(catalog_id,name_hi))').order('created_at', { ascending: false }).limit(100)
      .then(({ data }) => setOrders((data ?? []) as unknown as Order[]))
    supabase.from('item_requests').select('id,item_id,name,customer_name,phone,status,created_at').in('status', ['open', 'ordered']).order('created_at', { ascending: false })
      .then(({ data }) => setReqs((data ?? []) as Req[]))
  }
  useEffect(() => { load(); const i = setInterval(load, 20000); return () => clearInterval(i) }, [])
  const groups = { new: ['new'], active: ['accepted', 'packing', 'ready', 'billing'], done: ['done', 'cancelled', 'rejected'] }
  const shown = tab === 'req' ? [] : (orders ?? []).filter((o) => groups[tab].includes(o.status))
  // requests grouped by item: how many people want it, and who
  const byItem = Object.values(reqs.reduce<Record<string, { item_id: string; name: string; status: string; people: Req[] }>>((a, r) => {
    (a[r.item_id] ??= { item_id: r.item_id, name: r.name, status: r.status, people: [] }).people.push(r); return a }, {}))
  async function reqStatus(item: string, status: string, people: Req[], name: string) {
    const { error } = await supabase.rpc('request_status', { p_item: item, p_status: status })
    if (error) { errorFx(); return }
    successFx()
    if (status === 'arrived') people.forEach((p, i) => setTimeout(() => window.open(wa(p.phone, `Namaste ${p.customer_name}, aapka maanga hua "${name}" aa gaya hai. 🙏`), '_blank'), i * 600))
    load()
  }
  const count = (k: 'new' | 'active' | 'done') => (orders ?? []).filter((o) => groups[k].includes(o.status)).length
  return (
    <main className="screen has-bar">
      <BackBar />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="h1">{t('rowOrders')}</h1>
        <Tap className="ghost" style={{ color: 'var(--ac)', fontWeight: 700 }} onClick={() => navigate('/dukaan')}><Icon name="globe" size={22} />{t('myStore')}</Tap>
      </div>
      <div className="shop-cats" style={{ padding: '12px 0' }}>
        {(['new', 'active', 'done', 'req'] as const).map((k) => <Tap key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
          {t(k === 'new' ? 'ordNew' : k === 'active' ? 'ordActive' : k === 'done' ? 'ordDone' : 'ordReq')}{k === 'req' ? ` · ${byItem.length}` : orders ? ` · ${count(k)}` : ''}</Tap>)}
      </div>
      {!orders ? <div className="skel" style={{ height: 80 }} /> : tab === 'req' ? (
        byItem.length === 0 ? <div className="card center"><p className="lab">{t('noReq')}</p></div> : <div className="stack">{byItem.map((g) => (
          <div key={g.item_id} className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><b>{g.name}</b><span className="pill" style={{ background: 'var(--uns)', color: '#7A5600' }}>{g.people.length} {t('peopleAsked')}</span></div>
            <p className="lab" style={{ fontSize: 17 }}>{g.people.map((p) => `${p.customer_name} (${time(p.created_at)})`).join(', ')}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {g.status === 'open' && <Tap className="chg" onClick={() => reqStatus(g.item_id, 'ordered', g.people, g.name)}>{t('willOrder')}</Tap>}
              <Tap className="chg yes" onClick={() => reqStatus(g.item_id, 'arrived', g.people, g.name)}>{t('arrivedTell')}</Tap>
            </div>
          </div>))}</div>
      ) : shown.length === 0 ? <div className="card center"><p className="lab">{t('noOrders')}</p></div> : <div className="stack">{shown.map((o) => (
        <Tap key={o.id} className="rowb" onClick={() => navigate('/orders/' + o.id)}>
          <div className="grow" style={{ minWidth: 0 }}><div>{o.customer_name}</div>
            <div className="lab" style={{ fontSize: 17, fontWeight: 500, lineHeight: '20px' }}>{time(o.created_at)} · {o.order_lines.length} {t('itemsWord')}</div></div>
          <div style={{ textAlign: 'right' }}><div className="num">{rupees(sum(o))}</div><span className="pill pay-cash">{t(('st_' + o.status) as 'st_new')}</span></div>
        </Tap>))}</div>}
    </main>
  )
}

export function OrderDetail({ id }: { id: string }) {
  const { t, lang } = useT()
  const { store } = useStore()
  const [o, setO] = useState<Order | null | undefined>(undefined)
  const load = () => supabase.from('orders').select('id,token,customer_name,phone,status,reason,created_at,order_lines(id,item_id,name,unit,qty,price,available,items(catalog_id,name_hi))').eq('id', id).maybeSingle()
    .then(({ data }) => setO(data as unknown as Order | null))
  useEffect(() => { load() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (o === undefined) return <main className="screen has-bar"><BackBar fallback="/orders" /><div className="skel" style={{ height: 200 }} /></main>
  if (!o) return <main className="screen has-bar"><BackBar fallback="/orders" /><p>{t('noMatch')}</p></main>
  async function step(status: string, reason?: string) {
    const { error } = await supabase.rpc('order_action', { p_order: o!.id, p_status: status, p_reason: reason ?? null })
    if (error) { errorFx(); toast({ text: t('saveFailed') }); return false }
    successFx(); load(); return true
  }
  async function toggle(l: OLine) { const { error } = await supabase.rpc('order_line_available', { p_line: l.id, p_available: !l.available }); if (error) { errorFx(); return } load() }
  const link = `${location.origin}/o/${o.token}`
  const canEdit = ['new', 'accepted', 'packing'].includes(o.status)
  return (
    <main className="screen has-bar">
      <BackBar fallback="/orders" />
      <h1 className="h1">{o.customer_name}</h1>
      <p className="lab"><Icon name="phone" size={18} /> {o.phone} · {time(o.created_at)} · {t(('st_' + o.status) as 'st_new')}</p>
      <div className="card" style={{ marginTop: 12, padding: '4px 16px' }}>
        {o.order_lines.map((l, i) => (
          <div key={l.id} className="linkrow" style={{ color: 'var(--ink)', fontWeight: 500, borderTop: i ? '1px solid var(--line)' : 'none', minHeight: 60, opacity: l.available ? 1 : 0.55 }}>
            <span>{itemName({ ...l, amount: 0, catalog_id: l.items?.catalog_id, name_hi: l.items?.name_hi }, lang)} × {+l.qty}<span className="lab" style={{ display: 'block', fontSize: 17 }}>{rupees(l.qty * l.price)}{!l.available ? ' · ' + t('notAvail') : ''}</span></span>
            {canEdit && <Tap className={`chg ${l.available ? '' : 'yes'}`} onClick={() => toggle(l)}>{l.available ? t('notAvail') : t('available')}</Tap>}
          </div>))}
        <div className="bc-grand"><span>{t('total')}</span><span>{rupees(sum(o))}</span></div>
      </div>
      <div className="gap16" />
      <div className="stack">
        {o.status === 'new' && <>
          <Tap className="btn primary" onClick={() => step('accepted')}><Icon name="tick" size={22} stroke={3} />{t('accept')}</Tap>
          <Tap className="btn quiet" onClick={async () => { const r = await askText({ title: t('rejectWhy') }); if (r !== null) step('rejected', r) }}>{t('reject')}</Tap>
        </>}
        {(o.status === 'accepted' || o.status === 'packing') && <Tap className="btn primary" onClick={async () => { if (await step('ready')) window.open(wa(o.phone, `${store?.name}: ${o.customer_name} ji, aapka order taiyaar hai. ${link}`), '_blank') }}><Icon name="tick" size={22} stroke={3} />{t('markReady')}</Tap>}
        {['accepted', 'packing', 'ready', 'billing'].includes(o.status) && <Tap className="btn outline" onClick={() => navigate('/bolo?order=' + o.id)}><Icon name="bill" size={24} />{t('makeBill')}</Tap>}
        <a className="wa tap" href={wa(o.phone, `${store?.name}: ${link}`)} target="_blank" rel="noreferrer" style={{ color: '#137A3C', boxShadow: 'inset 0 0 0 2px #1FA855', textDecoration: 'none' }}><Icon name="wa" size={26} />WhatsApp</a>
      </div>
    </main>
  )
}

// "Meri online dukaan": on/off, link, QR on screen / print / share.
export function MyStore() {
  const { t } = useT()
  const { store, reload } = useStore()
  const [qr, setQr] = useState('')
  const [slug, setSlug] = useState<string | null>(null)
  const [on, setOn] = useState(true)
  useEffect(() => {
    supabase.from('stores').select('public_slug,online_on').maybeSingle().then(({ data }) => { setSlug(data?.public_slug ?? null); setOn(data?.online_on ?? true) })
  }, [])
  const link = slug ? `${location.origin}/s/${slug}` : ''
  useEffect(() => { if (link) QRCode.toDataURL(link, { width: 480, margin: 1, color: { dark: '#1F1A14', light: '#FFFFFF' } }).then(setQr) }, [link])
  async function toggle() {
    const { error } = await supabase.from('stores').update({ online_on: !on }).eq('id', store!.id)
    if (error) { errorFx(); return } successFx(); setOn(!on); reload()
  }
  return (
    <main className="screen has-bar">
      <BackBar fallback="/orders" />
      <h1 className="h1">{t('myStore')}</h1>
      {!slug ? <div className="card" style={{ marginTop: 16 }}><p>{t('noSlug')}</p></div> : <>
        <Tap className="rowb" style={{ marginTop: 16 }} onClick={toggle}><span className="grow">{t('onlineOrders')}</span><span style={{ color: on ? 'var(--ac)' : 'var(--ink2)' }}>{on ? t('on') : t('off')}</span></Tap>
        <div className="card center print-qr" style={{ marginTop: 16 }}>
          <div className="h2">{store?.name}</div>
          <p className="lab">{t('scanToOrder')}</p>
          {qr && <img src={qr} alt="QR" style={{ width: '100%', maxWidth: 260, margin: '12px auto', display: 'block' }} />}
          <p style={{ wordBreak: 'break-all', fontWeight: 600 }}>{link}</p>
        </div>
        <div className="gap16" />
        <div className="stack">
          <a className="wa tap" href={`https://wa.me/?text=${encodeURIComponent(`${store?.name} se ab online order karein, dukaan se le jaayein: ${link}`)}`} target="_blank" rel="noreferrer" style={{ color: '#137A3C', boxShadow: 'inset 0 0 0 2px #1FA855', textDecoration: 'none' }}><Icon name="wa" size={26} />{t('shareStore')}</a>
          <Tap className="btn quiet" onClick={() => window.print()}>🖨 {t('printQr')}</Tap>
        </div>
        <p className="lab" style={{ marginTop: 16 }}>{t('deliverySoon')}</p>
      </>}
    </main>
  )
}
