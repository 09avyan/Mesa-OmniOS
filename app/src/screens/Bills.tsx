import { useEffect, useState } from 'react'
import { useT, rupees } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { navigate } from '../lib/router'
import { invalidateShop } from '../lib/shop'
import { errorFx, successFx } from '../lib/feedback'
import { askText, HomeBtn, LoadError, Tap, toast, TopBar } from '../components/ui'
import { canUndo } from '../lib/prefs'
import { Icon } from '../components/Icon'
import { billMessage, itemName } from '../components/BillCard'

type BillRow = { id: string; total: number; pay: 'cash' | 'upi' | 'udhaar'; status: string; created_at: string; share_token: string; customers: { id: string; name: string; phone: string | null } | null; order_id?: string | null; bill_lines: { name: string; variant?: string | null; variant_hi?: string | null; qty: number; unit: string; price: number; amount: number; items: { catalog_id: string | null; name_hi: string | null } | null }[]; subtotal: number; discount: number }
const clock = (s: string) => new Date(s).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: false })

const initials = (n: string) => n.trim().slice(0, 2).toUpperCase()
const ArtBills = () => (
  <svg width="120" height="104" viewBox="0 0 120 104" fill="none" stroke="var(--ink3)" strokeOpacity=".55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M28 8h64v88l-10-6-11 6-11-6-11 6-11-6-10 6z" fill="var(--s)" /><path d="M42 30h36M42 44h36M42 58h20" strokeDasharray="1 7" strokeWidth="3" /><path d="M78 58h0" stroke="var(--vt)" strokeOpacity="1" strokeWidth="6" />
  </svg>
)

// Bills tab: today's bills. Making a bill is the Bolo bar (or the + for choosing items by hand).
export function Bills() {
  const { t } = useT()
  const [bills, setBills] = useState<BillRow[] | null>(null)
  const [failed, setFailed] = useState(false)
  const load = () => {
    setFailed(false); setBills(null)
    const start = new Date(); start.setHours(0, 0, 0, 0)
    supabase.from('bills').select('id,total,subtotal,discount,pay,status,created_at,share_token,customers(name),bill_lines(name,qty,unit,price,amount,items(catalog_id,name_hi))')
      .gte('created_at', start.toISOString()).order('created_at', { ascending: false }).limit(100)
      .then(({ data, error }) => { if (error) setFailed(true); else setBills((data ?? []) as unknown as BillRow[]) }, () => setFailed(true))
  }
  useEffect(load, [])
  const live = (bills ?? []).filter((b) => b.status === 'saved')
  const total = live.reduce((s, b) => s + Number(b.total), 0)
  const payLabel = (p: BillRow['pay']) => p === 'udhaar' ? t('udhaar') : p === 'upi' ? 'UPI' : 'Cash'
  return (
    <main className="screen v2 has-bar">
      <TopBar title={t('tabBill')} right={<Tap className="ib b" aria-label={t('billByPick')} onClick={() => navigate('/bolo?manual=1')}><Icon name="plus" size={24} /></Tap>} />
      {failed ? <LoadError onRetry={load} />
        : !bills ? <div className="vstack"><i className="vsk" style={{ height: 24, width: 160 }} /><div className="vc">{[0, 1, 2].map((k) => <div key={k} className="vrow"><i className="vsk" style={{ width: 44, height: 44, borderRadius: 22 }} /><span className="t"><i className="vsk" style={{ width: 140, height: 20 }} /><i className="vsk" style={{ width: 96, height: 18, marginTop: 6 }} /></span></div>)}</div></div>
        : bills.length === 0 ? (
          <div className="vempty">
            <ArtBills />
            <h2>{t('billsEmptyH')}</h2>
            <p>{t('billsEmptyP')}</p>
            <span className="vsay"><Icon name="mic" size={22} />{t('sayEg')}</span>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '16px 4px 8px' }}>
              <span className="vlab">{live.length} {t('billsWord')}</span><b className="vfig">{rupees(total)}</b>
            </div>
            <div className="vc">
              {bills.map((b) => (
                <Tap key={b.id} className="vrow" style={b.status === 'saved' ? undefined : { opacity: .55 }} onClick={() => navigate('/bill/' + b.id)}>
                  <span className="vav">{b.customers?.name ? initials(b.customers.name) : '—'}</span>
                  <span className="t"><b>{b.customers?.name ?? t('walkInShort')}</b><span>{clock(b.created_at)} · {b.status !== 'saved' ? t('removedWord') : payLabel(b.pay)}</span></span>
                  <span className={`a ${b.pay === 'udhaar' ? 'ud' : ''}`} style={b.status === 'saved' ? undefined : { textDecoration: 'line-through' }}>{rupees(b.total)}</span>
                </Tap>
              ))}
            </div>
          </>
        )}
    </main>
  )
}

