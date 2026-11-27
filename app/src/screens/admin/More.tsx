import { useState } from 'react'
import { call, adb, inr, dt, dd, useLoad, Load, type Act } from './core'

type Prod = { id: string; kind: string; name: string; size: string | null; pack_qty: number; price: number; cost: number; active: boolean }
type Line = { id: number; name: string; qty: number; price: number; cost: number }
type Order = { id: string; status: string; total: number; note: string | null; address: string | null; created_at: string; stores: { code: string; name: string; phone: string | null } | null; bag_order_lines: Line[] }
type Margin = { month: string; kind: string; packs: number; revenue: number; cost: number; margin: number }
const STAT = ['new', 'confirmed', 'packed', 'dispatched', 'delivered', 'cancelled']
const pct = (m: number, r: number) => (Number(r) > 0 ? `${Math.round((Number(m) / Number(r)) * 100)}%` : '—')

export function Bags({ act }: { act: Act }) {
  const [tab, setTab] = useState<'orders' | 'products' | 'margin'>('orders')
  return <>
    <div className="ad-seg" role="group" aria-label="Bags section">{(['orders', 'products', 'margin'] as const).map((t) => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t === 'margin' ? 'Margin report' : t[0].toUpperCase() + t.slice(1)}</button>)}</div>
    {tab === 'orders' && <Orders act={act} />}{tab === 'products' && <Products act={act} />}{tab === 'margin' && <MarginReport />}
  </>
}

function Orders({ act }: { act: Act }) {
  const [st, setSt] = useState('')
  const o = useLoad<{ orders: Order[] }>(() => call('bag_orders_list', st ? { status: st } : {}), [st])
  return <>
    <div className="ad-chips ad-filter">{['', ...STAT].map((s) => <button key={s} className={st === s ? 'on' : ''} onClick={() => setSt(s)}>{s || 'All'}</button>)}</div>
    <Load s={o} rows={4}>{({ orders }) => orders.length === 0 ? <p className="ad-empty">No orders{st ? ` marked ${st}` : ' yet'}.</p> : <section className="ad-card ad-flush">{orders.map((r) => {
      const cost = r.bag_order_lines.reduce((a, l) => a + l.qty * Number(l.cost), 0)
      return <div key={r.id} className="ad-order">
        <div className="ad-oh"><b>{r.stores?.code ?? '?'}</b><span className="g">{r.stores?.name}<small>{dt(r.created_at)}{r.stores?.phone ? ` · ${r.stores.phone}` : ''}</small></span><b className="n">{inr(r.total)}</b></div>
        <div className="ad-ol">{r.bag_order_lines.map((l) => <span key={l.id}>{l.qty} × {l.name}</span>)}</div>
        {(r.address || r.note) && <p className="ad-meta">{[r.address, r.note].filter(Boolean).join(' · ')}</p>}
        <div className="ad-oh"><span className="ad-meta">Margin {inr(Number(r.total) - cost)} ({pct(Number(r.total) - cost, r.total)})</span>
          <select className="ad-sel" aria-label="Order status" value={r.status} onChange={(e) => act(() => call('bag_order_set_status', { id: r.id, status: e.target.value }), `Order marked ${e.target.value}.`).then(o.silent)}>{STAT.map((s) => <option key={s}>{s}</option>)}</select></div>
      </div>
    })}</section>}</Load>
  </>
}

function Products({ act }: { act: Act }) {
  const p = useLoad<{ products: Prod[] }>(() => call('bag_products_list'))
  return <Load s={p} rows={4}>{({ products }) => <section className="ad-card ad-flush">{products.map((x) => <ProductRow key={x.id + x.price + x.cost + x.active} x={x} act={act} reload={p.silent} />)}</section>}</Load>
}
function ProductRow({ x, act, reload }: { x: Prod; act: Act; reload: () => void }) {
  const [price, setPrice] = useState(String(x.price)), [cost, setCost] = useState(String(x.cost))
  const dirty = Number(price) !== Number(x.price) || Number(cost) !== Number(x.cost)
  const m = Number(price) - Number(cost)
  return <div className={`ad-prod ${x.active ? '' : 'off'}`}>
    <span className="g">{x.name}<small>{x.kind} · {x.size ?? ''} · pack of {x.pack_qty}</small></span>
    <label>Price<input className="ad-in" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} /></label>
    <label>Cost<input className="ad-in" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} /></label>
    <span className="ad-margin n">{inr(m)}<small>{pct(m, Number(price))}</small></span>
    <button className="ad-b pri" disabled={!dirty || !(Number(price) >= 0) || !(Number(cost) >= 0)} onClick={() => act(() => call('bag_products_update', { id: x.id, price: Number(price), cost: Number(cost) }), `${x.name} saved.`).then(reload)}>Save</button>
    <button className="ad-b" onClick={() => act(() => call('bag_products_update', { id: x.id, active: !x.active }), `${x.name} ${x.active ? 'hidden' : 'on sale'}.`).then(reload)}>{x.active ? 'Hide' : 'Show'}</button>
  </div>
}

function MarginReport() {
  const m = useLoad<Margin[]>(() => call('bag_margin_report'))
  return <Load s={m} rows={4}>{(rows) => rows.length === 0 ? <p className="ad-empty">No orders to report yet.</p> : <section className="ad-card ad-flush">
    <div className="ad-th"><span>Month · type</span><span className="n">Packs</span><span className="n">Revenue</span><span className="n ad-hide">Cost</span><span className="n">Margin</span></div>
    {rows.map((r) => <div key={r.month + r.kind} className="ad-row"><span className="g">{r.month} · {r.kind}</span><span className="n">{Number(r.packs)}</span><span className="n">{inr(r.revenue)}</span><span className="n ad-hide">{inr(r.cost)}</span><b className="n">{inr(r.margin)} <small>{pct(r.margin, r.revenue)}</small></b></div>)}</section>}</Load>
}

