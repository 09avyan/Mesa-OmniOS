import { useEffect, useState } from 'react'
import { useT, rupees, type Key } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { navigate } from '../lib/router'
import { invalidateShop } from '../lib/shop'
import { errorFx, successFx } from '../lib/feedback'
import { BackBar, Tap, toast } from '../components/ui'
import { Icon } from '../components/Icon'

type BillRow = { id: string; total: number; pay: 'cash' | 'upi' | 'udhaar'; status: string; created_at: string; share_token: string; customers: { name: string } | null; bill_lines: { name: string; qty: number; unit: string; price: number; amount: number }[] }
const time = (s: string) => new Date(s).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
const units: Record<string, string> = { kg: 'kg', g: 'g', l: 'L', ml: 'ml', pc: '', pack: 'pkt' }

// Bill tab: make a bill (voice or by choosing items) + today's bills.
export function Bills() {
  const { t } = useT()
  const [bills, setBills] = useState<BillRow[] | null>(null)
  useEffect(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0)
    supabase.from('bills').select('id,total,pay,status,created_at,share_token,customers(name),bill_lines(name,qty,unit,price,amount)')
      .gte('created_at', start.toISOString()).order('created_at', { ascending: false }).limit(100)
      .then(({ data }) => setBills((data ?? []) as unknown as BillRow[]))
  }, [])
  const live = (bills ?? []).filter((b) => b.status === 'saved')
  const total = live.reduce((s, b) => s + Number(b.total), 0)
  return (
    <main className="screen has-bar">
      <div className="top" />
      <h1 className="h1">{t('tabBill')}</h1>
      <div className="gap16" />
      <Tap className="btn primary" onClick={() => navigate('/bolo')}><Icon name="mic" size={26} />{t('billByVoice')}</Tap>
      <div className="gap8" />
      <Tap className="btn quiet" onClick={() => navigate('/bolo?manual=1')}><Icon name="bill" size={24} />{t('billByPick')}</Tap>
      <div className="gap24" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 className="h2">{t('todayBills')}</h2>
        {bills && live.length > 0 && <span className="lab">{live.length} · <b style={{ color: 'var(--ink)' }}>{rupees(total)}</b></span>}
      </div>
      <div className="gap8" />
      {!bills ? <div className="stack"><div className="skel" style={{ height: 68 }} /><div className="skel" style={{ height: 68 }} /></div>
        : bills.length === 0 ? <div className="card center"><p className="lab">{t('noBillsToday')}</p></div>
        : <div className="stack">{bills.map((b) => (
          <Tap key={b.id} className="rowb" style={{ opacity: b.status === 'saved' ? 1 : 0.5 }} onClick={() => navigate('/bill/' + b.id)}>
            <div className="grow" style={{ minWidth: 0 }}>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.customers?.name ?? t('walkIn')}</div>
              <div className="lab" style={{ fontSize: 17, fontWeight: 500, lineHeight: '22px' }}>{time(b.created_at)} · {b.bill_lines.length} {t('itemsWord')}{b.status !== 'saved' ? ' · ' + t('removedWord') : ''}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="num" style={{ textDecoration: b.status === 'saved' ? 'none' : 'line-through' }}>{rupees(b.total)}</div>
              <span className={`pill pay-${b.pay}`}>{t(b.pay as Key)}</span>
            </div>
          </Tap>
        ))}</div>}
    </main>
  )
}

export function BillDetail({ id }: { id: string }) {
  const { t, lang } = useT()
  const [b, setB] = useState<BillRow | null | undefined>(undefined)
  const load = () => supabase.from('bills').select('id,total,pay,status,created_at,share_token,customers(name),bill_lines(name,qty,unit,price,amount)').eq('id', id).maybeSingle()
    .then(({ data }) => setB(data as unknown as BillRow | null))
  useEffect(() => { load() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (b === undefined) return <main className="screen has-bar"><BackBar fallback="/bill" /><div className="skel" style={{ height: 200 }} /></main>
  if (!b) return <main className="screen has-bar"><BackBar fallback="/bill" /><p>{t('notUnderstood')}</p></main>
  const link = `${location.origin}/b/${b.share_token}`
  const wa = `https://wa.me/?text=${encodeURIComponent(`${lang === 'en' ? 'Your bill' : 'Aapka bill'} ${rupees(b.total)}\n${link}`)}`
  async function remove() {
    const { error } = await supabase.rpc('undo_bill', { p_bill: b!.id })
    if (error) { errorFx(); toast({ text: t('saveFailed') }); return }
    successFx(); invalidateShop(); toast({ text: t('billRemoved') }); load()
  }
  return (
    <main className="screen has-bar">
      <BackBar fallback="/bill" />
      <h1 className="h1">{b.customers?.name ?? t('walkIn')}</h1>
      <p className="lab">{time(b.created_at)} · {t(b.pay as Key)}{b.status !== 'saved' ? ' · ' + t('removedWord') : ''}</p>
      <div className="card" style={{ marginTop: 16, padding: '12px 20px' }}>
        {b.bill_lines.map((l, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderTop: i ? '1px solid var(--line)' : 'none' }}>
            <div><b>{l.name}</b><div className="lab" style={{ fontSize: 17 }}>{+Number(l.qty).toFixed(3)} {units[l.unit] ?? ''} × ₹{+Number(l.price).toFixed(2)}</div></div>
            <div className="num" style={{ fontSize: 20 }}>{rupees(l.amount)}</div>
          </div>
        ))}
        <div className="divider" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><span className="h2">{t('total')}</span><span className="big" style={{ fontSize: 38 }}>{rupees(b.total)}</span></div>
      </div>
      {b.status === 'saved' && <>
        <a className="wa tap" href={wa} target="_blank" rel="noreferrer" style={{ color: '#137A3C', boxShadow: 'inset 0 0 0 2px #1FA855', textDecoration: 'none' }}><Icon name="wa" size={26} />{t('sendWaWalkIn')}</a>
        <div className="undorow" style={{ marginTop: 32 }}><span className="lab">{t('mistake')}</span>
          <Tap className="undo" style={{ height: 56, padding: '0 22px', background: '#fff', boxShadow: 'inset 0 0 0 2px #8A7A66' }} onClick={remove}>{t('removeBill')}</Tap></div>
      </>}
    </main>
  )
}
