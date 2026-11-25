import { useEffect, useState } from 'react'
import { useT, type Key } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { BackBar, Tap, toast } from '../components/ui'
import { Icon } from '../components/Icon'
import { successFx, errorFx } from '../lib/feedback'

// ---------- Free thaile mangao ----------
type BagReq = { id: string; qty: number; status: string; created_at: string }
export function Bags() {
  const { t, lang } = useT()
  const [qty, setQty] = useState<100 | 250 | 500>(250)
  const [list, setList] = useState<BagReq[] | null>(null)
  const [busy, setBusy] = useState(false)
  const load = () => supabase.from('bag_requests').select('id,qty,status,created_at').order('created_at', { ascending: false }).limit(10).then(({ data }) => setList((data as BagReq[]) ?? []))
  useEffect(() => { load() }, [])
  const open = list?.find((r) => r.status === 'new' || r.status === 'sent')
  const when = (iso: string) => new Date(iso).toLocaleDateString(lang === 'en' ? 'en-IN' : 'hi-IN', { day: 'numeric', month: 'short' })
  async function ask() {
    setBusy(true)
    const { error } = await supabase.rpc('request_bags', { p_qty: qty, p_note: null })
    setBusy(false)
    if (error) { errorFx(); toast({ text: error.message.includes('already_open') ? t('bagsOpen') : t('offline') }); return }
    successFx(); toast({ text: t('bagsDone') }); load()
  }
  return (
    <main className="screen has-bar pg">
      <BackBar />
      <h1 className="h1">{t('rowBags')}</h1>
      <div className="pg-blk" style={{ borderBottom: 0 }}>
        <div className="h2">{t('bagsHead')}</div>
        <p className="pg-sub">{t('bagsBody')}</p>
      </div>
      {list === null ? <div className="skel" style={{ height: 120, marginTop: 16 }} /> : open ? (
        <div className="hrow cur">
          <div className="g"><b>{open.qty} {t('bagsWord')}</b><span>{t(open.status === 'sent' ? 'bagsSent' : 'bagsWaiting')} · {when(open.created_at)}</span></div>
        </div>
      ) : <>
        <div className="hm-sec"><h2>{t('bagsHowMany')}</h2></div>
        <div className="shop-cats segs">
          {([100, 250, 500] as const).map((n) => <Tap key={n} className={qty === n ? 'on' : ''} onClick={() => setQty(n)}>{n}</Tap>)}
        </div>
        <div className="pg-acts">
          <Tap className="btn primary" disabled={busy} onClick={ask}>{busy ? t('loading') : `${qty} ${t('bagsAsk')}`}</Tap>
        </div>
      </>}
      {list && list.filter((r) => r !== open).length > 0 && <>
        <div className="hm-sec"><h2>{t('bagsPast')}</h2></div>
        {list.filter((r) => r !== open).map((r) => (
          <div key={r.id} className="hrow cur"><div className="g"><b>{r.qty} {t('bagsWord')}</b><span>{when(r.created_at)}</span></div>
            <div className="a">{t(r.status === 'done' ? 'bagsGot' : 'bagsCancelled')}</div></div>
        ))}
      </>}
    </main>
  )
}

// ---------- Niyam aur shartein ----------
const TERMS: Key[][] = [['tUseH', 'tUseB'], ['tDataH', 'tDataB'], ['tShareH', 'tShareB'], ['tMoneyH', 'tMoneyB'], ['tSafeH', 'tSafeB'], ['tEndH', 'tEndB']]
export function Terms() {
  const { t } = useT()
  return (
    <main className="screen has-bar pg">
      <BackBar />
      <h1 className="h1">{t('terms')}</h1>
      <p className="pg-sub">{t('tIntro')}</p>
      <div style={{ marginTop: 8 }}>
        {TERMS.map(([h, b]) => <div key={h} className="pg-blk"><div className="h2">{t(h)}</div><p className="pg-body">{t(b)}</p></div>)}
      </div>
      <p className="pg-sub" style={{ marginTop: 16 }}>{t('tUpdated')}</p>
    </main>
  )
}

// ---------- Jaldi aa raha hai (Phase 2 + 3) ----------
const SOON: { id: string; icon: string; phase: 2 | 3; h: Key; b: Key }[] = [
  { id: 'ai-udhaar', icon: 'wa', phase: 2, h: 'sAiUdhaarH', b: 'sAiUdhaarB' },
  { id: 'ai-orders', icon: 'cart', phase: 2, h: 'sAiOrdersH', b: 'sAiOrdersB' },
  { id: 'ai-promo', icon: 'chart', phase: 2, h: 'sPromoH', b: 'sPromoB' },
  { id: 'khata-photo', icon: 'book', phase: 2, h: 'sKhataH', b: 'sKhataB' },
  { id: 'offline', icon: 'globe', phase: 2, h: 'sOfflineH', b: 'sOfflineB' },
  { id: 'loan', icon: 'cash', phase: 2, h: 'sLoanH', b: 'sLoanB' },
  { id: 'profit', icon: 'chart', phase: 2, h: 'sProfitH', b: 'sProfitB' },
  { id: 'delivery', icon: 'bag', phase: 3, h: 'sDeliveryH', b: 'sDeliveryB' },
  { id: 'cust-credit', icon: 'book', phase: 3, h: 'sCredH', b: 'sCredB' },
  { id: 'trends', icon: 'chart', phase: 3, h: 'sTrendsH', b: 'sTrendsB' },
]
export function Soon() {
  const { t } = useT()
  const [want, setWant] = useState<Set<string>>(new Set())
  useEffect(() => { supabase.from('feature_interest').select('feature').then(({ data }) => setWant(new Set((data ?? []).map((r) => r.feature as string)))) }, [])
  async function ask(id: string) {
    setWant(new Set([...want, id])); successFx()
    const { error } = await supabase.rpc('want_feature', { p_feature: id })
    if (error) { const w = new Set(want); w.delete(id); setWant(w); toast({ text: t('offline') }) } else toast({ text: t('soonNoted') })
  }
  return (
    <main className="screen has-bar pg">
      <BackBar />
      <h1 className="h1">{t('rowSoon')}</h1>
      {([2, 3] as const).map((p) => <div key={p}>
        <div className="hm-sec"><h2>{t(p === 2 ? 'soonP2' : 'soonP3')}</h2></div>
        {SOON.filter((s) => s.phase === p).map((s) => (
          <div key={s.id} className="pg-blk">
            <div className="h2">{t(s.h)}</div>
            <p className="pg-body">{t(s.b)}</p>
            {want.has(s.id)
              ? <p className="bf2-done"><Icon name="tick" size={22} stroke={3} />{t('soonWanted')}</p>
              : <Tap className="btn outline" style={{ marginTop: 12 }} onClick={() => ask(s.id)}>{t('soonWant')}</Tap>}
          </div>
        ))}
      </div>)}
    </main>
  )
}
