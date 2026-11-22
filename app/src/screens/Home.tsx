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
  const [sum, setSum] = useState<{ sales: number; udhaar_given: number } | null>(null)
  useEffect(() => { supabase.rpc('today_summary').then(({ data }) => data && setSum({ sales: Number(data.sales), udhaar_given: Number(data.udhaar_given) })) }, [])
  const newOrders = useNewOrders()
  const sales = sum?.sales ?? 0, udhaar = sum?.udhaar_given ?? 0
  return (
    <main className="screen has-bar">
      <div className="top">
        <span className="title">{store?.name}</span>
        <div style={{ display: 'flex' }}>
          <Tap className="ghost" aria-label={t('myStore')} onClick={() => navigate('/dukaan')}><Icon name="qr" size={24} />QR</Tap>
          <Tap className="ghost" onClick={() => navigate('/settings')}><Icon name="gear" size={22} />{t('settings')}</Tap>
        </div>
      </div>
      <section className="card">
        <div className="lab">{t('todaySales')}</div>
        {sum ? <div className="big">{rupees(sales)}</div> : <div className="skel" style={{ height: 50, width: '50%', margin: '0' }} />}
        {sum && sales === 0 && <div className="lab" style={{ marginTop: 4 }}>{t('firstBillHint')}</div>}
        <div className="divider" />
        <Tap className="linkrow" style={{ color: 'var(--ink)', fontWeight: 500 }} onClick={() => navigate('/udhaar', true)}>
          <span className="lab">{t('udhaarToday')}</span><span className="num" style={{ color: 'var(--ud)' }}>{rupees(udhaar)} ›</span>
        </Tap>
        <div className="divider" style={{ margin: '4px 0 4px' }} />
        <Tap className="linkrow" onClick={() => navigate('/hisaab')}><span>{t('fullHisaab')}</span><span style={{ font: "700 26px 'Baloo 2'" }}>›</span></Tap>
      </section>
      <div className="gap24" />
      <div className="stack">
        <RowButton icon="cash" color="var(--c-gal)" label={t('rowGalla')} onClick={() => navigate('/galla')} />
        <RowButton icon="cart" color="var(--c-ord)" label={t('rowOrders')} badge={newOrders} onClick={() => navigate('/orders')} />
        <RowButton icon="bag" color="var(--c-bag)" label={t('rowBags')} onClick={() => navigate('/bags')} />
      </div>
      <div className="gap24" />
      <p className="center" style={{ lineHeight: '26px' }}>{t('sayHint')}<br /><b>{t('sayExample')}</b></p>
    </main>
  )
}
