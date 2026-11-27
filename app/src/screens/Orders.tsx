import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { useT, rupees } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { useStore } from '../lib/store'
import { navigate } from '../lib/router'
import { errorFx, successFx } from '../lib/feedback'
import { askText, HomeBtn, LoadError, Tap, toast, TopBar } from '../components/ui'
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

const RowSk = () => <div className="vc">{[0, 1, 2].map((k) => <div key={k} className="vrow"><span className="t"><i className="vsk" style={{ width: 150, height: 20 }} /><i className="vsk" style={{ width: 110, height: 18, marginTop: 6 }} /></span></div>)}</div>

export function Orders() {
  const { t } = useT()
  const [tab, setTab] = useState<'new' | 'active' | 'done' | 'req'>('new')
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [reqs, setReqs] = useState<Req[]>([])
  const load = () => {
    supabase.from('orders').select('id,token,customer_name,phone,status,reason,created_at,order_lines(id,item_id,name,unit,qty,price,available,items(catalog_id,name_hi))').order('created_at', { ascending: false }).limit(100)
      .then(({ data, error }) => { if (error) setFailed(true); else { setFailed(false); setOrders((data ?? []) as unknown as Order[]) } }, () => setFailed(true))
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
    <main className="screen v2 has-bar">
      <TopBar back="/" title={t('rowOrders')} right={<Tap className="ib b" aria-label={t('myStore')} onClick={() => navigate('/dukaan')}><Icon name="store" size={24} /></Tap>} />
      <div className="vseg" role="group">
        {(['new', 'active', 'done', 'req'] as const).map((k) => <button key={k} aria-pressed={tab === k} onClick={() => setTab(k)}>
          {t(k === 'new' ? 'ordNew' : k === 'active' ? 'ordActive' : k === 'done' ? 'ordDone' : 'ordReq')}{k === 'req' ? ` · ${byItem.length}` : orders ? ` · ${count(k)}` : ''}</button>)}
      </div>
      {failed && !orders ? <LoadError onRetry={() => { setFailed(false); load() }} /> : !orders ? <RowSk /> : tab === 'req' ? (
        byItem.length === 0 ? <div className="vempty"><h2>{t('noReq')}</h2></div> : <div className="vstack">{byItem.map((g) => (
          <div key={g.item_id} className="vc vblock">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}><b style={{ font: '700 20px/28px var(--font)' }}>{g.name}</b><span className="vchip">{g.people.length} {t('peopleAsked')}</span></div>
            <p className="vlab" style={{ marginTop: 4 }}>{g.people.map((p) => `${p.customer_name} (${time(p.created_at)})`).join(', ')}</p>
            <div className="vgrid2" style={{ marginTop: 12 }}>
              {g.status === 'open' && <Tap className="btn outline s" onClick={() => reqStatus(g.item_id, 'ordered', g.people, g.name)}><Icon name="truck" size={22} />{t('willOrder')}</Tap>}
              <Tap className="btn primary s" onClick={() => reqStatus(g.item_id, 'arrived', g.people, g.name)}><Icon name="tick" size={22} stroke={3} />{t('arrivedTell')}</Tap>
            </div>
          </div>))}</div>
      ) : shown.length === 0 ? <div className="vempty"><h2>{t('noOrders')}</h2></div> : (
        <div className="vc">{shown.map((o) => (
          <Tap key={o.id} className="vrow" onClick={() => navigate('/orders/' + o.id)}>
            <span className="t"><b>{o.customer_name}</b><span>{time(o.created_at)} · {o.order_lines.length} {t('itemsWord')}</span></span>
            <span className="a">{rupees(sum(o))}<span style={{ display: 'block', font: '500 18px/22px var(--font)', color: 'var(--ink2)' }}>{t(('st_' + o.status) as 'st_new')}</span></span>
          </Tap>))}</div>
      )}
    </main>
  )
}

