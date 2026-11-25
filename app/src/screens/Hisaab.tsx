import { Icon } from '../components/Icon'
import { useEffect, useState } from 'react'
import { useT, rupees } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { useStore } from '../lib/store'
import { navigate } from '../lib/router'
import { BackBar, Tap } from '../components/ui'
import { NumberSheet, ru } from '../components/Pad'
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
  const [range, setRange] = useState<'today' | 'yday' | 'week' | 'month'>(() => (new URLSearchParams(location.search).get('r') === 'yday' ? 'yday' : 'today'))
  const [from, to] = range === 'today' ? [day(), day()] : range === 'yday' ? [day(1), day(1)] : range === 'week' ? [day(6), day()] : [day(29), day()]
  const s = useSummary(from, to)
  return (
    <main className="screen has-bar pg">
      <BackBar />
      <h1 className="h1">{t('hisaabTitle')}</h1>
      <div className="shop-cats segs">
        {(['today', 'yday', 'week', 'month'] as const).map((k) => <Tap key={k} className={range === k ? 'on' : ''} onClick={() => setRange(k)}>{t(k === 'today' ? 'rToday' : k === 'yday' ? 'rYday' : k === 'week' ? 'rWeek' : 'rMonth')}</Tap>)}
      </div>
      <div className="pg-sum">
        <div className="lab">{t('totalSales')}</div>
        {s ? <div className="hm-big">{ru(s.sales)}</div> : <div className="skel" style={{ height: 56, width: '55%' }} />}
        <div className="sub">{s ? `${s.bills} ${t('billsWord')}${s.bills ? ` · ${t('avgBill')} ${rupees(s.sales / s.bills)}` : ''}` : ' '}</div>
      </div>
      <Row label={t('payCash')} v={s?.cash} />
      <Row label={t('payUpi')} v={s?.upi} />
      <Row label={t('udhaarGiven')} v={s?.udhaar_given} ud />
      <Row label={t('udhaarBack')} v={s?.udhaar_collected} />
      {s && s.bills > 0 && <>
        {s.busy_hour != null && <p className="pg-sub" style={{ marginTop: 16 }}>{t('busyHour')}: <b>{hourLabel(s.busy_hour, lang)}</b></p>}
        <div className="hm-sec"><h2>{t('topItems')}</h2></div>
        {s.top.map((it, i) => (
          <div key={i} className="hrow cur">
            <div className="g"><b>{itemName({ ...it, price: 0 }, lang)}</b><span>{+it.qty} {it.unit}</span></div>
            <div className="a">{rupees(+it.amount)}</div>
          </div>
        ))}
      </>}
      {s && s.bills === 0 && <p className="pg-empty">{t('noBillsRange')}</p>}
      {s && s.suppliers > 0 && <Tap className="hrow" style={{ marginTop: 16 }} onClick={() => navigate('/suppliers')}><div className="g"><b>{t('supTitle')}</b></div><div className="a">{rupees(+(s.supplier_due ?? 0))}</div><Icon name="chev" size={20} /></Tap>}
      {range === 'today' && <div className="pg-acts"><Tap className="btn primary" onClick={() => navigate('/galla')}><Icon name="cash" size={24} />{t('rowGalla')}</Tap></div>}
    </main>
  )
}
function Row({ label, v, ud }: { label: string; v: number | undefined; ud?: boolean }) {
  return (
    <div className="hrow cur" style={{ minHeight: 64 }}>
      <div className="g"><b>{label}</b></div>
      <div className={`a ${ud ? 'ud' : ''}`}>{v == null ? '…' : rupees(v)}</div>
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
    <main className="screen has-bar pg">
      <BackBar />
      <h1 className="h1">{t('gallaTitle')}</h1>
      <div className="pg-sum">
        <div className="lab">{t('gallaBills')}</div>
        {s ? <div className="hm-big">{ru(s.cash)}</div> : <div className="skel" style={{ height: 56, width: '55%' }} />}
        {s && s.udhaar_collected > 0 && <div className="sub">{t('gallaUdhaarNote').replace('{x}', rupees(s.udhaar_collected))}</div>}
      </div>
      <div className="pg-acts" style={{ marginTop: 16 }}>
        <Tap className="btn outline" onClick={() => setPad(true)}><Icon name="cash" size={24} />{t('gallaSaid')}: {said != null ? rupees(said) : t('gallaType')}</Tap>
      </div>
      {gap != null && (
        <div className="pg-blk" style={{ borderBottom: 0 }}>
          {gap === 0 ? <p className="bf2-done"><Icon name="tick" size={22} stroke={3} />{t('gallaMatch')}</p> : <>
            <div className="pg-gap">{rupees(Math.abs(gap))} {gap < 0 ? t('gallaLess') : t('gallaMore')}</div>
            <p className="pg-sub">{t('gallaNote')}</p>
          </>}
        </div>
      )}
      <NumberSheet open={pad} title={t('gallaAsk')} initial={said} decimals={false} onClose={() => setPad(false)} onDone={(n) => {
        setSaid(n); setPad(false)
        if (s && n === s.cash) successFx()
        if (store && s) supabase.from('usage_events').insert({ store_id: store.id, kind: 'galla', meta: { said: n, cash: s.cash, via: 'type' } }).then(() => {})
      }} />
    </main>
  )
}
