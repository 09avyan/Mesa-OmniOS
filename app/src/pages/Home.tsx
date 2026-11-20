import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { useLang } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { tap } from '../lib/feedback'

export default function Home({ storeName }: { storeName: string }) {
  const { t } = useLang()
  const nav = useNavigate()
  const [today, setToday] = useState<{ total: number; n: number } | null>(null)

  useEffect(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0)
    supabase.from('bills').select('total').gte('created_at', start.toISOString()).then(({ data }) =>
      setToday({ total: (data ?? []).reduce((s, b) => s + Number(b.total), 0), n: data?.length ?? 0 }))
  }, [])

  const go = (to: string) => () => { tap(); nav(to) }
  return (
    <Screen title={storeName} back={false}>
      <section className="card" aria-live="polite">
        <div className="muted" style={{ fontWeight: 700 }}>☀️ {t('today')}</div>
        {today === null ? <p className="muted">{t('wait')}</p> : today.n === 0 ? (
          <p className="big" style={{ margin: '6px 0 0' }}>{t('morning_empty')}</p>
        ) : (
          <div className="row" style={{ marginTop: 6 }}>
            <div><div className="num" style={{ fontSize: 44 }}>₹{today.total.toLocaleString('en-IN')}</div><div className="muted">{t('sales')}</div></div>
            <div><div className="num" style={{ fontSize: 44 }}>{today.n}</div><div className="muted">{t('bills_n')}</div></div>
          </div>
        )}
      </section>
      <nav className="tiles">
        <button className="tile main" onClick={go('/bill')}><span className="ic">🧾</span>{t('bill')}</button>
        <button className="tile" onClick={go('/maal')}><span className="ic">📦</span>{t('maal')}</button>
        <button className="tile" onClick={go('/udhaar')}><span className="ic">📒</span>{t('udhaar')}</button>
        <button className="tile" onClick={go('/stock')}><span className="ic">🏷️</span>{t('stock')}</button>
      </nav>
      <button className="btn full" onClick={go('/more')}><span className="ic">☰</span>{t('more')}</button>
    </Screen>
  )
}
