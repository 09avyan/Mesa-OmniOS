import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Boxes, ChevronRight, LayoutGrid, NotebookPen, PackagePlus, ReceiptText } from 'lucide-react'
import { Screen } from '../components/Screen'
import { useLang } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { tap } from '../lib/feedback'

type Entry = { id: string; created_at: string; total: number; pay_mode: string; customers: { name: string } | null }
const rupees = (n: number) => '₹' + n.toLocaleString('en-IN')

export default function Home({ storeName }: { storeName: string }) {
  const { t, lang } = useLang()
  const nav = useNavigate()
  const [rows, setRows] = useState<Entry[] | null>(null)

  useEffect(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0)
    supabase.from('bills').select('id,created_at,total,pay_mode,customers(name)').gte('created_at', start.toISOString())
      .order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => setRows((data ?? []) as unknown as Entry[]))
  }, [])

  const total = (rows ?? []).reduce((s, r) => s + Number(r.total), 0)
  const locale = lang === 'hi' ? 'hi-IN' : 'en-IN'
  const date = new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })
  const go = (to: string) => () => { tap(); nav(to) }

  return (
    <Screen title={storeName} cover={
      <div className="balance" aria-live="polite">
        <div className="sub">{t('today_sales')} · {date}</div>
        <div className="num">{rows === null ? '—' : rupees(total)}</div>
        <div className="sub">{rows?.length ?? 0} {t('bills_n')}</div>
      </div>
    }>
      <nav className="actions">
        <button className="action bill" onClick={go('/bill')}><ReceiptText size={28} />{t('bill')}</button>
        <button className="action" onClick={go('/maal')}><PackagePlus size={28} />{t('maal')}</button>
        <button className="action" onClick={go('/udhaar')}><NotebookPen size={28} />{t('udhaar')}</button>
        <button className="action" onClick={go('/stock')}><Boxes size={28} />{t('stock')}</button>
      </nav>

      <section className="ledger">
        <div className="ledger-head"><h2>{t('entries')}</h2></div>
        <div className="ledger-cols"><span>{t('col_time')}</span><span>{t('col_detail')}</span><span>{t('col_amount')}</span></div>
        {rows && rows.length === 0 && <div className="ledger-empty"><strong>{t('empty_title')}</strong>{t('empty_body')}</div>}
        {rows?.map(r => (
          <div className="entry" key={r.id}>
            <span className="time num">{new Date(r.created_at).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}</span>
            <span>{r.customers?.name ?? t('walkin')} · <span className={r.pay_mode === 'udhaar' ? 'baki' : 'muted'}>{t(('pay_' + r.pay_mode) as 'pay_cash')}</span></span>
            <span className={'amt' + (r.pay_mode === 'udhaar' ? ' baki' : '')}>{rupees(Number(r.total))}</span>
          </div>
        ))}
      </section>

      <div className="list">
        <button className="list-row" onClick={go('/more')}><LayoutGrid size={24} />{t('other')}<ChevronRight className="chev" /></button>
      </div>
    </Screen>
  )
}
