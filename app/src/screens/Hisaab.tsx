import { useEffect, useState } from 'react'
import { useT, rupees } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { useStore } from '../lib/store'
import { navigate } from '../lib/router'
import { BackBar, Tap } from '../components/ui'
import { NumberSheet } from '../components/Pad'
import { itemName } from '../components/BillCard'
import { successFx } from '../lib/feedback'

type Top = { name: string; catalog_id: string | null; name_hi: string | null; qty: number; unit: string; amount: number }
type Sum = { sales: number; cash: number; upi: number; udhaar_given: number; udhaar_collected: number; bills: number; days: number; busy_hour: number | null; top: Top[] }

// India date as yyyy-mm-dd, n days back
const day = (back = 0) => new Date(Date.now() + 5.5 * 3600e3 - back * 86400e3).toISOString().slice(0, 10)
const hourLabel = (h: number, lang: string) => {
  const f = (x: number) => `${((x + 11) % 12) + 1}`
  const part = h < 12 ? (lang === 'en' ? 'am' : 'subah') : h < 17 ? (lang === 'en' ? 'pm' : 'dopahar') : (lang === 'en' ? 'pm' : 'shaam')
  return lang === 'en' ? `${f(h)}–${f(h + 1)} ${part}` : `${part} ${f(h)}–${f(h + 1)} baje`
}

export function useSummary(from: string, to: string) {
  const [s, setS] = useState<Sum | null>(null)
  useEffect(() => {
    setS(null)
    supabase.rpc('day_summary', { p_from: from, p_to: to }).then(({ data }) => {
      if (!data) return
      const d = data as Sum
      setS({ ...d, sales: +d.sales, cash: +d.cash, upi: +d.upi, udhaar_given: +d.udhaar_given, udhaar_collected: +d.udhaar_collected, bills: +d.bills })
    })
  }, [from, to])
  return s
}

