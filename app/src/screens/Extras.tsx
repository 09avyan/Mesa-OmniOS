import { useEffect, useState } from 'react'
import { useT, rupees, type Key } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { HomeBtn, LoadError, Tap, toast, TopBar } from '../components/ui'
import { Icon } from '../components/Icon'
import { successFx, errorFx } from '../lib/feedback'

// ---------- Apne thaile (own-branded carry bags shop) ----------
type BagProduct = { id: string; name: string; name_hi: string | null; kind: 'compostable' | 'cloth' | 'paper'; size: string | null; pack_qty: number; price: number }
type BagOrder = { id: string; status: string; total: number; created_at: string; lines: { name: string; qty: number; pack_qty: number; price: number }[] }
// the pack size is shown on its own line, so drop "(pack of 100)" from the name
const plain = (n: string) => n.replace(/\s*\([^)]*\)\s*$/, '')
const RowSk = () => <div className="vc">{[0, 1, 2].map((k) => <div key={k} className="vpick"><i className="vsk" style={{ width: 170, height: 22 }} /><i className="vsk" style={{ width: 120, height: 48 }} /></div>)}</div>

export function Bags() {
  const { t, lang } = useT()
  const [prods, setProds] = useState<BagProduct[] | null>(null)
  const [orders, setOrders] = useState<BagOrder[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [qty, setQty] = useState<Record<string, number>>({})
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [placed, setPlaced] = useState(false)
  const loadOrders = () => supabase.rpc('my_bag_orders').then(({ data }) => setOrders(((data as BagOrder[]) ?? []).map((o) => ({ ...o, total: Number(o.total) }))))
  const load = () => {
    setFailed(false)
    supabase.rpc('list_bag_products').then(({ data, error }) => { if (error) setFailed(true); else setProds(((data as BagProduct[]) ?? []).map((p) => ({ ...p, price: Number(p.price) }))) }, () => setFailed(true))
    loadOrders()
  }
  useEffect(load, [])
  const when = (iso: string) => new Date(iso).toLocaleDateString(lang === 'en' ? 'en-IN' : 'hi-IN', { day: 'numeric', month: 'short' })
  const nm = (p: { name: string; name_hi?: string | null }) => plain(lang === 'hi' ? p.name_hi || p.name : p.name)
  const total = (prods ?? []).reduce((s, p) => s + (qty[p.id] ?? 0) * p.price, 0)
  const step = (id: string, d: number) => { setPlaced(false); setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(99, (q[id] ?? 0) + d)) })) }
  async function place() {
    setBusy(true)
    const lines = (prods ?? []).filter((p) => (qty[p.id] ?? 0) > 0).map((p) => ({ product_id: p.id, qty: qty[p.id] }))
    const { error } = await supabase.rpc('place_bag_order', { p: { lines, address: address.trim() || undefined, note: note.trim() || undefined } })
    setBusy(false)
    if (error) { errorFx(); toast({ text: t('offline') }); return }
    successFx(); setQty({}); setNote(''); setPlaced(true); loadOrders(); window.scrollTo({ top: 0 })
  }
  async function cancel(id: string) {
    const { error } = await supabase.rpc('cancel_bag_order', { p_id: id })
    if (error) { errorFx(); toast({ text: t('offline') }); loadOrders(); return }
    successFx(); toast({ text: t('bagsCancelDone') }); loadOrders()
  }
  return (
    <main className="screen v2 has-foot">
      <TopBar back="/settings" title={t('rowBags')} />
      {failed ? <LoadError onRetry={() => { setProds(null); load() }} /> : <>
        {placed && <div className="vcenter" style={{ margin: '8px 0 16px' }}><span className="vdone"><Icon name="tick" size={44} stroke={3} /></span><h2 className="vfig" style={{ marginTop: 12 }}>{t('bagsPlaced')}</h2></div>}
        <p className="vlab" style={{ margin: '0 4px 12px' }}>{t('bagsBrand')}</p>
        {!prods ? <RowSk /> : <div className="vc">{prods.map((p) => (
          <div key={p.id} className="vpick">
            <span className="n">{nm(p)}{p.size ? ` · ${p.size}` : ''}</span>
            <span className="vchip">{p.pack_qty} {t('bagsWord')}</span>
            <span className="p"><b className="vfig" style={{ color: 'var(--ink)' }}>{rupees(p.price)}</b> {t('bagsPer')}</span>
            <div className="vqty" style={{ gridColumn: '1/-1', justifySelf: 'start' }}>
              <Tap aria-label="−" disabled={!(qty[p.id] > 0)} onClick={() => step(p.id, -1)}><Icon name="minus" size={22} /></Tap>
              <b>{qty[p.id] ?? 0}</b>
              <Tap aria-label="+" onClick={() => step(p.id, 1)}><Icon name="plus" size={22} /></Tap>
            </div>
          </div>))}</div>}
        {prods && prods.length > 0 && <div className="vstack" style={{ marginTop: 12 }}>
          <input className="vin" placeholder={t('bagsAddr')} value={address} onChange={(e) => setAddress(e.target.value)} />
          <input className="vin" placeholder={t('bagsNoteIn')} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>}
        {orders && orders.length > 0 && <>
          <div className="vhead"><span className="vlab">{t('bagsMine')}</span></div>
          <div className="vstack">{orders.map((o) => (
            <div key={o.id} className="vc vblock">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <span className="vlab">{when(o.created_at)}</span>
                <span className={`vchip ${o.status === 'delivered' ? 'ok' : ''}`}>{t(('bs_' + o.status) as Key)}</span>
              </div>
              {o.lines.map((l, i) => <p key={i} style={{ marginTop: 8 }}>{plain(l.name)} × {l.qty}</p>)}
              <b className="vfig" style={{ display: 'block', marginTop: 8 }}>{rupees(o.total)}</b>
              {o.status === 'new' && <Tap className="btn outline s" style={{ marginTop: 12 }} onClick={() => cancel(o.id)}><Icon name="x" size={22} />{t('bagsCancel')}</Tap>}
            </div>))}</div>
        </>}
      </>}
      {!failed && <div className="vfoot flat">
        {placed && total === 0 ? <HomeBtn className="primary" /> : <>
          <div className="vgrid2" style={{ gridTemplateColumns: 'auto 1fr', alignItems: 'center' }}>
            <div><span className="vlab">{t('total')}</span><b className="vfig" style={{ display: 'block' }}>{rupees(total)}</b></div>
            <Tap className="btn primary" disabled={busy || total === 0} onClick={place}><Icon name="bag" size={24} />{busy ? t('loading') : t('bagsPlace')}</Tap>
          </div>
        </>}
      </div>}
    </main>
  )
}

