import { useState } from 'react'
import { call, adb, inr, inrShort, dt, ago, dd, useLoad, Load, type Act } from './core'

export type Shop = { id: string; code: string; name: string; status: string; area: string | null; created_at: string; last_active: string | null; bills_30d: number; sales_30d: number; udhaar_outstanding: number; phones: number }

export function Spark({ days }: { days: { day: string; sales: number; bills: number }[] }) {
  const max = Math.max(1, ...days.map((d) => Number(d.sales)))
  const X = (i: number) => (i / Math.max(1, days.length - 1)) * 1000
  const Y = (v: number) => 180 - (v / max) * 170
  const line = days.map((d, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(Number(d.sales)).toFixed(1)}`).join(' ')
  const [hi, setHi] = useState<number | null>(null)
  const sel = hi == null ? null : days[hi]
  return (
    <div className="ad-chart">
      <div className="ad-chart-tip">{sel ? <><b>{inr(sel.sales)}</b> · {sel.bills} bills · {dd(sel.day)}</> : <span>Touch the line for a day</span>}</div>
      <svg viewBox="0 0 1000 190" preserveAspectRatio="none" role="img" aria-label="Daily sales, last 30 days"
        onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setHi(Math.min(days.length - 1, Math.max(0, Math.round(((e.clientX - r.left) / r.width) * (days.length - 1))))) }} onPointerLeave={() => setHi(null)}>
        <path d={`${line} L1000 190 L0 190Z`} className="ad-area" />
        <path d={line} className="ad-line" vectorEffect="non-scaling-stroke" />
        {hi != null && <line x1={X(hi)} x2={X(hi)} y1="0" y2="190" className="ad-cur" vectorEffect="non-scaling-stroke" />}
      </svg>
      <div className="ad-chart-x"><span>{days[0] ? dd(days[0].day) : ''}</span><span>{days.length ? dd(days[days.length - 1].day) : ''}</span></div>
    </div>
  )
}

type Ov = { shops_total: number; shops_active: number; shops_paused: number; new_shops_30d: number; bills_today: number; bills_7d: number; bills_30d: number; sales_today: number; sales_7d: number; sales_30d: number; udhaar_outstanding: number; ai_calls_7d: number; daily_sales_30d: { day: string; sales: number; bills: number }[]; top_shops_30d: { id: string; code: string; name: string; sales: number; bills: number }[] }

export function Overview({ open, go }: { open: (id: string) => void; go: (v: string) => void }) {
  const o = useLoad<Ov>(() => call('overview'))
  const sh = useLoad<Shop[]>(() => call('shops_list'))
  return (
    <>
      <Load s={o} rows={3}>{(d) => (
        <>
          <div className="ad-kpis">
            <K l="Shops" v={String(d.shops_total)} s={`${d.shops_active} active · ${d.shops_paused} paused · +${d.new_shops_30d} in 30 days`} />
            <K l="Sales today" v={inrShort(Number(d.sales_today))} s={`7 days ${inrShort(Number(d.sales_7d))} · 30 days ${inrShort(Number(d.sales_30d))}`} />
            <K l="Bills today" v={String(d.bills_today)} s={`7 days ${d.bills_7d} · 30 days ${d.bills_30d}`} />
            <K l="Udhaar outstanding" v={inrShort(Number(d.udhaar_outstanding))} s={`AI calls, 7 days: ${d.ai_calls_7d}`} />
          </div>
          <section className="ad-card"><h2>Daily sales, all shops <small>last 30 days</small></h2><Spark days={d.daily_sales_30d} /></section>
          <section className="ad-card ad-flush"><h2 className="ad-pad">Top shops, 30 days</h2>
            {d.top_shops_30d.length === 0 ? <p className="ad-empty">No bills in the last 30 days.</p> : d.top_shops_30d.map((t) => (
              <button key={t.id} className="ad-row" onClick={() => open(t.id)}><b>{t.code}</b><span className="g">{t.name}</span><span className="n">{t.bills} bills</span><b className="n">{inrShort(Number(t.sales))}</b></button>))}
          </section>
        </>)}</Load>
      <section className="ad-card ad-flush"><h2 className="ad-pad">Needs a look <small>shops</small></h2>
        <Load s={sh} rows={2}>{(list) => {
          const quiet = list.filter((s) => s.status === 'active' && (!s.last_active || Date.now() - new Date(s.last_active).getTime() > 7 * 864e5))
          const nophone = list.filter((s) => s.status === 'active' && s.phones === 0)
          const paused = list.filter((s) => s.status !== 'active')
          const groups: [string, Shop[]][] = [['No activity for 7+ days', quiet], ['No phone logged in', nophone], ['Paused', paused]]
          return groups.every(([, a]) => !a.length) ? <p className="ad-empty">Nothing to flag.</p> : <>{groups.filter(([, a]) => a.length).map(([t, a]) => (
            <div key={t} className="ad-grp"><div className="ad-lab">{t} · {a.length}</div>
              {a.slice(0, 6).map((s) => <button key={s.id} className="ad-row" onClick={() => open(s.id)}><b>{s.code}</b><span className="g">{s.name}</span><span className="n">{ago(s.last_active)}</span></button>)}
              {a.length > 6 && <button className="ad-link" onClick={() => go('shops')}>and {a.length - 6} more in Shops</button>}</div>))}</>
        }}</Load>
      </section>
    </>
  )
}
const K = ({ l, v, s }: { l: string; v: string; s: string }) => <div className="ad-kpi"><span>{l}</span><b>{v}</b><em>{s}</em></div>

export function Shops({ open, q, setQ, create }: { open: (id: string) => void; q: string; setQ: (s: string) => void; create: () => void }) {
  const sh = useLoad<Shop[]>(() => call('shops_list'))
  const [flt, setFlt] = useState<'all' | 'active' | 'paused'>('all')
  return (
    <>
      <div className="ad-tools">
        <input className="ad-in" placeholder="Search code, shop, area" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search shops" />
        <div className="ad-seg" role="group" aria-label="Status">{(['all', 'active', 'paused'] as const).map((f) => <button key={f} className={flt === f ? 'on' : ''} onClick={() => setFlt(f)}>{f[0].toUpperCase() + f.slice(1)}</button>)}</div>
        <button className="ad-b pri" onClick={create}>New shop</button>
      </div>
      <Load s={sh} rows={6}>{(list) => {
        const s = list.filter((x) => (flt === 'all' || (flt === 'active') === (x.status === 'active')) && (!q || `${x.code} ${x.name} ${x.area ?? ''}`.toLowerCase().includes(q.toLowerCase())))
        return <section className="ad-card ad-flush">
          <div className="ad-th"><span>Shop</span><span className="n">Bills 30d</span><span className="n">Sales 30d</span><span className="n ad-hide">Udhaar</span><span className="ad-hide">Last active</span></div>
          {s.length === 0 ? <p className="ad-empty">No shops match.</p> : s.map((x) => (
            <button key={x.id} className="ad-row ad-shop" onClick={() => open(x.id)}>
              <span className="g"><b>{x.code}</b> {x.name}<small>{x.area ?? ''}{x.status !== 'active' ? ' · paused' : ''}</small></span>
              <span className="n">{x.bills_30d}</span><b className="n">{inrShort(Number(x.sales_30d))}</b><span className="n ad-hide">{inr(x.udhaar_outstanding)}</span><span className="ad-hide">{ago(x.last_active)}</span>
            </button>))}
        </section>
      }}</Load>
    </>
  )
}

type Detail = { profile: { id: string; code: string; name: string; owner_name: string | null; phone: string | null; area: string | null; status: string; created_at: string } | null; phones: { id: string; label: string; created_at: string; last_seen: string; revoked: boolean }[]; usage_30d: Record<string, number>; last_bills: { id: string; at: string; total: number; pay: string; status: string; customer: string | null }[]; top_items: { name: string; qty: number; amount: number }[] }

export function ShopDrawer({ id, close, act }: { id: string; close: () => void; act: Act }) {
  const d = useLoad<Detail>(() => call('shop_detail', { store_id: id }), [id])
  const [panel, setPanel] = useState<'' | 'pin' | 'del'>('')
  const [pin, setPin] = useState(''), [conf, setConf] = useState('')
  const run = async (fn: () => Promise<unknown>, done: string, after?: () => void) => { await act(fn, done); d.silent(); after?.() }
  return (
    <div className="ad-scrim" onClick={close}>
      <aside className="ad-drawer" role="dialog" aria-label="Shop detail" onClick={(e) => e.stopPropagation()}>
        <button className="ad-b ad-x" onClick={close}>Close</button>
        <Load s={d} rows={6}>{(x) => {
          const p = x.profile
          if (!p) return <p className="ad-empty">Shop not found.</p>
          const live = x.phones.filter((v) => !v.revoked)
          return <>
            <h2 className="ad-dh">{p.name}<small>{p.code} · {p.status}</small></h2>
            <p className="ad-meta">{[p.owner_name, p.phone, p.area].filter(Boolean).join(' · ') || 'No contact saved'} · joined {dd(p.created_at)}</p>
            <div className="ad-acts">
              <button className="ad-b" onClick={() => setPanel(panel === 'pin' ? '' : 'pin')}>Reset PIN</button>
              <button className="ad-b" onClick={() => run(() => call('set_status', { store_id: p.id, status: p.status === 'active' ? 'paused' : 'active' }), `${p.code} ${p.status === 'active' ? 'paused' : 'resumed'}.`)}>{p.status === 'active' ? 'Pause' : 'Resume'}</button>
              <button className="ad-b" onClick={() => { const v = (prompt('Public store link name (a-z, 0-9, -), e.g. sharma-kirana-rajwada', '') ?? '').trim().toLowerCase(); if (v) run(async () => { const { error } = await adb.rpc('set_store_slug', { p_store: p.id, p_slug: v }); if (error) throw new Error(error.message.includes('taken') ? 'That link is taken' : 'Link: 4-40 letters, numbers or -') }, `Link set: /s/${v}`) }}>Store link</button>
              <button className="ad-b dng" onClick={() => setPanel(panel === 'del' ? '' : 'del')}>Delete</button>
            </div>
            {panel === 'pin' && <div className="ad-inline"><input className="ad-in" inputMode="numeric" maxLength={6} placeholder="New 6-digit PIN" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} />
              <button className="ad-b pri" disabled={pin.length !== 6} onClick={() => { const v = pin; setPin(''); setPanel(''); run(() => call('reset_pin', { store_id: p.id, pin: v }), `PIN for ${p.code} changed. All phones logged out.`) }}>Save PIN</button></div>}
            {panel === 'del' && <div className="ad-inline ad-danger"><p>Deletes this shop and all its data. Cannot be undone. Type {p.code} to confirm.</p>
              <input className="ad-in" value={conf} onChange={(e) => setConf(e.target.value.toUpperCase())} />
              <button className="ad-b dngf" disabled={conf !== p.code} onClick={() => run(() => call('delete_store', { store_id: p.id }), `${p.code} deleted.`, close)}>Delete forever</button></div>}
            <h3 className="ad-h3">Usage, 30 days</h3>
            {Object.keys(x.usage_30d).length ? <div className="ad-chips">{Object.entries(x.usage_30d).sort((a, b) => b[1] - a[1]).map(([k, n]) => <span key={k}>{k} <b>{n}</b></span>)}</div> : <p className="ad-empty">No usage recorded.</p>}
            <h3 className="ad-h3">Phones logged in ({live.length})</h3>
            {live.length === 0 ? <p className="ad-empty">No phones logged in.</p> : live.map((v) => (
              <div key={v.id} className="ad-line2"><span className="g">{v.label}<small>last used {ago(v.last_seen)}</small></span>
                <button className="ad-b dng" onClick={() => run(async () => { const { error } = await adb.rpc('device_revoke', { p_id: v.id }); if (error) throw new Error(error.message) }, 'Phone removed.')}>Remove</button></div>))}
            <h3 className="ad-h3">Top items, 30 days</h3>
            {x.top_items.length === 0 ? <p className="ad-empty">No sales yet.</p> : x.top_items.map((t) => <div key={t.name} className="ad-line2"><span className="g">{t.name}</span><span className="n">{Number(t.qty)}</span><b className="n">{inr(t.amount)}</b></div>)}
            <h3 className="ad-h3">Last bills</h3>
            {x.last_bills.length === 0 ? <p className="ad-empty">No bills yet.</p> : x.last_bills.map((b) => <div key={b.id} className="ad-line2"><span className="g">{b.customer ?? 'Walk-in'}<small>{dt(b.at)} · {b.pay}{b.status !== 'saved' ? ` · ${b.status}` : ''}</small></span><b className="n">{inr(b.total)}</b></div>)}
          </>
        }}</Load>
      </aside>
    </div>
  )
}