// Aaj ka hisaab: real numbers only. No profit (Phase 2), supplier dues come with receipts.
export function Hisaab() {
  const { t, lang } = useT()
  const [range, setRange] = useState<'today' | 'yday' | 'week' | 'month'>('today')
  const [from, to] = range === 'today' ? [day(), day()] : range === 'yday' ? [day(1), day(1)] : range === 'week' ? [day(6), day()] : [day(29), day()]
  const s = useSummary(from, to)
  const pct = (n: number) => (s && s.sales ? (n / s.sales) * 100 : 0)
  return (
    <main className="screen has-bar">
      <BackBar />
      <h1 className="h1">{t('hisaabTitle')}</h1>
      <div className="shop-cats segs" style={{ padding: '12px 0 4px' }}>
        {(['today', 'yday', 'week', 'month'] as const).map((k) => <Tap key={k} className={range === k ? 'on' : ''} onClick={() => setRange(k)}>{t(k === 'today' ? 'rToday' : k === 'yday' ? 'rYday' : k === 'week' ? 'rWeek' : 'rMonth')}</Tap>)}
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <div className="lab">{t('totalSales')}</div>
        {s ? <div className="big">{rupees(s.sales)}</div> : <div className="skel" style={{ height: 50, width: '55%' }} />}
        <div className="lab" style={{ marginTop: 4 }}>{s ? `${s.bills} ${t('billsWord')}${s.bills ? ` · ${t('avgBill')} ${rupees(s.sales / s.bills)}` : ''}` : ' '}</div>
        {s && s.sales > 0 && (
          <div className="hs-bar" aria-hidden>
            <i style={{ width: `${pct(s.cash)}%`, background: 'var(--ac)' }} /><i style={{ width: `${pct(s.upi)}%`, background: 'var(--c-maal)' }} /><i style={{ width: `${pct(s.udhaar_given)}%`, background: 'var(--c-udh)' }} />
          </div>
        )}
        <div className="gap8" />
        <Row dot="var(--ac)" label={t('payCash')} v={s?.cash} />
        <Row dot="var(--c-maal)" label={t('payUpi')} v={s?.upi} />
        <Row dot="var(--c-udh)" label={t('udhaarGiven')} v={s?.udhaar_given} />
        <Row dot="transparent" label={t('udhaarBack')} v={s?.udhaar_collected} />
      </div>
      {s && s.bills > 0 && <>
        {s.busy_hour != null && <p className="lab" style={{ margin: '16px 4px 0' }}>{t('busyHour')}: <b style={{ color: 'var(--ink)' }}>{hourLabel(s.busy_hour, lang)}</b></p>}
        <h2 className="h2" style={{ margin: '24px 4px 8px' }}>{t('topItems')}</h2>
        <div className="card" style={{ padding: '6px 20px' }}>
          {s.top.map((it, i) => (
            <div key={i} className="linkrow" style={{ color: 'var(--ink)', fontWeight: 600, borderTop: i ? '1px solid var(--line, #EDE3D1)' : 'none' }}>
              <span style={{ minWidth: 0 }}>{itemName({ ...it, price: 0 }, lang)}<span className="lab" style={{ display: 'block', fontSize: 16, fontWeight: 500 }}>{+it.qty} {it.unit}</span></span>
              <span className="num" style={{ fontSize: 20 }}>{rupees(+it.amount)}</span>
            </div>
          ))}
        </div>
      </>}
      {s && s.bills === 0 && <p className="lab center" style={{ marginTop: 20 }}>{t('noBillsRange')}</p>}
      <p className="lab" style={{ margin: '20px 4px 0', fontSize: 16 }}>{t('supplierSoon')}</p>
      <div className="gap16" />
      {range === 'today' && <Tap className="btn primary" onClick={() => navigate('/galla')}>{t('rowGalla')}</Tap>}
    </main>
  )
}
function Row({ dot, label, v }: { dot: string; label: string; v: number | undefined }) {
  return (
    <div className="linkrow" style={{ color: 'var(--ink)', fontWeight: 600 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><i style={{ width: 10, height: 10, borderRadius: 5, background: dot, border: dot === 'transparent' ? '2px solid var(--ink2)' : 'none' }} />{label}</span>
      <span className="num" style={{ fontSize: 20 }}>{v == null ? '…' : rupees(v)}</span>
    </div>
  )
}

// Galla milao: type (or say) the cash in the drawer; compare with today's cash bills.
export function Galla() {
  const { t } = useT()
  const { store } = useStore()
  const s = useSummary(day(), day())
  const [said, setSaid] = useState<number | null>(null)
  const [pad, setPad] = useState(true)
  const gap = said != null && s ? said - s.cash : null
  return (
    <main className="screen has-bar">
      <BackBar />
      <h1 className="h1">{t('gallaTitle')}</h1>
      <p className="lab" style={{ marginTop: 4 }}>{t('gallaHow')}</p>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="linkrow" style={{ color: 'var(--ink)', fontWeight: 600 }}><span className="lab">{t('gallaBills')}</span><span className="num">{s ? rupees(s.cash) : '…'}</span></div>
        <Tap className="linkrow" onClick={() => setPad(true)}><span>{t('gallaSaid')}</span><span className="num">{said != null ? rupees(said) : t('gallaType')}</span></Tap>
        {s && s.udhaar_collected > 0 && <p className="lab" style={{ fontSize: 16, marginTop: 6 }}>{t('gallaUdhaarNote').replace('{x}', rupees(s.udhaar_collected))}</p>}
      </div>
      {gap != null && (
        <div className={gap === 0 ? 'card' : 'udnote'} style={{ marginTop: 16, ...(gap === 0 ? { background: 'var(--acs)', color: 'var(--ac)' } : {}) }}>
          <div className="h2">{gap === 0 ? t('gallaMatch') : `${rupees(Math.abs(gap))} ${gap < 0 ? t('gallaLess') : t('gallaMore')}`}</div>
          {gap !== 0 && <p style={{ marginTop: 4 }}>{t('gallaNote')}</p>}
        </div>
      )}
      <div className="gap16" />
      <p className="center lab">{t('gallaSay')}</p>
      <NumberSheet open={pad} title={t('gallaAsk')} initial={said} decimals={false} onClose={() => setPad(false)} onDone={(n) => {
        setSaid(n); setPad(false)
        if (s && n === s.cash) successFx()
        if (store && s) supabase.from('usage_events').insert({ store_id: store.id, kind: 'galla', meta: { said: n, cash: s.cash, via: 'type' } }).then(() => {})
      }} />
    </main>
  )
}