// ---------- Niyam aur shartein ----------
const TERMS: Key[][] = [['tUseH', 'tUseB'], ['tDataH', 'tDataB'], ['tShareH', 'tShareB'], ['tMoneyH', 'tMoneyB'], ['tSafeH', 'tSafeB'], ['tEndH', 'tEndB'], ['tOrdersH', 'tOrdersB'], ['tVoiceH', 'tVoiceB'], ['tBillsH', 'tBillsB'], ['tCustomersH', 'tCustomersB'], ['tOfflineH', 'tOfflineB'], ['tFairH', 'tFairB'], ['tLiabH', 'tLiabB'], ['tLawH', 'tLawB']]
export function Terms() {
  const { t } = useT()
  return (
    <main className="screen v2 has-bar">
      <TopBar back="/settings" title={t('terms')} />
      <p className="vlab" style={{ margin: '0 4px 12px' }}>{t('tIntro')}</p>
      <div className="vc">
        {TERMS.map(([h, b]) => <div key={h} className="vblock"><h2 style={{ font: '700 20px/28px var(--font)' }}>{t(h)}</h2><p style={{ marginTop: 4, color: 'var(--ink2)' }}>{t(b)}</p></div>)}
      </div>
      <p className="vlab" style={{ margin: '16px 4px 0' }}>{t('tUpdated')}</p>
    </main>
  )
}

