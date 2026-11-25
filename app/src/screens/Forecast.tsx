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
    <section className="fc">
      <div className="hm-sec"><h2>{learning ? t('fcLearning') : t('fcSoon')}</h2></div>
      {learning && <>
        <p className="lab">{t('fcLearnBody').replace('{n}', String(f.days)).replace('{m}', String(f.need))}</p>
        <div className="fc-bar" role="progressbar" aria-valuemin={0} aria-valuemax={f.need} aria-valuenow={f.days}><i style={{ width: `${Math.min(100, (f.days / f.need) * 100)}%` }} /></div>
      </>}
      {list.length === 0 ? <p className="lab">{t('fcAllGood')}</p> : <>
        {learning && <div className="fc-sub">{t('fcLow')}</div>}
        {list.map((i) => (
          <div key={i.id} className="hrow cur">
            <div className="g"><b>{nm(i)}</b></div>
            <div className="a">{i.days_left != null ? (+i.stock <= 0 ? t('fcOut') : i.days_left <= 1 ? t('fcToday') : t('fcDays').replace('{n}', String(i.days_left))) : `${+i.stock} ${unit(i)}`}</div>
          </div>
        ))}
      </>}
    </section>
  )
}
