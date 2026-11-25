import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { useT, rupees } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { useStore } from '../lib/store'
import { navigate } from '../lib/router'
import { errorFx, successFx } from '../lib/feedback'
import { askText, BackBar, Tap, toast } from '../components/ui'
import { Icon } from '../components/Icon'
import { ru } from '../components/Pad'
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
    <main className="screen has-bar pg">
      <BackBar />
      <div className="pg-top">
        <h1 className="h1">{t('rowOrders')}</h1>
        <Tap className="pg-link" onClick={() => navigate('/dukaan')}><Icon name="globe" size={22} />{t('myStore')}</Tap>
      </div>
      <div className="shop-cats segs">
        {(['new', 'active', 'done', 'req'] as const).map((k) => <Tap key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
          {t(k === 'new' ? 'ordNew' : k === 'active' ? 'ordActive' : k === 'done' ? 'ordDone' : 'ordReq')}{k === 'req' ? ` · ${byItem.length}` : orders ? ` · ${count(k)}` : ''}</Tap>)}
      </div>
      {!orders ? <div className="skel" style={{ height: 80, marginTop: 16 }} /> : tab === 'req' ? (
        byItem.length === 0 ? <p className="pg-empty">{t('noReq')}</p> : byItem.map((g) => (
          <div key={g.item_id} className="pg-blk">
            <div className="pg-split"><b className="pg-nm">{g.name}</b><span className="pg-st">{g.people.length} {t('peopleAsked')}</span></div>
            <p className="pg-sub">{g.people.map((p) => `${p.customer_name} (${time(p.created_at)})`).join(', ')}</p>
            <div className="pg-pair">
              {g.status === 'open' && <Tap className="chg" onClick={() => reqStatus(g.item_id, 'ordered', g.people, g.name)}>{t('willOrder')}</Tap>}
              <Tap className="chg yes" onClick={() => reqStatus(g.item_id, 'arrived', g.people, g.name)}>{t('arrivedTell')}</Tap>
            </div>
          </div>))
      ) : shown.length === 0 ? <p className="pg-empty">{t('noOrders')}</p> : shown.map((o) => (
        <Tap key={o.id} className="hrow" onClick={() => navigate('/orders/' + o.id)}>
          <div className="g"><b>{o.customer_name}</b><span>{time(o.created_at)} · {o.order_lines.length} {t('itemsWord')}</span></div>
          <div className="a">{rupees(sum(o))}<small>{t(('st_' + o.status) as 'st_new')}</small></div>
        </Tap>))}
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
  if (o === undefined) return <main className="screen has-bar pg"><BackBar fallback="/orders" /><div className="skel" style={{ height: 200 }} /></main>
  if (!o) return <main className="screen has-bar pg"><BackBar fallback="/orders" /><p className="pg-empty">{t('noMatch')}</p></main>
  async function step(status: string, reason?: string) {
    const { error } = await supabase.rpc('order_action', { p_order: o!.id, p_status: status, p_reason: reason ?? null })
    if (error) { errorFx(); toast({ text: t('saveFailed') }); return false }
    successFx(); load(); return true
  }
  async function toggle(l: OLine) { const { error } = await supabase.rpc('order_line_available', { p_line: l.id, p_available: !l.available }); if (error) { errorFx(); return } load() }
  const link = `${location.origin}/o/${o.token}`
  const canEdit = ['new', 'accepted', 'packing'].includes(o.status)
  return (
    <main className="screen has-bar pg">
      <BackBar fallback="/orders" />
      <h1 className="h1">{o.customer_name}</h1>
      <p className="pg-sub">{o.phone} · {time(o.created_at)} · <b>{t(('st_' + o.status) as 'st_new')}</b></p>
      <div style={{ marginTop: 16 }}>
        {o.order_lines.map((l) => (
          <div key={l.id} className="hrow cur" style={{ opacity: l.available ? 1 : 0.55 }}>
            <div className="g"><b>{itemName({ ...l, amount: 0, catalog_id: l.items?.catalog_id, name_hi: l.items?.name_hi }, lang)} × {+l.qty}</b><span>{rupees(l.qty * l.price)}{!l.available ? ' · ' + t('notAvail') : ''}</span></div>
            {canEdit && <Tap className={`chg ${l.available ? '' : 'yes'}`} onClick={() => toggle(l)}>{l.available ? t('notAvail') : t('available')}</Tap>}
          </div>))}
      </div>
      <div className="pg-tot"><span>{t('total')}</span><b>{ru(sum(o))}</b></div>
      <div className="pg-acts">
        {o.status === 'new' && <>
          <Tap className="btn primary" onClick={() => step('accepted')}><Icon name="tick" size={22} stroke={3} />{t('accept')}</Tap>
          <Tap className="btn outline" onClick={async () => { const r = await askText({ title: t('rejectWhy') }); if (r !== null) step('rejected', r) }}><Icon name="x" size={22} />{t('reject')}</Tap>
        </>}
        {(o.status === 'accepted' || o.status === 'packing') && <Tap className="btn primary" onClick={async () => { if (await step('ready')) window.open(wa(o.phone, `${store?.name}: ${o.customer_name} ji, aapka order taiyaar hai. ${link}`), '_blank') }}><Icon name="tick" size={22} stroke={3} />{t('markReady')}</Tap>}
        {['accepted', 'packing', 'ready', 'billing'].includes(o.status) && <Tap className="btn outline" onClick={() => navigate('/bolo?order=' + o.id)}><Icon name="bill" size={24} />{t('makeBill')}</Tap>}
        <a className="btn outline tap" href={wa(o.phone, `${store?.name}: ${link}`)} target="_blank" rel="noreferrer"><Icon name="wa" size={24} />WhatsApp</a>
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
    <main className="screen has-bar pg">
      <BackBar fallback="/orders" />
      <h1 className="h1">{t('myStore')}</h1>
      {!slug ? <p className="pg-empty">{t('noSlug')}</p> : <>
        <Tap className="hrow" style={{ marginTop: 8 }} onClick={toggle} role="switch" aria-checked={on}><div className="g"><b>{t('onlineOrders')}</b></div><div className="a">{on ? t('on') : t('off')}</div></Tap>
        <div className="print-qr qrv" style={{ marginTop: 20 }}>
          <div className="h2">{store?.name}</div>
          {qr && <div className="qrc" style={{ marginTop: 12 }}><img src={qr} alt="QR" /></div>}
          <p className="pg-link-url">{link}</p>
        </div>
        <div className="pg-acts">
          <a className="btn primary tap" href={`https://wa.me/?text=${encodeURIComponent(`${store?.name} se ab online order karein, dukaan se le jaayein: ${link}`)}`} target="_blank" rel="noreferrer"><Icon name="wa" size={24} />{t('shareStore')}</a>
          <Tap className="btn outline" onClick={() => window.print()}><Icon name="print" size={24} />{t('printQr')}</Tap>
        </div>
      </>}
    </main>
  )
}
