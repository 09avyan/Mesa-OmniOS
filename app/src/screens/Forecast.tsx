import { useEffect, useState } from 'react'
import { useT } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { itemName } from '../components/BillCard'
import { LoadError } from '../components/ui'

type FItem = { id: string; catalog_id: string | null; name: string; name_hi: string | null; unit: string; loose: boolean; stock: number; days_left?: number }
type F = { days: number; need: number; low: FItem[]; soon: FItem[] | null }

// Maal tab card. Learning state with progress until 14 days of real sales; never invents numbers.
export function ForecastCard() {
  const { t, lang } = useT()
  const [f, setF] = useState<F | null>(null)
  const [failed, setFailed] = useState(false)
  const load = () => {
    setFailed(false)
    supabase.rpc('forecast').then(({ data, error }) => { if (error) setFailed(true); else if (data) setF(data as F) }, () => setFailed(true))
  }
  useEffect(load, [])
  if (failed) return <LoadError onRetry={load} />
  if (!f) return <i className="vsk" style={{ height: 96, marginTop: 16, borderRadius: 18 }} />
  const nm = (i: FItem) => itemName({ ...i, qty: 0, price: 0, amount: 0 }, lang)
  const unit = (i: FItem) => (i.unit === 'pack' || i.unit === 'pc' ? t('bfPcs') : i.unit)
  const learning = f.soon == null
  const list = (learning ? f.low : f.soon!).slice(0, 5)
  return (
    <section style={{ marginTop: 8 }}>
      <div className="vhead"><span className="vlab">{learning ? t('fcLearning') : t('fcSoon')}</span></div>
      {learning && <div className="vc vblock" style={{ marginBottom: 12 }}>
        <p>{t('fcLearnBody').replace('{n}', String(f.days)).replace('{m}', String(f.need))}</p>
        <div className="vbar" style={{ marginTop: 12 }} role="progressbar" aria-valuemin={0} aria-valuemax={f.need} aria-valuenow={f.days}><i style={{ width: `${Math.min(100, (f.days / f.need) * 100)}%` }} /></div>
      </div>}
      {list.length === 0 ? <p className="vlab">{t('fcAllGood')}</p> : <>
        {learning && <p className="vlab" style={{ margin: '0 4px 8px' }}>{t('fcLow')}</p>}
        <div className="vc">{list.map((i) => (
          <div key={i.id} className="vrow" style={{ minHeight: 64 }}>
            <span className="t"><b>{nm(i)}</b></span>
            <span className="a ud">{i.days_left != null ? (+i.stock <= 0 ? t('fcOut') : i.days_left <= 1 ? t('fcToday') : t('fcDays').replace('{n}', String(i.days_left))) : `${+i.stock} ${unit(i)}`}</span>
          </div>
        ))}</div>
      </>}
    </section>
  )
}
