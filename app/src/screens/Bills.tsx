import { useEffect, useState } from 'react'
import { useT, rupees, type Key } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { navigate } from '../lib/router'
import { invalidateShop } from '../lib/shop'
import { errorFx, successFx } from '../lib/feedback'
import { askText, BackBar, Tap, toast } from '../components/ui'
import { Icon } from '../components/Icon'
import { BillCard } from '../components/BillCard'
import { useStore } from '../lib/store'

type BillRow = { id: string; total: number; pay: 'cash' | 'upi' | 'udhaar'; status: string; created_at: string; share_token: string; customers: { id: string; name: string; phone: string | null } | null; bill_lines: { name: string; qty: number; unit: string; price: number; amount: number; items: { catalog_id: string | null; name_hi: string | null } | null }[]; subtotal: number; discount: number }
const time = (s: string) => new Date(s).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })

// Bill tab: make a bill (voice or by choosing items) + today's bills.
export function Bills() {
  const { t } = useT()
  const [bills, setBills] = useState<BillRow[] | null>(null)
  useEffect(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0)
    supabase.from('bills').select('id,total,subtotal,discount,pay,status,created_at,share_token,customers(name),bill_lines(name,qty,unit,price,amount,items(catalog_id,name_hi))')
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
  const { store } = useStore()
  const [b, setB] = useState<BillRow | null | undefined>(undefined)
  const load = () => supabase.from('bills').select('id,total,subtotal,discount,pay,status,created_at,share_token,customers(id,name,phone),bill_lines(name,qty,unit,price,amount,items(catalog_id,name_hi))').eq('id', id).maybeSingle()
    .then(({ data }) => setB(data as unknown as BillRow | null))
  useEffect(() => { load() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (b === undefined) return <main className="screen has-bar"><BackBar fallback="/bill" /><div className="skel" style={{ height: 200 }} /></main>
  if (!b) return <main className="screen has-bar"><BackBar fallback="/bill" /><p>{t('notUnderstood')}</p></main>
  const link = `${location.origin}/b/${b.share_token}`
  const ph = (b.customers?.phone ?? '').replace(/\D/g, '')
  const wa = `https://wa.me/${ph ? (ph.length === 10 ? '91' + ph : ph) : ''}?text=${encodeURIComponent(`${lang === 'en' ? 'Your bill' : 'Aapka bill'} ${rupees(b.total)}\n${link}`)}`
  async function remove() {
    const { error } = await supabase.rpc('undo_bill', { p_bill: b!.id })
    if (error) { errorFx(); toast({ text: t('saveFailed') }); return }
    successFx(); invalidateShop(); toast({ text: t('billRemoved') }); load()
  }
  return (
    <main className="screen has-bar">
      <BackBar fallback="/bill" />
      <BillCard lang={lang} brand={false} b={{ store: store?.name ?? '', customer: b.customers?.name ?? null, pay: b.pay, subtotal: Number(b.subtotal), discount: Number(b.discount), total: Number(b.total),
        status: b.status, at: b.created_at, no: b.share_token.slice(0, 6).toUpperCase(),
        lines: b.bill_lines.map((l) => ({ ...l, catalog_id: l.items?.catalog_id ?? null, name_hi: l.items?.name_hi ?? null })) }} />
      {b.customers && <Tap className="linkrow" style={{ marginTop: 12 }} onClick={async () => { const p = await askText({ title: t('phoneOpt'), initial: b.customers!.phone ?? '' }) ?? ''; const d = p.replace(/\D/g, ''); if (!d) return; const { error } = await supabase.from('customers').update({ phone: d }).eq('id', b.customers!.id); if (error) { errorFx(); return } successFx(); load() }}>
        <span>📞 {b.customers.phone ?? t('addPhone')}</span><span>{t('change')} ›</span></Tap>}
      {b.status === 'saved' && <>
        <a className="wa tap" href={wa} target="_blank" rel="noreferrer" style={{ color: '#137A3C', boxShadow: 'inset 0 0 0 2px #1FA855', textDecoration: 'none' }}><Icon name="wa" size={26} />{t('sendWaWalkIn')}</a>
        <div className="undorow" style={{ marginTop: 32 }}><span className="lab">{t('mistake')}</span>
          <Tap className="undo" style={{ height: 56, padding: '0 22px', background: '#fff', boxShadow: 'inset 0 0 0 2px #8A7A66' }} onClick={remove}>{t('removeBill')}</Tap></div>
      </>}
    </main>
  )
}