type Req = { bag_requests: { id: string; store_id: string; qty: number; status: string; created_at: string }[]; item_requests: { id: string; name: string; customer_name: string | null; phone: string | null; status: string; created_at: string }[]; feature_interest: Record<string, number> }
export function Demand({ act }: { act: Act }) {
  const r = useLoad<Req>(() => call('requests'))
  const codes = useLoad<{ stores: { id: string; code: string }[] }>(() => call('list_stores'))
  const code = (id: string) => codes.data?.stores.find((s) => s.id === id)?.code ?? '…'
  const setBag = (id: string, status: string) => act(async () => { const { error } = await adb.from('bag_requests').update({ status, updated_at: new Date().toISOString() }).eq('id', id); if (error) throw new Error(error.message) }, `Bag request marked ${status}.`).then(r.silent)
  return <Load s={r} rows={5}>{(d) => <>
    <section className="ad-card ad-flush"><h2 className="ad-pad">Bag requests <small>{d.bag_requests.filter((x) => x.status === 'new').length} new</small></h2>
      {d.bag_requests.length === 0 ? <p className="ad-empty">No requests yet.</p> : d.bag_requests.map((x) => <div key={x.id} className="ad-row"><b>{code(x.store_id)}</b><span className="g">{x.qty} bags<small>{dd(x.created_at)}</small></span><span className="ad-st">{x.status}</span>
        {x.status === 'new' && <button className="ad-b" onClick={() => setBag(x.id, 'sent')}>Sent</button>}
        {x.status !== 'done' && x.status !== 'cancelled' && <><button className="ad-b" onClick={() => setBag(x.id, 'done')}>Delivered</button><button className="ad-b dng" onClick={() => setBag(x.id, 'cancelled')}>Cancel</button></>}</div>)}</section>
    <section className="ad-card ad-flush"><h2 className="ad-pad">Item requests</h2>
      {d.item_requests.length === 0 ? <p className="ad-empty">None.</p> : d.item_requests.map((x) => <div key={x.id} className="ad-row"><span className="g">{x.name}<small>{[x.customer_name, x.phone].filter(Boolean).join(' · ')} · {dd(x.created_at)}</small></span><span className="ad-st">{x.status}</span></div>)}</section>
    <section className="ad-card ad-flush"><h2 className="ad-pad">"I want this" votes</h2>
      {Object.keys(d.feature_interest).length === 0 ? <p className="ad-empty">No votes yet.</p> : Object.entries(d.feature_interest).sort((a, b) => b[1] - a[1]).map(([f, n]) => <div key={f} className="ad-row"><span className="g">{f}</span><b className="n">{n} shop{n > 1 ? 's' : ''}</b></div>)}</section>
  </>}</Load>
}

export function Export({ act }: { act: Act }) {
  const [from, setFrom] = useState(''), [to, setTo] = useState(''), [busy, setBusy] = useState('')
  const get = (kind: string) => { setBusy(kind); return act(async () => {
    const { csv } = await call('export_csv', { kind, ...(from ? { from } : {}), ...(to ? { to } : {}) })
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `omnios-${kind}-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href)
  }, `${kind} CSV downloaded.`).finally(() => setBusy('')) }
  return <section className="ad-card">
    <h2>Download as CSV</h2><p className="ad-meta">Dates are optional and apply to bills and bag orders.</p>
    <div className="ad-inline"><label>From<input className="ad-in" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label><label>To<input className="ad-in" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label></div>
    <div className="ad-acts">{(['shops', 'bills', 'bag_orders'] as const).map((k) => <button key={k} className="ad-b" disabled={!!busy} onClick={() => get(k)}>{busy === k ? 'Preparing…' : `Download ${k.replace('_', ' ')}`}</button>)}</div>
  </section>
}

export function CreateStore({ onDone, act }: { onDone: () => void; act: Act }) {
  const [f, setF] = useState({ code: '', pin: '', name: '', owner_name: '', phone: '', area: 'Indore', language: 'hinglish' })
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  const ok = /^[A-Z0-9]{4,8}$/.test(f.code) && /^\d{6}$/.test(f.pin) && f.name.trim().length >= 2
  return <section className="ad-card"><h2>Create a shop</h2>
    <div className="ad-form">
      <label>Shop code (4-8)<input className="ad-in" value={f.code} maxLength={8} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} /></label>
      <label>6-digit PIN<input className="ad-in" inputMode="numeric" maxLength={6} value={f.pin} onChange={(e) => setF({ ...f, pin: e.target.value.replace(/\D/g, '') })} /></label>
      <label>Shop name<input className="ad-in" value={f.name} onChange={set('name')} /></label>
      <label>Owner name<input className="ad-in" value={f.owner_name} onChange={set('owner_name')} /></label>
      <label>Phone<input className="ad-in" inputMode="tel" value={f.phone} onChange={set('phone')} /></label>
      <label>Area<input className="ad-in" value={f.area} onChange={set('area')} /></label>
      <label>Language<select className="ad-in" value={f.language} onChange={set('language')}><option value="hinglish">Hinglish</option><option value="hi">Hindi</option><option value="en">English</option></select></label>
    </div>
    <div className="ad-acts"><button className="ad-b pri" disabled={!ok} onClick={() => act(() => call('create_store', f), `Shop ${f.code} created. Give the owner the code and PIN.`).then(onDone)}>Create shop</button><button className="ad-b" onClick={onDone}>Cancel</button></div>
  </section>
}
