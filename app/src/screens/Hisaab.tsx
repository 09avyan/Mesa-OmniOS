import { Icon } from '../components/Icon'
import { useEffect, useState } from 'react'
import { useT, rupees } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { useStore } from '../lib/store'
import { navigate } from '../lib/router'
import { HomeBtn, LoadError, Tap, TopBar } from '../components/ui'
import { NumberSheet } from '../components/Pad'
import { itemName } from '../components/BillCard'
import { successFx } from '../lib/feedback'

type Top = { name: string; catalog_id: string | null; name_hi: string | null; qty: number; unit: string; amount: number }
type Sum = { supplier_due: number | null; suppliers: number; sales: number; cash: number; upi: number; udhaar_given: number; udhaar_collected: number; bills: number; days: number; busy_hour: number | null; top: Top[] }

// India date as yyyy-mm-dd, n days back
const day = (back = 0) => new Date(Date.now() + 5.5 * 3600e3 - back * 86400e3).toISOString().slice(0, 10)
const hourLabel = (h: number, lang: string) => {
  const f = (x: number) => `${((x + 11) % 12) + 1}`
  const part = h < 12 ? (lang === 'en' ? 'am' : 'subah') : h < 17 ? (lang === 'en' ? 'pm' : 'dopahar') : (lang === 'en' ? 'pm' : 'shaam')
  return lang === 'en' ? `${f(h)}–${f(h + 1)} ${part}` : `${part} ${f(h)}–${f(h + 1)} baje`
}

export function useSummary(from: string, to: string) {
  const [s, setS] = useState<Sum | null>(null)
  const [failed, setFailed] = useState(false)
  const [n, setN] = useState(0)
  useEffect(() => {
    setS(null); setFailed(false)
    supabase.rpc('day_summary', { p_from: from, p_to: to }).then(({ data, error }) => {
      if (error || !data) { setFailed(true); return }
      const d = data as Sum
      setS({ ...d, sales: +d.sales, cash: +d.cash, upi: +d.upi, udhaar_given: +d.udhaar_given, udhaar_collected: +d.udhaar_collected, bills: +d.bills })
    }, () => setFailed(true))
  }, [from, to, n])
  return { s, failed, retry: () => setN((x) => x + 1) }
}

const Sk = () => <div className="vc">{[0, 1, 2, 3].map((k) => <div key={k} className="vrow" style={{ minHeight: 64 }}><i className="vsk" style={{ width: 120, height: 20 }} /></div>)}</div>