// ---------- Jaldi aa raha hai (Phase 2 + 3) ----------
const SOON: { id: string; icon: string; phase: 2 | 3; h: Key; b: Key }[] = [
  { id: 'ai-udhaar', icon: 'wa', phase: 2, h: 'sAiUdhaarH', b: 'sAiUdhaarB' },
  { id: 'ai-orders', icon: 'cart', phase: 2, h: 'sAiOrdersH', b: 'sAiOrdersB' },
  { id: 'ai-promo', icon: 'chart', phase: 2, h: 'sPromoH', b: 'sPromoB' },
  { id: 'khata-photo', icon: 'book', phase: 2, h: 'sKhataH', b: 'sKhataB' },
  { id: 'offline', icon: 'globe', phase: 2, h: 'sOfflineH', b: 'sOfflineB' },
  { id: 'loan', icon: 'cash', phase: 2, h: 'sLoanH', b: 'sLoanB' },
  { id: 'profit', icon: 'chart', phase: 2, h: 'sProfitH', b: 'sProfitB' },
  { id: 'delivery', icon: 'bag', phase: 3, h: 'sDeliveryH', b: 'sDeliveryB' },
  { id: 'cust-credit', icon: 'book', phase: 3, h: 'sCredH', b: 'sCredB' },
  { id: 'trends', icon: 'chart', phase: 3, h: 'sTrendsH', b: 'sTrendsB' },
]
export function Soon() {
  const { t } = useT()
  const [want, setWant] = useState<Set<string> | null>(null)
  const [failed, setFailed] = useState(false)
  const load = () => { setFailed(false); supabase.from('feature_interest').select('feature').then(({ data, error }) => { if (error) setFailed(true); else setWant(new Set((data ?? []).map((r) => r.feature as string))) }, () => setFailed(true)) }
  useEffect(load, [])
  async function ask(id: string) {
    const prev = want ?? new Set<string>()
    setWant(new Set([...prev, id])); successFx()
    const { error } = await supabase.rpc('want_feature', { p_feature: id })
    if (error) { const w = new Set(prev); w.delete(id); setWant(w); toast({ text: t('offline') }) } else toast({ text: t('soonNoted') })
  }
  return (
    <main className="screen v2 has-bar">
      <TopBar back="/settings" title={t('rowSoon')} />
      {failed ? <LoadError onRetry={() => { setWant(null); load() }} /> : !want ? <div className="vstack"><i className="vsk" style={{ height: 140, borderRadius: 18 }} /><i className="vsk" style={{ height: 140, borderRadius: 18 }} /></div>
        : ([2, 3] as const).map((p) => <div key={p}>
          <div className="vhead"><span className="vlab">{t(p === 2 ? 'soonP2' : 'soonP3')}</span></div>
          <div className="vc">{SOON.filter((s) => s.phase === p).map((s) => (
            <div key={s.id} className="vblock">
              <h2 style={{ font: '700 20px/28px var(--font)' }}>{t(s.h)}</h2>
              <p style={{ marginTop: 4, color: 'var(--ink2)' }}>{t(s.b)}</p>
              {want.has(s.id)
                ? <span className="vchip ok" style={{ marginTop: 12 }}><Icon name="tick" size={20} stroke={3} />{t('soonWanted')}</span>
                : <Tap className="btn outline s" style={{ marginTop: 12 }} onClick={() => ask(s.id)}><Icon name={s.icon} size={22} />{t('soonWant')}</Tap>}
            </div>
          ))}</div>
        </div>)}
    </main>
  )
}
