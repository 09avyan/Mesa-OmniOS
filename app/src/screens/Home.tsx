import { useEffect, useState } from 'react'
import { useT, rupees } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { useNewOrders } from './Orders'
import { useStore } from '../lib/store'
import { navigate } from '../lib/router'
import { Tap } from '../components/ui'
import { Icon } from '../components/Icon'
import { BriefingCard } from './Briefing'

// Today at a glance. Numbers are real: bills arrive in S4, so until then they are honestly ₹0.
export function Home() {
  const { t, lang } = useT()
  const { store } = useStore()
  const [sum, setSum] = useState<{ sales: number; udhaar_given: number; bills: number } | null>(null)
  useEffect(() => { supabase.rpc('today_summary').then(({ data }) => data && setSum({ sales: Number(data.sales), udhaar_given: Number(data.udhaar_given), bills: Number(data.bills) })) }, [])
  const newOrders = useNewOrders()
  const sales = sum?.sales ?? 0, udhaar = sum?.udhaar_given ?? 0
  const now = new Date().toLocaleTimeString(lang === 'en' ? 'en-IN' : 'hi-IN', { hour: 'numeric', minute: '2-digit' })
  return (
    <main className="screen has-bar home">
      <header className="hm-top">
        <div className="hm-hi">{t('namaste').replace(/\s*🙏/u, '')}</div>
        <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
          <Tap className="hm-btn" onClick={() => navigate('/dukaan')}><Icon name="qr" size={22} />QR</Tap>
          <Tap className="hm-btn" onClick={() => navigate('/settings')}><Icon name="gear" size={22} />{t('settingsShort')}</Tap>
        </div>
      </header>
      <h1 className="hm-store">{store?.name}</h1>
      <section className="card hm-sales">
        <div className="lab">{t('todaySales')} · {now}</div>
        {sum ? <div className="hm-big">{rupees(sales)}</div> : <div className="skel" style={{ height: 56, width: '55%' }} />}
        {sum && sales === 0 ? <div className="lab">{t('firstBillHint')}</div> : (
          <div className="hm-meta">
            <Tap onClick={() => navigate('/bill', true)}><b>{sum?.bills ?? 0}</b> {t('billsWord')}</Tap>
            <Tap onClick={() => navigate('/udhaar', true)}>{t('udhaarGiven')} <span className="ud-amt">{rupees(udhaar)}</span></Tap>
          </div>
        )}
      </section>
      <div className="gap16" />
      <BriefingCard />
      <nav className="card list" aria-label="more">
        <Tap className="lrow" onClick={() => navigate('/hisaab')}><span className="ic"><Icon name="chart" size={22} /></span><span className="grow">{t('fullHisaab')}</span><span className="go"><Icon name="chev" size={20} /></span></Tap>
        <Tap className="lrow" onClick={() => navigate('/galla')}><span className="ic"><Icon name="cash" size={22} /></span><span className="grow">{t('rowGalla')}</span><span className="go"><Icon name="chev" size={20} /></span></Tap>
        <Tap className="lrow" onClick={() => navigate('/orders')}><span className="ic"><Icon name="cart" size={22} /></span><span className="grow">{t('rowOrders')}</span><span className="go">{newOrders ? `${newOrders} ${t('newWord')}` : null}<Icon name="chev" size={20} /></span></Tap>
        <Tap className="lrow" onClick={() => navigate('/bags')}><span className="ic"><Icon name="bag" size={22} /></span><span className="grow">{t('rowBags')}</span><span className="go"><Icon name="chev" size={20} /></span></Tap>
        <Tap className="lrow" onClick={() => navigate('/soon')}><span className="ic"><Icon name="tools" size={22} /></span><span className="grow">{t('rowSoon')}</span><span className="go"><Icon name="chev" size={20} /></span></Tap>
      </nav>
      <p className="center lab" style={{ margin: '20px 0 0', lineHeight: '26px' }}>{t('sayHint')}<br /><b style={{ color: 'var(--ink)' }}>{t('sayExample')}</b></p>
    </main>
  )
}
