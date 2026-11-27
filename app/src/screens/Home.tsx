import { useCallback, useEffect, useState } from 'react'
import { useT, rupees } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { useNewOrders } from './Orders'
import { useStore } from '../lib/store'
import { navigate } from '../lib/router'
import { LoadError, Tap } from '../components/ui'
import { Icon, Logo } from '../components/Icon'
import { loadShop } from '../lib/shop'
import { useQueued } from '../lib/offlineQueue'

type Sum = { sales: number; udhaar_given: number; bills: number; cash?: number; upi?: number }
type Row = { id: string; total: number; pay: 'cash' | 'upi' | 'udhaar'; created_at: string; customers: { name: string } | null; bill_lines: { name: string }[] }
const clock = (s: string) => new Date(s).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: false })

function useOnline() {
  const [on, setOn] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  useEffect(() => {
    const u = () => setOn(true), d = () => setOn(false)
    window.addEventListener('online', u); window.addEventListener('offline', d)
    return () => { window.removeEventListener('online', u); window.removeEventListener('offline', d) }
  }, [])
  return on
}

// Home: today's number, who owes you, Poochho, latest bills. Nothing else.
export function Home() {
  const { t } = useT()
  const { store } = useStore()
  const [sum, setSum] = useState<Sum | null>(null)
  const [oweTotal, setOweTotal] = useState<number | null>(null)
  const [rows, setRows] = useState<Row[] | null>(null)
  const [failed, setFailed] = useState(false)
  const queued = useQueued()
  const online = useOnline()
  const newOrders = useNewOrders()

  const load = useCallback(() => {
    setFailed(false)
    const start = new Date(); start.setHours(0, 0, 0, 0)
    const ok = (e: unknown) => { if (e) setFailed(true) }
    supabase.rpc('today_summary').then(({ data, error }) => { ok(error); if (data) setSum({ sales: Number(data.sales), udhaar_given: Number(data.udhaar_given), bills: Number(data.bills), cash: data.cash != null ? Number(data.cash) : undefined, upi: data.upi != null ? Number(data.upi) : undefined }) }, () => setFailed(true))
    loadShop().then((s) => setOweTotal(s.customers.reduce((a, c) => a + Math.max(0, c.balance), 0)), () => setFailed(true))
    supabase.from('bills').select('id,total,pay,created_at,customers(name),bill_lines(name)').eq('status', 'saved').gte('created_at', start.toISOString()).order('created_at', { ascending: false }).limit(3)
      .then(({ data, error }) => { ok(error); setRows((data ?? []) as unknown as Row[]) }, () => setFailed(true))
  }, [])
  useEffect(() => { load() }, [load])

  const loading = !failed && (!sum || oweTotal == null || !rows)
  const offline = !online || queued > 0
  const retry = () => { setSum(null); setOweTotal(null); setRows(null); load() }
  const payLabel = (p: Row['pay']) => p === 'udhaar' ? t('udhaar') : p === 'upi' ? 'UPI' : 'Cash'

  return (
    <main className="screen v2 has-bar">
      <div className="vtop" style={{ gap: 12 }}>
        <Logo size={40} />
        <h1>{store?.name}</h1>
        <Tap className="ib" aria-label={t('settingsShort')} onClick={() => navigate('/settings')}><Icon name="sliders" size={24} /></Tap>
      </div>
      {offline && (
        <div className="vbanner" role="status">
          <Icon name="cloudOff" size={24} />
          <div style={{ flex: 1 }}>
            <b>{queued > 0 ? t('queueBanner').replace('{n}', String(queued)) : t('netDown')}</b>
            {queued > 0 && <span>{t('queueSub')}</span>}
          </div>
        </div>
      )}
      {failed && !sum ? <LoadError onRetry={retry} /> : loading ? <HomeSkeleton /> : (
        <div className="vstack">
          <div className="vc" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="vlab">{t('todaySales')}</span>
              <span className="vchip">{sum!.bills} {t('billsWord')}</span>
            </div>
            <div className="vbig" style={{ margin: '8px 0 16px' }}>{rupees(sum!.sales)}</div>
            <div className="vsplit">
              <div><div className="vlab">Cash</div><b>{rupees(sum!.cash ?? 0)}</b></div>
              <div><div className="vlab">UPI</div><b>{rupees(sum!.upi ?? 0)}</b></div>
              <div><div className="vlab">{t('udhaar')}</div><b className="ud">{rupees(sum!.udhaar_given)}</b></div>
            </div>
          </div>
          <div className="vgrid2">
            <Tap className="vc" style={{ textAlign: 'left', padding: 16, display: 'grid', gap: 8, alignContent: 'start' }} onClick={() => navigate('/udhaar')}>
              <span className="ud" style={{ lineHeight: 0 }}><Icon name="book" size={24} /></span>
              <div><div className="vlab">{t('baakiUdhaar')}</div><div className="vfig ud">{rupees(oweTotal ?? 0)}</div></div>
            </Tap>
            <Tap className="vc" style={{ textAlign: 'left', padding: 16, display: 'grid', gap: 8, alignContent: 'start' }} onClick={() => navigate('/orders')}>
              <span style={{ lineHeight: 0 }}><Icon name="bag" size={24} /></span>
              <div><div className="vlab">{t('rowOrders')}</div><div className="vfig">{t('newOrdersN').replace('{n}', String(newOrders))}</div></div>
            </Tap>
          </div>
          <Tap className="vc vask" style={{ textAlign: 'left' }} onClick={() => navigate('/poochho')}>
            <span className="m"><Icon name="spark" size={24} /></span>
            <span className="t"><b>{t('poochho')}</b><span>{t('poochhoEg')}</span></span>
            <Icon name="chev" size={22} />
          </Tap>
          {rows && rows.length > 0 && (
            <div className="vc">
              <div className="vrow" style={{ minHeight: 56, padding: '8px 16px' }}>
                <span className="t"><b>{t('recentBills')}</b></span>
                <Tap className="ulink vlab" style={{ height: 40, color: 'var(--ink)' }} onClick={() => navigate('/bill')}>{t('seeAll')}</Tap>
              </div>
              {rows.map((b) => (
                <Tap key={b.id} className="vrow" onClick={() => navigate('/bill/' + b.id)}>
                  <span className="t"><b>{b.customers?.name ?? t('walkInShort')}</b><span>{b.bill_lines.length} {t('itemsN').replace('{n} ', '')} · {clock(b.created_at)} · {payLabel(b.pay)}</span></span>
                  <span className={`a ${b.pay === 'udhaar' ? 'ud' : ''}`}>{rupees(Number(b.total))}</span>
                </Tap>
              ))}
            </div>
          )}
          <div className="vc vset">
            <Tap className="vrow" onClick={() => navigate('/hisaab')}><Icon name="chart" size={24} /><span className="t"><b>{t('fullHisaab')}</b></span><Icon name="chev" size={22} /></Tap>
            <Tap className="vrow" onClick={() => navigate('/galla')}><Icon name="cash" size={24} /><span className="t"><b>{t('rowGalla')}</b></span><Icon name="chev" size={22} /></Tap>
          </div>
        </div>
      )}
    </main>
  )
}