export function OrderDetail({ id }: { id: string }) {
  const { t, lang } = useT()
  const { store } = useStore()
  const [o, setO] = useState<Order | null | undefined>(undefined)
  const [failed, setFailed] = useState(false)
  const load = () => { setFailed(false); return supabase.from('orders').select('id,token,customer_name,phone,status,reason,created_at,order_lines(id,item_id,name,unit,qty,price,available,items(catalog_id,name_hi))').eq('id', id).maybeSingle()
    .then(({ data, error }) => { if (error) setFailed(true); else setO(data as unknown as Order | null) }, () => setFailed(true)) }
  useEffect(() => { load() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (failed) return <main className="screen v2 has-bar"><TopBar back="/orders" /><LoadError onRetry={() => { setO(undefined); load() }} /></main>
  if (o === undefined) return <main className="screen v2 has-bar"><TopBar back="/orders" /><div className="vstack"><i className="vsk" style={{ height: 80, borderRadius: 18 }} /><RowSk /></div></main>
  if (!o) return <main className="screen v2 has-bar"><TopBar back="/orders" /><div className="vempty"><h2>{t('noMatch')}</h2></div><div className="vfoot flat"><HomeBtn className="primary" /></div></main>
  async function step(status: string, reason?: string) {
    const { error } = await supabase.rpc('order_action', { p_order: o!.id, p_status: status, p_reason: reason ?? null })
    if (error) { errorFx(); toast({ text: t('saveFailed') }); return false }
    successFx(); load(); return true
  }
  async function toggle(l: OLine) { const { error } = await supabase.rpc('order_line_available', { p_line: l.id, p_available: !l.available }); if (error) { errorFx(); return } load() }
  const link = `${location.origin}/o/${o.token}`
  const canEdit = ['new', 'accepted', 'packing'].includes(o.status)
  return (
    <main className="screen v2 has-foot2">
      <TopBar back="/orders" title={o.customer_name} />
      <p className="vlab" style={{ marginTop: -4 }}>{o.phone} · {time(o.created_at)} · <span className="vchip" style={{ height: 28 }}>{t(('st_' + o.status) as 'st_new')}</span></p>
      <div className="vc" style={{ marginTop: 12 }}>
        {o.order_lines.map((l) => (
          <div key={l.id} className="vrow" style={{ opacity: l.available ? 1 : 0.55 }}>
            <span className="t"><b>{itemName({ ...l, amount: 0, catalog_id: l.items?.catalog_id, name_hi: l.items?.name_hi }, lang)} × {+l.qty}</b><span>{rupees(l.qty * l.price)}{!l.available ? ' · ' + t('notAvail') : ''}</span></span>
            {canEdit && <Tap className="btn outline s" aria-pressed={!l.available} onClick={() => toggle(l)}><Icon name={l.available ? 'x' : 'tick'} size={22} />{l.available ? t('notAvail') : t('available')}</Tap>}
          </div>))}
        <div className="vrow" style={{ minHeight: 64 }}><span className="t"><b>{t('total')}</b></span><span className="a vfig">{rupees(sum(o))}</span></div>
      </div>
      <div className="vfoot flat">
        {o.status === 'new' && <div className="vgrid2">
          <Tap className="btn outline s" onClick={async () => { const r = await askText({ title: t('rejectWhy') }); if (r !== null) step('rejected', r) }}><Icon name="x" size={22} />{t('reject')}</Tap>
          <Tap className="btn primary s" onClick={() => step('accepted')}><Icon name="tick" size={22} stroke={3} />{t('accept')}</Tap>
        </div>}
        {(o.status === 'accepted' || o.status === 'packing') && <Tap className="btn primary" onClick={async () => { if (await step('ready')) window.open(wa(o.phone, `${store?.name}: ${o.customer_name} ji, aapka order taiyaar hai. ${link}`), '_blank') }}><Icon name="tick" size={22} stroke={3} />{t('markReady')}</Tap>}
        {['accepted', 'packing', 'ready', 'billing'].includes(o.status) && <Tap className="btn outline s" onClick={() => navigate('/bolo?order=' + o.id)}><Icon name="bill" size={22} />{t('makeBill')}</Tap>}
        <div className="vgrid2">
          <a className="btn wa tap s" style={{ textDecoration: 'none' }} href={wa(o.phone, `${store?.name}: ${link}`)} target="_blank" rel="noreferrer"><Icon name="wa" size={22} />WhatsApp</a>
          <HomeBtn />
        </div>
      </div>
    </main>
  )
}

// "Meri online dukaan": on/off, link, QR on screen / print / share.
export function MyStore() {
  const { t } = useT()
  const { store, reload } = useStore()
  const [qr, setQr] = useState('')
  const [slug, setSlug] = useState<string | null | undefined>(undefined)
  const [failed, setFailed] = useState(false)
  const [on, setOn] = useState(true)
  const load = () => {
    setFailed(false)
    supabase.from('stores').select('public_slug,online_on').maybeSingle().then(({ data, error }) => { if (error) { setFailed(true); return } setSlug(data?.public_slug ?? null); setOn(data?.online_on ?? true) }, () => setFailed(true))
  }
  useEffect(load, [])
  const link = slug ? `${location.origin}/s/${slug}` : ''
  useEffect(() => { if (link) QRCode.toDataURL(link, { width: 480, margin: 1, color: { dark: '#1F1A14', light: '#FFFFFF' } }).then(setQr) }, [link])
  async function toggle() {
    const { error } = await supabase.from('stores').update({ online_on: !on }).eq('id', store!.id)
    if (error) { errorFx(); return } successFx(); setOn(!on); reload()
  }
  return (
    <main className="screen v2 has-bar">
      <TopBar back="/orders" title={t('myStore')} />
      {failed ? <LoadError onRetry={() => { setSlug(undefined); load() }} /> : slug === undefined ? <i className="vsk" style={{ height: 300, borderRadius: 18 }} />
        : !slug ? <div className="vempty"><h2>{t('noSlug')}</h2></div> : <div className="vstack">
        <Tap className="vrow vc" style={{ minHeight: 72 }} onClick={toggle} role="switch" aria-checked={on}><span className="t"><b>{t('onlineOrders')}</b></span><span className={`vchip ${on ? 'ok' : ''}`}>{on ? t('on') : t('off')}</span></Tap>
        <div className="print-qr vc vblock vcenter">
          <div className="vfig">{store?.name}</div>
          {qr && <div className="vqr"><img src={qr} alt="QR" /></div>}
          <p className="vlab" style={{ wordBreak: 'break-all', marginTop: 16 }}>{link}</p>
        </div>
        <a className="btn wa tap" style={{ textDecoration: 'none' }} href={`https://wa.me/?text=${encodeURIComponent(`${store?.name} se ab online order karein, dukaan se le jaayein: ${link}`)}`} target="_blank" rel="noreferrer"><Icon name="wa" size={24} />{t('shareStore')}</a>
        <Tap className="btn outline" onClick={() => window.print()}><Icon name="print" size={24} />{t('printQr')}</Tap>
      </div>}
    </main>
  )
}
