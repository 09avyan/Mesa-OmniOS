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
    <main className="screen has-bar">
      <BackBar />
      <h1 className="h1">{t('rowBags')}</h1>
      <div className="card" style={{ marginTop: 16, background: '#FCE7F0', color: 'var(--c-bag)' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}><Icon name="bag" size={36} /><div className="h2">{t('bagsHead')}</div></div>
        <p style={{ marginTop: 8, color: 'var(--ink)' }}>{t('bagsBody')}</p>
      </div>
      {list === null ? <div className="skel" style={{ height: 120, marginTop: 16 }} /> : open ? (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="h2">{open.qty} {t('bagsWord')}</div>
          <p className="lab">{t(open.status === 'sent' ? 'bagsSent' : 'bagsWaiting')} · {when(open.created_at)}</p>
        </div>
      ) : <>
        <h2 className="h2" style={{ margin: '24px 4px 8px' }}>{t('bagsHowMany')}</h2>
        <div className="shop-cats segs" style={{ padding: 0 }}>
          {([100, 250, 500] as const).map((n) => <Tap key={n} className={qty === n ? 'on' : ''} onClick={() => setQty(n)}>{n}</Tap>)}
        </div>
        <div className="gap24" />
        <Tap className="btn primary" disabled={busy} onClick={ask}>{busy ? t('loading') : `${qty} ${t('bagsAsk')}`}</Tap>
      </>}
      {list && list.filter((r) => r !== open).length > 0 && <>
        <h2 className="h2" style={{ margin: '28px 4px 8px' }}>{t('bagsPast')}</h2>
        <div className="stack">{list.filter((r) => r !== open).map((r) => (
          <div key={r.id} className="rowb" style={{ cursor: 'default' }}><span className="grow">{r.qty} {t('bagsWord')}</span><span className="lab" style={{ fontWeight: 500 }}>{when(r.created_at)}</span>
            <span className={`pill ${r.status === 'done' ? 'ok' : 'off'}`}>{t(r.status === 'done' ? 'bagsGot' : 'bagsCancelled')}</span></div>
        ))}</div>
      </>}
    </main>
  )
}

// ---------- Niyam aur shartein ----------
const TERMS: Key[][] = [['tUseH', 'tUseB'], ['tDataH', 'tDataB'], ['tShareH', 'tShareB'], ['tMoneyH', 'tMoneyB'], ['tSafeH', 'tSafeB'], ['tEndH', 'tEndB']]
export function Terms() {
  const { t } = useT()
  return (
    <main className="screen has-bar">
      <BackBar />
      <h1 className="h1">{t('terms')}</h1>
      <p className="lab" style={{ marginTop: 4 }}>{t('tIntro')}</p>
      <div className="stack" style={{ marginTop: 16 }}>
        {TERMS.map(([h, b]) => <div key={h} className="card" style={{ padding: '18px 20px' }}><div className="h2" style={{ fontSize: 20 }}>{t(h)}</div><p style={{ marginTop: 6, lineHeight: '26px' }}>{t(b)}</p></div>)}
      </div>
      <p className="lab center" style={{ marginTop: 16, fontSize: 17 }}>{t('tUpdated')}</p>
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
    <main className="screen has-bar">
      <BackBar />
      <h1 className="h1">{t('rowSoon')}</h1>
      <p className="lab" style={{ marginTop: 4 }}>{t('soonIntro')}</p>
      {([2, 3] as const).map((p) => <div key={p}>
        <h2 className="h2" style={{ margin: '24px 4px 8px' }}>{t(p === 2 ? 'soonP2' : 'soonP3')}</h2>
        <div className="stack">{SOON.filter((s) => s.phase === p).map((s) => (
          <div key={s.id} className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span className="chip" style={{ background: p === 2 ? 'var(--c-his)' : 'var(--c-ord)' }}><Icon name={s.icon} size={24} /></span>
              <div className="h2" style={{ fontSize: 20, flex: 1 }}>{t(s.h)}</div>
            </div>
            <p style={{ margin: '8px 0 12px', lineHeight: '26px' }}>{t(s.b)}</p>
            {want.has(s.id)
              ? <div className="pill ok" style={{ fontSize: 17, lineHeight: '34px', padding: '0 14px' }}><Icon name="tick" size={22} stroke={3} />{t('soonWanted')}</div>
              : <Tap className="btn outline small" onClick={() => ask(s.id)}>{t('soonWant')}</Tap>}
          </div>
        ))}</div>
      </div>)}
    </main>
  )
}