function HomeSkeleton() {
  const { t } = useT()
  return (
    <div className="vstack" aria-busy="true">
      <div className="vc" style={{ padding: 20 }}>
        <i className="vsk" style={{ width: 120, height: 20 }} />
        <i className="vsk" style={{ width: 200, height: 56, margin: '12px 0 20px' }} />
        <div className="vsplit">{[0, 1, 2].map((k) => <div key={k}><i className="vsk" style={{ width: 48, height: 20 }} /><i className="vsk" style={{ width: 72, height: 24, marginTop: 8 }} /></div>)}</div>
      </div>
      <div className="vgrid2">{[0, 1].map((k) => <div key={k} className="vc" style={{ padding: 16, height: 120 }}><i className="vsk" style={{ width: 24, height: 24 }} /><i className="vsk" style={{ width: 104, height: 20, marginTop: 16 }} /><i className="vsk" style={{ width: 88, height: 24, marginTop: 8 }} /></div>)}</div>
      <div className="vc vask"><i className="vsk" style={{ width: 48, height: 48, borderRadius: 14 }} /><span style={{ flex: 1 }}><i className="vsk" style={{ width: 96, height: 20 }} /><i className="vsk" style={{ width: 160, height: 20, marginTop: 8 }} /></span></div>
      <p className="vlab" style={{ textAlign: 'center', marginTop: 4 }}>{t('loadingHisaab')}</p>
    </div>
  )
}
