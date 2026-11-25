import { useEffect, useState } from 'react'
import { useT, rupees } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { navigate } from '../lib/router'
import { invalidateShop } from '../lib/shop'
import { errorFx, successFx } from '../lib/feedback'
import { askText, BackBar, Tap, toast } from '../components/ui'
import { Icon } from '../components/Icon'
import { BillCard, billMessage, itemName } from '../components/BillCard'
import { useStore } from '../lib/store'

type BillRow = { id: string; total: number; pay: 'cash' | 'upi' | 'udhaar'; status: string; created_at: string; share_token: string; customers: { id: string; name: string; phone: string | null } | null; order_id?: string | null; bill_lines: { name: string; variant?: string | null; variant_hi?: string | null; qty: number; unit: string; price: number; amount: number; items: { catalog_id: string | null; name_hi: string | null } | null }[]; subtotal: number; discount: number }
const clock = (s: string) => new Date(s).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: false })

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
  const payLabel = (p: BillRow['pay']) => p === 'udhaar' ? t('udhaar') : p === 'upi' ? 'UPI' : 'Cash'
  return (
    <main className="screen has-bar pg">
      <div className="top" />
      <h1 className="h1">{t('tabBill')}</h1>
      <div className="pg-acts">
        <Tap className="btn vo" onClick={() => navigate('/bolo')}><Icon name="mic" size={26} />{t('billByVoice')}</Tap>
        <Tap className="btn outline" onClick={() => navigate('/bolo?manual=1')}><Icon name="bill" size={24} />{t('billByPick')}</Tap>
      </div>
      <div className="hm-sec">
        <h2>{t('todayBills')}</h2>
        {bills && live.length > 0 && <span className="n">{live.length} · {rupees(total)}</span>}
      </div>
      {!bills ? <div className="stack"><div className="skel" style={{ height: 72 }} /><div className="skel" style={{ height: 72 }} /></div>
        : bills.length === 0 ? <p className="pg-empty">{t('noBillsToday')}</p>
        : bills.map((b) => (
          <Tap key={b.id} className={`hrow ${b.status === 'saved' ? '' : 'off'}`} onClick={() => navigate('/bill/' + b.id)}>
            <span className="tm">{clock(b.created_at)}</span>
            <div className="g"><b>{b.customers?.name ?? t('walkIn')}</b><span>{b.status !== 'saved' ? t('removedWord') : b.bill_lines.map((l) => l.name).slice(0, 3).join(', ')}</span></div>
            <div className="a">{rupees(b.total)}<small className={b.pay === 'udhaar' ? 'ud' : ''}>{payLabel(b.pay)}</small></div>
          </Tap>
        ))}
    </main>
  )
}

export function BillDetail({ id }: { id: string }) {
  const { t, lang } = useT()
  const { store } = useStore()
  const [b, setB] = useState<BillRow | null | undefined>(undefined)
  // variant columns come with migration 0012; until it is applied, fall back to the old column list so bills still open
  const sel = (v: boolean) => `id,total,subtotal,discount,pay,status,created_at,share_token,order_id,customers(id,name,phone),bill_lines(name,${v ? 'variant,variant_hi,' : ''}qty,unit,price,amount,items(catalog_id,name_hi))`
  const load = () => supabase.from('bills').select(sel(true)).eq('id', id).maybeSingle()
    .then((r) => r.error ? supabase.from('bills').select(sel(false)).eq('id', id).maybeSingle() : r)
    .then(({ data }) => setB(data as unknown as BillRow | null))
  useEffect(() => { load() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (b === undefined) return <main className="screen has-bar"><BackBar fallback="/bill" /><div className="skel" style={{ height: 200 }} /></main>
  if (!b) return <main className="screen has-bar"><BackBar fallback="/bill" /><p>{t('notUnderstood')}</p></main>
  const link = `${location.origin}/b/${b.share_token}`
  const ph = (b.customers?.phone ?? '').replace(/\D/g, '')
  const wa = `https://wa.me/${ph ? (ph.length === 10 ? '91' + ph : ph) : ''}?text=${encodeURIComponent(billMessage('', lang, b.total, b.bill_lines.map((l) => ({ name: itemName({ ...l, catalog_id: l.items?.catalog_id ?? null, name_hi: l.items?.name_hi ?? null, amount: Number(l.amount) }, lang), qty: l.qty, amount: Number(l.amount) })), link))}`
  async function remove() {
    const { error } = await supabase.rpc('undo_bill', { p_bill: b!.id })
    if (error) { errorFx(); toast({ text: t('saveFailed') }); return }
    successFx(); invalidateShop(); toast({ text: b!.order_id ? t('orderBackReady') : t('billRemoved'), action: b!.order_id ? { label: t('rowOrders'), run: () => navigate('/orders/' + b!.order_id) } : undefined }); load()
  }
  return (
    <main className="screen has-bar pg">
      <BackBar fallback="/bill" />
      <BillCard lang={lang} brand={false} b={{ store: store?.name ?? '', customer: b.customers?.name ?? null, pay: b.pay, subtotal: Number(b.subtotal), discount: Number(b.discount), total: Number(b.total),
        status: b.status, at: b.created_at, no: b.share_token.slice(0, 6).toUpperCase(),
        lines: b.bill_lines.map((l) => ({ ...l, catalog_id: l.items?.catalog_id ?? null, name_hi: l.items?.name_hi ?? null })) }} />
      {b.customers && <Tap className="pg-link" onClick={async () => { const p = await askText({ title: t('phoneOpt'), initial: b.customers!.phone ?? '' }) ?? ''; const d = p.replace(/\D/g, ''); if (!d) return; const { error } = await supabase.from('customers').update({ phone: d }).eq('id', b.customers!.id); if (error) { errorFx(); return } successFx(); load() }}>
        <Icon name="phone" size={22} />{b.customers.phone ?? t('addPhone')}</Tap>}
      {b.status === 'saved' && <div className="pg-acts">
        <a className="btn outline tap" href={wa} target="_blank" rel="noreferrer"><Icon name="wa" size={26} />{t('sendWaWalkIn')}</a>
        <Tap className="btn outline" onClick={remove}><Icon name="undo" size={22} />{t('removeBill')}</Tap>
      </div>}
    </main>
  )
}
