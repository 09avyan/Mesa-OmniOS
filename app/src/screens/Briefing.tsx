import { useEffect, useState } from 'react'
import { useT, rupees } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { navigate } from '../lib/router'
import { BackBar, Tap, toast } from '../components/ui'
import { NumberSheet } from '../components/Pad'
import { itemName } from '../components/BillCard'
import { custLabel } from '../lib/shop'
import { invalidateShop } from '../lib/shop'
import { successFx, errorFx } from '../lib/feedback'

type CheckItem = { id: string; catalog_id: string | null; name: string; name_hi: string | null; unit: string; loose: boolean; stock: number }
type Brief = {
  yday: { sales: number; bills: number; udhaar_given: number; udhaar_collected: number }
  udhaar_total: number
  collect: { id: string; name: string; tag: string | null; balance: number; days: number | null }[]
  streak: number; check_done: boolean; check: CheckItem[]
}
const useBrief = () => {
  const [b, setB] = useState<Brief | null>(null)
  useEffect(() => { supabase.rpc('briefing').then(({ data }) => data && setB(data as Brief)) }, [])
  return b
}

// Home card: yesterday in one line, who to collect from, streak, today's 3-item count. No restock advice
// until the forecast has enough data (owner decision 23 Nov).
export function BriefingCard() {
  const { t } = useT()
  const b = useBrief()
  if (!b) return <div className="skel" style={{ height: 150, marginBottom: 16 }} />
  return (
    <div className="card bf">
      <div className="bf-top">
        <div className="h2" style={{ fontSize: 20 }}>{t('bfTitle')}</div>
        {b.streak >= 2 && <span className="pill ok bf-streak">{t('bfStreak').replace('{n}', String(b.streak))}</span>}
      </div>
      <Tap className="linkrow" onClick={() => navigate('/hisaab?r=yday')}>
        <span className="lab" style={{ fontWeight: 500 }}>{t('bfYday')}</span>
        <span style={{ color: 'var(--ink)' }}>{b.yday.bills ? `${rupees(+b.yday.sales)} · ${b.yday.bills} ${t('billsWord')}` : t('bfNoBills')}</span>
      </Tap>
      {b.collect.length > 0 && <>
        <div className="lab" style={{ marginTop: 8, fontWeight: 500 }}>{t('bfCollect')}</div>
        {b.collect.map((c) => (
          <Tap key={c.id} className="linkrow" onClick={() => navigate('/udhaar/' + c.id)}>
            <span style={{ color: 'var(--ink)' }}>{custLabel(c)}{c.days != null && c.days >= 3 && <span className="lab" style={{ fontWeight: 500, fontSize: 16 }}> · {t('bfDays').replace('{n}', String(c.days))}</span>}</span>
            <span style={{ color: 'var(--c-udh)' }}>{rupees(+c.balance)}</span>
          </Tap>
        ))}
      </>}
      {b.check.length > 0 && (b.check_done
        ? <p className="lab" style={{ marginTop: 10 }}>✓ {t('bfCheckDone')}</p>
        : <Tap className="btn outline small" style={{ width: '100%', marginTop: 12 }} onClick={() => navigate('/check')}>{t('bfCheck')}</Tap>)}
    </div>
  )
}

// Daily 3-item count: owner counts, we correct stock and show any gap ("koi bill chhoota?").
export function StockCheck() {
  const { t, lang } = useT()
  const b = useBrief()
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [pad, setPad] = useState<CheckItem | null>(null)
  const [result, setResult] = useState<{ item_id: string; was: number; counted: number }[] | null>(null)
  const [busy, setBusy] = useState(false)
  const unit = (i: CheckItem) => (i.unit === 'pack' || i.unit === 'pc' ? t('bfPcs') : i.unit)
  const nm = (i: CheckItem) => itemName({ ...i, qty: 0, price: 0, amount: 0 }, lang)
  async function save() {
    setBusy(true)
    const { data, error } = await supabase.rpc('stock_check', { p: { lines: b!.check.map((i) => ({ item_id: i.id, counted: counts[i.id] })) } })
    setBusy(false)
    if (error) { errorFx(); toast({ text: t('saveFailed') }); return }
    invalidateShop(); const r = (data as { item_id: string; was: number; counted: number }[]).map((x) => ({ ...x, was: +x.was, counted: +x.counted }))
    setResult(r); r.every((x) => x.was === x.counted) ? successFx() : errorFx()
  }
  return (
    <main className="screen has-bar">
      <BackBar />
      <h1 className="h1">{t('ckTitle')}</h1>
      <p className="lab" style={{ marginTop: 4 }}>{t('ckHow')}</p>
      {!b ? <div className="skel" style={{ height: 200, marginTop: 16 }} /> : !b.check.length ? <p className="lab" style={{ marginTop: 16 }}>{t('ckNone')}</p> : (
        <div className="stack" style={{ marginTop: 16 }}>
          {b.check.map((i) => {
            const r = result?.find((x) => x.item_id === i.id)
            const gap = r ? r.counted - r.was : 0
            return (
              <div key={i.id} className="card" style={{ padding: '16px 18px' }}>
                <div className="h2" style={{ fontSize: 20 }}>{nm(i)}</div>
                {!r ? (
                  <Tap className={`btn ${counts[i.id] != null ? 'outline' : 'primary'} small`} style={{ width: '100%', marginTop: 10 }} onClick={() => setPad(i)}>
                    {counts[i.id] != null ? `${t('ckCounted')}: ${counts[i.id]} ${unit(i)}` : t('ckCount')}
                  </Tap>
                ) : gap === 0 ? <p style={{ marginTop: 6, color: 'var(--ac)', fontWeight: 700 }}>✓ {t('ckMatch')} ({r.counted} {unit(i)})</p> : (
                  <div className="udnote" style={{ marginTop: 8 }}>
                    {t('ckApp')} {r.was} · {t('ckShelf')} {r.counted} {unit(i)} — {Math.abs(gap)} {gap < 0 ? t('ckLess') : t('ckMore')}
                    <div style={{ fontWeight: 500, marginTop: 4 }}>{t('ckFixed')}</div>
                  </div>
                )}
              </div>
            )
          })}
          {!result
            ? <Tap className="btn primary" disabled={busy || b.check.some((i) => counts[i.id] == null)} onClick={save}>{busy ? t('loading') : t('ckSave')}</Tap>
            : <Tap className="btn primary" onClick={() => navigate('/', true)}>{t('goHome')}</Tap>}
        </div>
      )}
      <NumberSheet open={!!pad} title={pad ? `${nm(pad)} — ${t('ckAsk')}` : ''} initial={pad ? counts[pad.id] ?? null : null} decimals={!!pad?.loose} zero
        unit={pad ? unit(pad) : undefined} onClose={() => setPad(null)} onDone={(n) => { setCounts({ ...counts, [pad!.id]: n }); setPad(null) }} />
    </main>
  )
}
