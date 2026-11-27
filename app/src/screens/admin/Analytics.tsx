import { useState } from 'react'
import { call, inr, inrShort, dd, useLoad, Load } from './core'

type N = number | string
type An = {
  daily: { day: string; active_shops: N; bills: N; sales: N }[]; wau: N; mau: N; shops: N; avg_bill: N
  funnel: Record<string, N>; pay_mix: Record<string, { bills: N; sales: N }>
  hours: { hour: N; bills: N }[]; features: { kind: string; n: N; shops: N }[]
  top_items: { name: string; qty: N; amount: N; shops: N }[]
}
const n = (v: unknown) => Number(v) || 0
const KIND: Record<string, string> = { open: 'App opens', receipt: 'Receipts scanned', bill: 'Bills made', voice: 'Voice bills', share: 'Bills shared', udhaar: 'Udhaar entries', stock: 'Stock changes', order: 'Bag orders', ai: 'AI calls' }
const STEPS: [string, string][] = [['shops', 'Shops'], ['with_bill', 'Made a bill'], ['with_10_bills', '10+ bills'], ['with_udhaar', 'Used udhaar'], ['with_stock', 'Added stock'], ['with_receipt', 'Scanned a receipt']]
const PAY: [string, string, string][] = [['cash', 'Cash', 'var(--ink)'], ['upi', 'UPI', 'var(--ink3)'], ['udhaar', 'Udhaar', 'var(--ud,#8A5000)']]

function Daily({ days }: { days: An['daily'] }) {
  const [hi, setHi] = useState<number | null>(null)
  const mb = Math.max(1, ...days.map((d) => n(d.bills))), ms = Math.max(1, ...days.map((d) => n(d.active_shops)))
  const w = 100 / Math.max(1, days.length)
  const line = days.map((d, i) => `${i ? 'L' : 'M'}${((i + .5) * w).toFixed(2)} ${(58 - (n(d.active_shops) / ms) * 54).toFixed(2)}`).join(' ')
  const s = hi == null ? null : days[hi]
  const at = (e: { clientX: number; currentTarget: Element }) => { const r = e.currentTarget.getBoundingClientRect(); setHi(Math.min(days.length - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * days.length)))) }
  return <div className="ad-chart">
    <div className="ad-chart-tip">{s ? <><b>{n(s.bills)} bills</b> · {n(s.active_shops)} shops · {inr(s.sales)} · {dd(s.day)}</> : <span>Bars: bills. Line: shops active. Touch a day.</span>}</div>
    <svg className="ad-an-svg" viewBox="0 0 100 60" preserveAspectRatio="none" role="img" aria-label="Bills and active shops per day, last 30 days" onPointerMove={at} onPointerDown={at} onPointerLeave={() => setHi(null)}>
      {days.map((d, i) => <rect key={d.day} x={i * w + w * .15} width={w * .7} y={60 - (n(d.bills) / mb) * 56} height={(n(d.bills) / mb) * 56} className={`ad-an-bar ${hi === i ? 'on' : ''}`} />)}
      <path d={line} className="ad-an-ln" vectorEffect="non-scaling-stroke" />
    </svg>
    <div className="ad-chart-x"><span>{dd(days[0]?.day)}</span><span>{dd(days[days.length - 1]?.day)}</span></div>
  </div>
}

export function Analytics() {
  const a = useLoad<An>(() => call('analytics'))
  return <Load s={a} rows={5}>{(d) => {
    const days = d.daily ?? [], shops = n(d.shops), sales30 = days.reduce((t, x) => t + n(x.sales), 0)
    const f = d.funnel ?? {}, fs = Math.max(1, n(f.shops) || shops)
    const mix = PAY.map(([k, l, c]) => ({ k, l, c, bills: n(d.pay_mix?.[k]?.bills), sales: n(d.pay_mix?.[k]?.sales) })), mixTot = mix.reduce((t, x) => t + x.sales, 0)
    const hrs = Array.from({ length: 24 }, (_, h) => n(d.hours?.find((x) => n(x.hour) === h)?.bills)), hmax = Math.max(0, ...hrs)
    const feats = [...(d.features ?? [])].sort((x, y) => n(y.n) - n(x.n))
    return <>
      <div className="ad-kpis">
        {([['Shops', String(shops)], ['Active, 7 days', String(n(d.wau))], ['Active, 30 days', String(n(d.mau))], ['Average bill', inr(d.avg_bill)], ['Sales, 30 days', inrShort(sales30)]] as const).map(([l, v]) => <div key={l} className="ad-kpi"><span>{l}</span><b>{v}</b></div>)}
      </div>
      <section className="ad-card"><h2>Bills per day <small>last 30 days</small></h2>{days.length && days.some((x) => n(x.bills)) ? <Daily days={days} /> : <p className="ad-empty">No data yet</p>}</section>
      <section className="ad-card"><h2>Adoption <small>% of {shops} shops</small></h2>
        {shops === 0 ? <p className="ad-empty">No data yet</p> : STEPS.map(([k, l]) => { const v = n(f[k]), p = Math.round((v / fs) * 100); return <div key={k} className="ad-an-fr"><span>{l}</span><i><u style={{ width: `${p}%` }} /></i><b className="n">{v} · {p}%</b></div> })}</section>
      <section className="ad-card"><h2>How customers pay <small>share of sales, 30 days</small></h2>
        {mixTot === 0 ? <p className="ad-empty">No data yet</p> : <>
          <div className="ad-an-mix" role="img" aria-label="Payment mix">{mix.filter((x) => x.sales > 0).map((x) => <i key={x.k} style={{ flex: x.sales, background: x.c }} />)}</div>
          <div className="ad-an-leg">{mix.map((x) => <span key={x.k}><s style={{ background: x.c }} />{x.l} <b>{Math.round((x.sales / mixTot) * 100)}%</b> · {x.bills} bills · {inrShort(x.sales)}</span>)}</div></>}</section>
      <section className="ad-card"><h2>Busiest hours <small>bills by hour, IST</small></h2>
        {hmax === 0 ? <p className="ad-empty">No data yet</p> : <>
          <div className="ad-bars">{hrs.map((v, h) => <i key={h} title={`${h}:00 · ${v} bills`} style={{ height: `${Math.max(2, (v / hmax) * 100)}%` }} />)}</div>
          <div className="ad-chart-x"><span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span></div></>}</section>
      <section className="ad-card ad-flush"><h2 className="ad-pad">Feature use <small>last 30 days</small></h2>
        <div className="ad-th"><span>Feature</span><span className="n">Times</span><span className="n">Shops</span></div>
        {feats.length === 0 ? <p className="ad-empty">No data yet</p> : feats.map((x) => <div key={x.kind} className="ad-row"><span className="g">{KIND[x.kind] ?? x.kind}</span><b className="n">{n(x.n)}</b><span className="n">{n(x.shops)}</span></div>)}</section>
      <section className="ad-card ad-flush"><h2 className="ad-pad">Top items <small>30 days, all shops</small></h2>
        <div className="ad-th"><span>Item</span><span className="n">Qty</span><span className="n">Amount</span><span className="n ad-hide">Shops</span></div>
        {(d.top_items ?? []).length === 0 ? <p className="ad-empty">No data yet</p> : d.top_items.map((t) => <div key={t.name} className="ad-row"><span className="g">{t.name}</span><span className="n">{n(t.qty)}</span><b className="n">{inrShort(n(t.amount))}</b><span className="n ad-hide">{n(t.shops)}</span></div>)}</section>
    </>
  }}</Load>
}