export function BillDetail({ id }: { id: string }) {
  const { t, lang } = useT()
  const [b, setB] = useState<BillRow | null | undefined>(undefined)
  const [failed, setFailed] = useState(false)
  // variant columns come with migration 0012; until it is applied, fall back to the old column list so bills still open
  const sel = (v: boolean) => `id,total,subtotal,discount,pay,status,created_at,share_token,order_id,customers(id,name,phone),bill_lines(name,${v ? 'variant,variant_hi,' : ''}qty,unit,price,amount,items(catalog_id,name_hi))`
  const load = () => { setFailed(false); return supabase.from('bills').select(sel(true)).eq('id', id).maybeSingle()
    .then((r) => r.error ? supabase.from('bills').select(sel(false)).eq('id', id).maybeSingle() : r)
    .then(({ data, error }) => { if (error) setFailed(true); else setB(data as unknown as BillRow | null) }, () => setFailed(true)) }
  useEffect(() => { load() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (failed) return <main className="screen v2 has-bar"><TopBar back="/bill" /><LoadError onRetry={() => { setB(undefined); load() }} /></main>
  if (b === undefined) return <main className="screen v2 has-bar"><TopBar back="/bill" /><i className="vsk" style={{ height: 200, borderRadius: 18 }} /></main>
  if (!b) return <main className="screen v2 has-bar"><TopBar back="/bill" /><p>{t('notUnderstood')}</p><div className="gap16" /><HomeBtn /></main>
  const link = `${location.origin}/b/${b.share_token}`
  const ph = (b.customers?.phone ?? '').replace(/\D/g, '')
  const lines = b.bill_lines.map((l) => ({ ...l, catalog_id: l.items?.catalog_id ?? null, name_hi: l.items?.name_hi ?? null, amount: Number(l.amount) }))
  const wa = `https://wa.me/${ph ? (ph.length === 10 ? '91' + ph : ph) : ''}?text=${encodeURIComponent(billMessage('', lang, b.total, lines.map((l) => ({ name: itemName(l, lang), qty: l.qty, amount: l.amount })), link))}`
  const removed = b.status !== 'saved'
  const undoOk = !removed && canUndo(b.created_at)
  const d = new Date(b.created_at)
  const when = `${d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' })}, ${clock(b.created_at)}`
  async function remove() {
    if (!canUndo(b!.created_at)) { toast({ text: t('undoGone') }); load(); return }
    const { error } = await supabase.rpc('undo_bill', { p_bill: b!.id })
    if (error) { errorFx(); toast({ text: t('saveFailed') }); return }
    successFx(); invalidateShop(); toast({ text: b!.order_id ? t('orderBackReady') : t('billRemoved'), action: b!.order_id ? { label: t('rowOrders'), run: () => navigate('/orders/' + b!.order_id) } : undefined }); load()
  }
  return (
    <main className="screen v2 has-foot2">
      <TopBar back="/bill" title={`${t('billWord')} #${b.share_token.slice(0, 4).toUpperCase()}`} />
      <div className="vc" style={{ padding: 20, opacity: removed ? .7 : 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ minWidth: 0 }}><div className="h2">{b.customers?.name ?? t('walkInShort')}</div><div className="vlab">{when}</div></div>
          <span className={`vchip ${b.pay === 'udhaar' ? 'ud' : ''}`}>{removed ? t('removedWord') : b.pay === 'udhaar' ? t('udhaar') : b.pay === 'upi' ? 'UPI' : 'Cash'}</span>
        </div>
        <div className="vbig" style={{ marginTop: 12, textDecoration: removed ? 'line-through' : undefined }}>{rupees(Number(b.total))}</div>
      </div>
      <div className="vc" style={{ marginTop: 12 }}>
        {lines.map((l, i) => (
          <div key={i} className="vrow" style={{ minHeight: 64 }}><span className="t"><b>{itemName(l, lang)}</b><span>{+Number(l.qty).toFixed(3)} × ₹{+Number(l.price).toFixed(2)}</span></span><span className="a">{rupees(l.amount)}</span></div>
        ))}
        {Number(b.discount) > 0 && <div className="vrow" style={{ minHeight: 56 }}><span className="t"><b style={{ fontWeight: 600 }}>{t('discount')}</b></span><span className="a">− {rupees(Number(b.discount))}</span></div>}
        <div className="vrow" style={{ minHeight: 64 }}><span className="t"><b>{t('kulWord')}</b></span><span className="a vfig">{rupees(Number(b.total))}</span></div>
      </div>
      {b.customers && <Tap className="vrow vc" style={{ marginTop: 12, minHeight: 64 }} onClick={async () => { const p = await askText({ title: t('phoneOpt'), initial: b.customers!.phone ?? '' }) ?? ''; const dg = p.replace(/\D/g, ''); if (!dg) return; const { error } = await supabase.from('customers').update({ phone: dg }).eq('id', b.customers!.id); if (error) { errorFx(); return } successFx(); load() }}>
        <Icon name="phone" size={22} /><span className="t"><b style={{ fontWeight: 600 }}>{b.customers.phone ?? t('addPhone')}</b></span></Tap>}
      {!removed && !undoOk && <p className="vlab" style={{ marginTop: 16 }}>{t('undoGone')}</p>}
      <div className="vfoot flat">
        {!removed && <a className="btn wa tap" style={{ textDecoration: 'none' }} href={wa} target="_blank" rel="noreferrer"><Icon name="send" size={22} />WhatsApp</a>}
        <div className="vgrid2">
          <HomeBtn />
          {undoOk ? <Tap className="btn outline s" onClick={remove}><Icon name="undo" size={22} />{t('removeBill')}</Tap> : <Tap className="btn outline s" onClick={() => navigate('/bill')}><Icon name="receipt" size={22} />{t('tabBill')}</Tap>}
        </div>
      </div>
    </main>
  )
}
