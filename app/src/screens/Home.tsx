import { useEffect, useState } from 'react'
import { useT } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { useNewOrders } from './Orders'
import { useStore } from '../lib/store'
import { navigate } from '../lib/router'
import { Tap } from '../components/ui'
import { Icon } from '../components/Icon'
import { BriefingCard } from './Briefing'
import { loadShop, custLabel, type Customer } from '../lib/shop'

type Sum = { sales: number; udhaar_given: number; bills: number; cash?: number; upi?: number }
type Row = { id: string; total: number; pay: 'cash' | 'upi' | 'udhaar'; created_at: string; customers: { name: string } | null; bill_lines: { name: string }[] }
const ru = (n: number) => <><span className="rs">₹</span>{Math.round(n).toLocaleString('en-IN')}</>
const clock = (s: string) => new Date(s).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: false })

// Home: today's number, who owes you, today's bills. One big figure, everything else is a quiet list.
export function Home() {
  const { t, lang } = useT()
  const { store } = useStore()
  const [sum, setSum] = useState<Sum | null>(null)
  const [owe, setOwe] = useState<Customer[]>([])
  const [rows, setRows] = useState<Row[] | null>(null)
  useEffect(() => {
    supabase.rpc('today_summary').then(({ data }) => data && setSum({ sales: Number(data.sales), udhaar_given: Number(data.udhaar_given), bills: Number(data.bills), cash: data.cash != null ? Number(data.cash) : undefined, upi: data.upi != null ? Number(data.upi) : undefined }))
    loadShop().then((s) => setOwe(s.customers.filter((c) => c.balance > 0).sort((a, b) => b.balance - a.balance).slice(0, 3)))
    const start = new Date(); start.setHours(0, 0, 0, 0)
    supabase.from('bills').select('id,total,pay,created_at,customers(name),bill_lines(name)').eq('status', 'saved').gte('created_at', start.toISOString()).order('created_at', { ascending: false }).limit(6)
      .then(({ data }) => setRows((data ?? []) as unknown as Row[]))
  }, [])
  const newOrders = useNewOrders()
  const sales = sum?.sales ?? 0
  const oweTotal = owe.reduce((s, c) => s + c.balance, 0)
  const payLabel = (p: Row['pay']) => p === 'udhaar' ? t('udhaar') : p === 'upi' ? 'UPI' : 'Cash'
  return (
    <main className="screen has-bar home">
      <header className="hm-top">
        <h1 className="hm-store">{store?.name}</h1>
        <div style={{ display: 'flex', gap: 4, flex: 'none' }}>
          <Tap className="hm-btn" onClick={() => navigate('/dukaan')}><Icon name="qr" size={22} />QR</Tap>
          <Tap className="hm-btn" onClick={() => navigate('/settings')}><Icon name="gear" size={22} />{t('settingsShort')}</Tap>
        </div>
      </header>
      <section className="card hm-sales">
        <div className="lab" style={{ display: 'flex', justifyContent: 'space-between' }}><span>{t('todaySales')}</span>{sum && <span style={{ color: 'var(--ink3)' }}>{sum.bills} {t('billsWord')}</span>}</div>
        {sum ? <div className="hm-big" style={{ marginTop: 8 }}>{ru(sales)}</div> : <div className="skel" style={{ height: 56, width: '55%', marginTop: 8 }} />}
        {sum && sales === 0 ? <div className="lab" style={{ marginTop: 8 }}>{t('firstBillHint')}</div> : sum && (
          <div className="hm-split">
            {sum.cash != null && <div>Cash<b>{ru(sum.cash)}</b></div>}
            {sum.upi != null && <div>UPI<b>{ru(sum.upi)}</b></div>}
            <div className="ud">{t('udhaar')}<b>{ru(sum.udhaar_given)}</b></div>
          </div>
        )}
      </section>
      {owe.length > 0 && <>
        <div className="hm-sec"><h2>{t('lenaHai')}</h2><span className="num">{ru(oweTotal)}</span></div>
        {owe.map((c) => {
          const msg = lang === 'en' ? `Namaste ${c.name}, your balance at ${store?.name ?? ''} is ₹${c.balance}.` : `Namaste ${c.name}, ${store?.name ?? ''} mein aapka ₹${c.balance} baaki hai.`
          const ph = (c.phone ?? '').replace(/\D/g, '')
          return (
            <div key={c.id} className="hrow owe">
              <Tap className="g" style={{ textAlign: 'left' }} onClick={() => navigate('/udhaar/' + c.id)}><b>{custLabel(c)}</b></Tap>
              <span className="a">{ru(c.balance)}</span>
              <a className="yaad tap" href={`https://wa.me/${ph ? (ph.length === 10 ? '91' + ph : ph) : ''}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer"><Icon name="wa" size={20} />{t('yaad')}</a>
            </div>
          )
        })}
        <Tap className="hlink" onClick={() => navigate('/udhaar', true)}>{t('allUdhaar')}<Icon name="chev" size={20} /></Tap>
      </>}
      {newOrders > 0 && <div className="hrow" style={{ marginTop: 16, borderTop: '1px solid var(--line)' }}>
        <span className="hcount">{newOrders}</span><div className="g"><b>{t('rowOrders')}</b></div>
        <Tap className="btn primary small" style={{ minHeight: 56, padding: '0 16px' }} onClick={() => navigate('/orders')}><Icon name="cart" size={20} />{t('dekho')}</Tap>
      </div>}
      <div className="hm-sec"><h2>{t('todayBills')}</h2></div>
      {rows && rows.length === 0 && <p className="lab">{t('noBillsToday')}</p>}
      {(rows ?? []).map((b) => (
        <Tap key={b.id} className="hrow" onClick={() => navigate('/bill/' + b.id)}>
          <span className="tm">{clock(b.created_at)}</span>
          <div className="g"><b>{b.customers?.name ?? t('walkIn')}</b><span>{b.bill_lines.map((l) => l.name).slice(0, 3).join(', ')}</span></div>
          <div className="a">{ru(Number(b.total))}<small className={b.pay === 'udhaar' ? 'ud' : ''}>{payLabel(b.pay)}</small></div>
        </Tap>
      ))}
      <div className="gap16" />
      <BriefingCard />
      <nav className="card list" aria-label="more">
        <Tap className="lrow" onClick={() => navigate('/hisaab')}><span className="ic"><Icon name="chart" size={22} /></span><span className="grow">{t('fullHisaab')}</span><span className="go"><Icon name="chev" size={20} /></span></Tap>
        <Tap className="lrow" onClick={() => navigate('/galla')}><span className="ic"><Icon name="cash" size={22} /></span><span className="grow">{t('rowGalla')}</span><span className="go"><Icon name="chev" size={20} /></span></Tap>
        <Tap className="lrow" onClick={() => navigate('/orders')}><span className="ic"><Icon name="cart" size={22} /></span><span className="grow">{t('rowOrders')}</span><span className="go">{newOrders ? `${newOrders} ${t('newWord')}` : null}<Icon name="chev" size={20} /></span></Tap>
        <Tap className="lrow" onClick={() => navigate('/bags')}><span className="ic"><Icon name="bag" size={22} /></span><span className="grow">{t('rowBags')}</span><span className="go"><Icon name="chev" size={20} /></span></Tap>
        <Tap className="lrow" onClick={() => navigate('/soon')}><span className="ic"><Icon name="tools" size={22} /></span><span className="grow">{t('rowSoon')}</span><span className="go"><Icon name="chev" size={20} /></span></Tap>
      </nav>
    </main>
  )
}
