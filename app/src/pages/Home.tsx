import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Boxes, ChevronRight, LayoutGrid, NotebookPen, PackagePlus, ReceiptText, Sun } from 'lucide-react'
import { Screen } from '../components/Screen'
import { useLang } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { tap } from '../lib/feedback'

export default function Home({ storeName }: { storeName: string }) {
  const { t, lang } = useLang()
  const nav = useNavigate()
  const [today, setToday] = useState<{ total: number; n: number } | null>(null)

  useEffect(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0)
    supabase.from('bills').select('total').gte('created_at', start.toISOString()).then(({ data }) =>
      setToday({ total: (data ?? []).reduce((s, b) => s + Number(b.total), 0), n: data?.length ?? 0 }))
  }, [])

  const date = new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
  const go = (to: string) => () => { tap(); nav(to) }
  return (
    <Screen title={storeName} back={false}>
      <section className="card" aria-live="polite">
        <div className="eyebrow"><Sun size={18} />{t('today')} · {date}</div>
        <div className="row" style={{ marginTop: 10 }}>
          <div className="stat"><div className="num">₹{(today?.total ?? 0).toLocaleString('en-IN')}</div><div className="lbl">{t('sales')}</div></div>
          <div className="stat"><div className="num">{today?.n ?? 0}</div><div className="lbl">{t('bills_n')}</div></div>
        </div>
        {today?.n === 0 && <p className="muted" style={{ margin: '10px 0 0' }}>{t('morning_empty')}</p>}
      </section>
      <nav className="tiles">
        <button className="tile main" onClick={go('/bill')}><span className="iconbox"><ReceiptText size={28} /></span>{t('bill')}</button>
        <button className="tile" onClick={go('/maal')}><span className="iconbox"><PackagePlus size={28} /></span>{t('maal')}</button>
        <button className="tile" onClick={go('/udhaar')}><span className="iconbox"><NotebookPen size={28} /></span>{t('udhaar')}</button>
        <button className="tile" onClick={go('/stock')}><span className="iconbox"><Boxes size={28} /></span>{t('stock')}</button>
      </nav>
      <button className="btn row-btn" onClick={go('/more')}><span className="iconbox"><LayoutGrid size={22} /></span>{t('more')}<ChevronRight className="chev" /></button>
    </Screen>
  )
}
