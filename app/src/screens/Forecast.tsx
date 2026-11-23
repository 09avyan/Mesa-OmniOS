import { useEffect, useState } from 'react'
import { useT } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { itemName } from '../components/BillCard'

type FItem = { id: string; catalog_id: string | null; name: string; name_hi: string | null; unit: string; loose: boolean; stock: number; days_left?: number }
type F = { days: number; need: number; low: FItem[]; soon: FItem[] | null }

// Maal tab card. Learning state with progress until 14 days of real sales; never invents numbers.
export function ForecastCard() {
  const { t, lang } = useT()
  const [f, setF] = useState<F | null>(null)
  useEffect(() => { supabase.rpc('forecast').then(({ data }) => data && setF(data as F)) }, [])
  if (!f) return null
  const nm = (i: FItem) => itemName({ ...i, qty: 0, price: 0, amount: 0 }, lang)
  const unit = (i: FItem) => (i.unit === 'pack' || i.unit === 'pc' ? t('bfPcs') : i.unit)
  const learning = f.soon == null
  const list = (learning ? f.low : f.soon!).slice(0, 5)
  return (
    <div className="card" style={{ padding: '16px 20px', marginBottom: 16 }}>
      <div className="h2" style={{ fontSize: 20 }}>{learning ? t('fcLearning') : t('fcSoon')}</div>
      {learning && <>
        <p className="lab" style={{ marginTop: 4, fontSize: 16 }}>{t('fcLearnBody').replace('{n}', String(f.days)).replace('{m}', String(f.need))}</p>
        <div className="hs-bar" style={{ marginTop: 10 }}><i style={{ width: `${Math.min(100, (f.days / f.need) * 100)}%`, background: 'var(--ac)' }} /></div>
      </>}
      {list.length === 0 ? <p className="lab" style={{ marginTop: 8 }}>{t('fcAllGood')}</p> : <>
        {learning && <div className="lab" style={{ marginTop: 10, fontWeight: 500 }}>{t('fcLow')}</div>}
        {list.map((i) => (
          <div key={i.id} className="linkrow" style={{ color: 'var(--ink)', fontWeight: 600 }}>
            <span>{nm(i)}</span>
            <span style={{ color: 'var(--c-udh)', whiteSpace: 'nowrap' }}>{i.days_left != null ? (+i.stock <= 0 ? t('fcOut') : i.days_left <= 1 ? t('fcToday') : t('fcDays').replace('{n}', String(i.days_left))) : `${+i.stock} ${unit(i)}`}</span>
          </div>
        ))}
        {!learning && <p className="lab" style={{ fontSize: 15, marginTop: 6 }}>{t('fcHow')}</p>}
      </>}
    </div>
  )
}
