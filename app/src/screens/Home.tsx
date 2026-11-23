import { useEffect, useState } from 'react'
import { useT, rupees } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { useNewOrders } from './Orders'
import { useStore } from '../lib/store'
import { navigate } from '../lib/router'
import { RowButton, Tap } from '../components/ui'
import { Icon } from '../components/Icon'

// Today at a glance. Numbers are real: bills arrive in S4, so until then they are honestly ₹0.
export function Home() {
  const { t } = useT()
  const { store } = useStore()
  const [sum, setSum] = useState<{ sales: number; udhaar_given: number; bills: number } | null>(null)
  useEffect(() => { supabase.rpc('today_summary').then(({ data }) => data && setSum({ sales: Number(data.sales), udhaar_given: Number(data.udhaar_given), bills: Number(data.bills) })) }, [])
  const newOrders = useNewOrders()
  const sales = sum?.sales ?? 0, udhaar = sum?.udhaar_given ?? 0
  return (
    <main className="screen has-bar home">
      <header className="hx">
        <div className="hx-top">
          <div style={{ minWidth: 0 }}><div className="hx-hi">{t('namaste')}</div><div className="hx-store">{store?.name}</div></div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Tap className="hx-ic" aria-label={t('myStore')} onClick={() => navigate('/dukaan')}><Icon name="qr" size={24} /></Tap>
            <Tap className="hx-ic" aria-label={t('settings')} onClick={() => navigate('/settings')}><Icon name="gear" size={22} /></Tap>
          </div>
        </div>
        <div className="hx-lab">{t('todaySales')}</div>
        {sum ? <div className="hx-big">{rupees(sales)}</div> : <div className="skel" style={{ height: 52, width: '50%', opacity: .3 }} />}
        {sum && sales === 0 && <div className="hx-note">{t('firstBillHint')}</div>}
        <div className="hx-chips">
          <Tap className="hx-chip" onClick={() => navigate('/udhaar', true)}><span>{t('udhaarToday')}</span><b>{rupees(udhaar)}</b></Tap>
          <Tap className="hx-chip" onClick={() => navigate('/bill', true)}><span>{t('todayBills')}</span><b>{sum?.bills ?? 0}</b></Tap>
        </div>
      </header>
      <div className="gap24" />
      <div className="stack">
        <RowButton icon="chart" color="var(--c-his)" label={t('fullHisaab')} onClick={() => navigate('/hisaab')} />
        <RowButton icon="cash" color="var(--c-gal)" label={t('rowGalla')} onClick={() => navigate('/galla')} />
        <RowButton icon="cart" color="var(--c-ord)" label={t('rowOrders')} badge={newOrders} onClick={() => navigate('/orders')} />
        <RowButton icon="bag" color="var(--c-bag)" label={t('rowBags')} onClick={() => navigate('/bags')} />
        <RowButton icon="tools" color="var(--c-his)" label={t('rowSoon')} onClick={() => navigate('/soon')} />
      </div>
      <div className="gap24" />
      <p className="center" style={{ lineHeight: '26px' }}>{t('sayHint')}<br /><b>{t('sayExample')}</b></p>
    </main>
  )
}