// Aaj ka hisaab: real numbers only. No profit (Phase 2), supplier dues come with receipts.
export function Hisaab() {
  const { t, lang } = useT()
  const [range, setRange] = useState<'today' | 'yday' | 'week' | 'month'>(() => (new URLSearchParams(location.search).get('r') === 'yday' ? 'yday' : 'today'))
  const [from, to] = range === 'today' ? [day(), day()] : range === 'yday' ? [day(1), day(1)] : range === 'week' ? [day(6), day()] : [day(29), day()]
  const { s, failed, retry } = useSummary(from, to)
  return (
    <main className="screen v2 has-bar">
      <TopBar back="/" title={t('hisaabTitle')} />
      <div className="vseg" role="group">
        {(['today', 'yday', 'week', 'month'] as const).map((k) => <button key={k} aria-pressed={range === k} onClick={() => setRange(k)}>{t(k === 'today' ? 'rToday' : k === 'yday' ? 'rYday' : k === 'week' ? 'rWeek' : 'rMonth')}</button>)}
      </div>
      {failed ? <LoadError onRetry={retry} /> : !s ? <div className="vstack"><i className="vsk" style={{ height: 120, borderRadius: 18 }} /><Sk /></div> : <>
        <div className="vc vblock">
          <div className="vlab">{t('totalSales')}</div>
          <div className="vbig">{rupees(s.sales)}</div>
          <div className="vlab">{s.bills} {t('billsWord')}{s.bills ? ` · ${t('avgBill')} ${rupees(s.sales / s.bills)}` : ''}</div>
        </div>
        <div className="vc" style={{ marginTop: 12 }}>
          <Row label={t('payCash')} v={s.cash} />
          <Row label={t('payUpi')} v={s.upi} />
          <Row label={t('udhaarGiven')} v={s.udhaar_given} ud />
          <Row label={t('udhaarBack')} v={s.udhaar_collected} />
        </div>
        {s.bills > 0 ? <>
          {s.busy_hour != null && <p className="vlab" style={{ margin: '16px 4px 0' }}>{t('busyHour')}: <b style={{ color: 'var(--ink)' }}>{hourLabel(s.busy_hour, lang)}</b></p>}
          <div className="vhead"><span className="vlab">{t('topItems')}</span></div>
          <div className="vc">{s.top.map((it, i) => (
            <div key={i} className="vrow">
              <span className="t"><b>{itemName({ ...it, price: 0 }, lang)}</b><span>{+it.qty} {it.unit}</span></span>
              <span className="a">{rupees(+it.amount)}</span>
            </div>))}</div>
        </> : <div className="vempty" style={{ paddingTop: 24 }}><p>{t('noBillsRange')}</p></div>}
        {s.suppliers > 0 && <Tap className="vrow vc" style={{ marginTop: 16, minHeight: 64 }} onClick={() => navigate('/suppliers')}><span className="t"><b>{t('supTitle')}</b></span><span className="a">{rupees(+(s.supplier_due ?? 0))}</span><Icon name="chev" size={22} /></Tap>}
      </>}
      {range === 'today' && !failed && <Tap className="btn primary" style={{ marginTop: 16 }} onClick={() => navigate('/galla')}><Icon name="cash" size={24} />{t('rowGalla')}</Tap>}
    </main>
  )
}
function Row({ label, v, ud }: { label: string; v: number; ud?: boolean }) {
  return (
    <div className="vrow" style={{ minHeight: 64 }}>
      <span className="t"><b>{label}</b></span>
      <span className={`a ${ud ? 'ud' : ''}`}>{rupees(v)}</span>
    </div>
  )
}

// Galla milao: type (or say) the cash in the drawer; compare with today's cash bills.
export function Galla() {
  const { t } = useT()
  const { store } = useStore()
  const { s, failed, retry } = useSummary(day(), day())
  const [said, setSaid] = useState<number | null>(null)
  const [pad, setPad] = useState(true)
  const gap = said != null && s ? said - s.cash : null
  return (
    <main className="screen v2 has-foot">
      <TopBar back="/hisaab" title={t('gallaTitle')} />
      {failed ? <LoadError onRetry={retry} /> : <>
        <div className="vc vblock">
          <div className="vlab">{t('gallaBills')}</div>
          {s ? <div className="vbig">{rupees(s.cash)}</div> : <i className="vsk" style={{ height: 48, width: '55%', marginTop: 8 }} />}
          {s && s.udhaar_collected > 0 && <div className="vlab">{t('gallaUdhaarNote').replace('{x}', rupees(s.udhaar_collected))}</div>}
        </div>
        <Tap className="vrow vc" style={{ marginTop: 12, minHeight: 64 }} onClick={() => setPad(true)}>
          <Icon name="cash" size={24} /><span className="t"><b>{t('gallaSaid')}</b></span><span className="a">{said != null ? rupees(said) : t('gallaType')}</span>
        </Tap>
        {gap != null && (gap === 0
          ? <div className="vbanner" style={{ marginTop: 12, background: 'var(--oksoft)', color: 'var(--ok)' }}><Icon name="tick" size={24} stroke={3} /><b>{t('gallaMatch')}</b></div>
          : <div className="vnote" style={{ marginTop: 12, display: 'block' }}><b style={{ display: 'block' }}>{rupees(Math.abs(gap))} {gap < 0 ? t('gallaLess') : t('gallaMore')}</b><span style={{ fontWeight: 500 }}>{t('gallaNote')}</span></div>)}
      </>}
      <div className="vfoot flat"><HomeBtn className="primary" /></div>
      <NumberSheet open={pad} title={t('gallaAsk')} initial={said} decimals={false} onClose={() => setPad(false)} onDone={(n) => {
        setSaid(n); setPad(false)
        if (s && n === s.cash) successFx()
        if (store && s) supabase.from('usage_events').insert({ store_id: store.id, kind: 'galla', meta: { said: n, cash: s.cash, via: 'type' } }).then(() => {})
      }} />
    </main>
  )
}
