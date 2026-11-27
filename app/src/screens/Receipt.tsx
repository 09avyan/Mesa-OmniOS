import { useEffect, useRef, useState } from 'react'
import { useT, rupees } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { loadShop, invalidateShop, type Shop, type ShopMatchable } from '../lib/shop'
import { isSure, matchName } from '../voice/match'
import { searchItems } from '../voice/draft'
import { navigate } from '../lib/router'
import { askText, LoadError, Sheet, Tap, toast, TopBar } from '../components/ui'
import { NumberSheet } from '../components/Pad'
import { Icon } from '../components/Icon'
import { successFx, errorFx } from '../lib/feedback'

// Supplier parchi photo -> Gemini reads rows -> owner fixes unclear ones -> ✓ -> stock + supplier due.
// Works without AI too: if reading fails, the owner adds rows by typing.
type RLine = { key: string; said: string; match: ShopMatchable | null; cands: ShopMatchable[]; sure: boolean; qty: number | null; unit: string | null; rate: number | null; unclear: boolean }
type AiReceipt = { supplier: string | null; total: number | null; lines: { name: string; qty: number | null; unit: string | null; rate: number | null; amount: number | null; unclear: boolean }[] }
type Sup = { id: string; name: string; due: number }

let k = 0
function toLine(name: string, qty: number | null, unit: string | null, rate: number | null, unclear: boolean, shop: Shop): RLine {
  const said = name.toLowerCase().trim()
  const c = matchName(said, shop.index, 5)
  const cands = c.map((x) => shop.byMatchId.get(x.id)!).filter(Boolean)
  const sure = !unclear && isSure(said, c, shop.index)
  return { key: String(++k), said, match: cands[0] ?? null, cands, sure: sure && !!cands[0], qty, unit, rate, unclear }
}
const amt = (l: RLine) => (l.qty != null && l.rate != null ? Math.round(l.qty * l.rate * 100) / 100 : 0)

async function shrink(file: File): Promise<string> {
  const img = await createImageBitmap(file)
  const sc = Math.min(1, 1600 / Math.max(img.width, img.height))
  const c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc)
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', 0.82)
}

export function Receipt() {
  const { t, lang } = useT()
  const [shop, setShop] = useState<Shop | null>(null)
  const [phase, setPhase] = useState<'pick' | 'reading' | 'review'>('pick')
  const [photo, setPhoto] = useState<string | null>(null)
  const [aiFailed, setAiFailed] = useState(false)
  const [lines, setLines] = useState<RLine[]>([])
  const [supplier, setSupplier] = useState('')
  const [printed, setPrinted] = useState<number | null>(null)
  const [paid, setPaid] = useState(0)
  const [sups, setSups] = useState<Sup[]>([])
  const [pick, setPick] = useState<RLine | null>(null)
  const [num, setNum] = useState<{ line?: RLine; field: 'qty' | 'rate' | 'paid' } | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    loadShop().then(setShop)
    supabase.from('supplier_balances').select('id,name,due').order('last_at', { ascending: false, nullsFirst: false }).limit(8).then(({ data }) => setSups(((data ?? []) as Sup[]).map((s) => ({ ...s, due: +s.due }))))
  }, [])
  const nm = (m: ShopMatchable) => (lang === 'hi' ? m.hi : lang === 'en' ? m.en : m.hinglish)
  const set = (key: string, patch: Partial<RLine>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  const total = lines.reduce((s, l) => s + amt(l), 0)
  const pending = lines.find((l) => !l.match || !l.sure || l.qty == null || l.qty <= 0)

  async function onFile(f: File | undefined) {
    if (!f || !shop) return
    setPhase('reading'); setAiFailed(false)
    read(await shrink(f))
  }
  async function read(data: string) {
    if (!shop) return
    setPhase('reading'); setAiFailed(false); setPhoto(data)
    const { data: out, error } = await supabase.functions.invoke('understand', { body: { image: data.split(',')[1], mime: 'image/jpeg' } })
    const r = out as AiReceipt & { error?: string }
    if (error || !r || r.error || !Array.isArray(r.lines)) { setAiFailed(true); setLines([]); setPhase('review'); errorFx(); return }
    setLines(r.lines.map((l) => toLine(l.name, l.qty, l.unit, l.rate ?? (l.amount && l.qty ? l.amount / l.qty : null), l.unclear, shop)))
    if (r.supplier) setSupplier(r.supplier)
    setPrinted(r.total ?? null)
    setPhase('review'); successFx()
  }
  async function addLine() {
    if (!shop) return
    const v = (await askText({ title: t('rcAddAsk') }) ?? '').trim()
    if (!v) return
    const l = toLine(v, null, null, null, false, shop)
    setLines((ls) => [...ls, l]); if (!l.sure) setPick(l)
  }
  async function save() {
    setBusy(true)
    const p = {
      supplier: supplier.trim(), total, paid, photo: !!photo,
      lines: lines.map((l) => ({ item_id: l.match!.shop?.id ?? null, catalog_id: l.match!.id.startsWith('shop:') ? null : l.match!.id, name: l.match!.shop?.name ?? l.match!.hinglish, name_hi: l.match!.shop?.name_hi ?? l.match!.hi, unit: l.match!.shop?.unit ?? l.match!.unit, loose: l.match!.loose, said: l.said, qty: l.qty })),
    }
    const { error } = await supabase.rpc('save_receipt', { p })
    setBusy(false)
    if (error) { errorFx(); toast({ text: t('saveFailed') }); return }
    successFx(); invalidateShop(); toast({ text: t('rcSaved') }); navigate('/maal', true)
  }

  if (phase === 'pick') return (
    <main className="screen v2 has-foot">
      <TopBar back="/maal" title={t('rcTitle')} />
      <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      <div className="vempty"><Icon name="camera" size={56} /></div>
      <div className="vfoot flat">
        <Tap className="btn primary" disabled={!shop} onClick={() => fileRef.current?.click()}><Icon name="camera" size={26} />{t('rcTake')}</Tap>
        <Tap className="btn outline s" onClick={() => setPhase('review')}><Icon name="box" size={22} />{t('rcNoPhoto')}</Tap>
      </div>
    </main>
  )
  if (phase === 'reading') return (
    <main className="screen v2">
      <TopBar title={t('rcReading')} />
      {photo && <img src={photo} alt="" style={{ width: '100%', maxHeight: 360, objectFit: 'contain', borderRadius: 14, opacity: .7 }} />}
      <i className="vsk" style={{ height: 56, marginTop: 16 }} />
    </main>
  )
  return (
    <div className="app">
      <main className="screen v2 has-flow">
        <TopBar back="/maal" title={t('rcCheck')} />
        {aiFailed && <div className="vnote" style={{ marginBottom: 12 }}><b>{t('rcAiFail')}</b>{photo && <Tap className="btn outline s" onClick={() => read(photo)}>{t('tryAgain')}</Tap>}</div>}
        {photo && <details className="vc vblock" style={{ marginBottom: 12 }}><summary style={{ fontWeight: 700 }}>{t('rcSeePhoto')}</summary><img src={photo} alt="" style={{ width: '100%', borderRadius: 14, marginTop: 12 }} /></details>}
        <Tap className="vrow vc" style={{ minHeight: 64 }} onClick={async () => { const v = await askText({ title: t('rcSupplierAsk'), initial: supplier }); if (v != null) setSupplier(v.trim()) }}>
          <Icon name="truck" size={24} /><span className="t"><b>{supplier || <span style={{ color: 'var(--ink2)' }}>{t('rcSupplier')}</span>}</b></span><Icon name="chev" size={22} />
        </Tap>
        {!supplier && sups.length > 0 && <div className="vseg" style={{ marginBottom: 0 }}>{sups.map((s) => <button key={s.id} onClick={() => setSupplier(s.name)}>{s.name}</button>)}</div>}
        {lines.length > 0 && <div className="vc" style={{ marginTop: 12 }}>
          {lines.map((l) => (
            <div key={l.key} className={`vit ${l.match && l.sure ? '' : 'q'}`}>
              <Tap className="" style={{ textAlign: 'left', minHeight: 56, minWidth: 0 }} onClick={() => setPick(l)}>
                <b style={{ display: 'block', font: '700 20px/28px var(--font)' }}>{l.match && l.sure ? nm(l.match) : `${t('rcWhich')} "${l.said}"`}</b>
                {l.match && l.sure && l.said !== nm(l.match).toLowerCase() && <span style={{ display: 'block', color: 'var(--ink2)' }}>{t('rcOnParchi')}: {l.said}</span>}
              </Tap>
              <Tap className="ib" aria-label="remove" onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}><Icon name="x" size={22} /></Tap>
              <div className="flv" style={{ alignItems: 'center' }}>
                <Tap className="btn outline s" onClick={() => setNum({ line: l, field: 'qty' })}>{l.qty != null ? `${l.qty} ${l.match?.shop?.unit ?? l.match?.unit ?? l.unit ?? ''}` : t('rcQty')}</Tap>
                <Tap className="btn outline s" onClick={() => setNum({ line: l, field: 'rate' })}>{l.rate != null ? `@ ${rupees(l.rate)}` : t('rcRate')}</Tap>
                <b style={{ marginLeft: 'auto', font: '700 20px/28px var(--font)', fontVariantNumeric: 'tabular-nums' }}>{amt(l) ? rupees(amt(l)) : '—'}</b>
              </div>
            </div>
          ))}
        </div>}
        <Tap className="btn outline s" style={{ marginTop: 12 }} onClick={addLine}><Icon name="plus" size={22} stroke={2.6} />{t('rcAdd')}</Tap>
        {lines.length > 0 && supplier && <div className="vc" style={{ marginTop: 12 }}>
          <Tap className="vrow" onClick={() => setNum({ field: 'paid' })}><span className="t"><b>{t('rcPaid')}</b></span><span className="a">{rupees(paid)}</span><Icon name="chev" size={22} /></Tap>
          <div className="vrow"><span className="t"><b>{t('rcDue')}</b></span><span className="a ud">{rupees(Math.max(0, total - paid))}</span></div>
        </div>}
        {printed != null && lines.length > 0 && Math.abs(printed - total) > 1 && <p className="vlab" style={{ marginTop: 12 }}>{t('rcPrinted').replace('{x}', rupees(printed))}</p>}
      </main>
      <div className="fbar">
        <div className="sum"><small>{t('total')}</small><b>{rupees(total)}</b></div>
        {pending ? <Tap className="btn outline" onClick={() => (pending.match && pending.sure ? setNum({ line: pending, field: 'qty' }) : setPick(pending))}>{t('rcFixFirst')}</Tap>
          : <Tap className="btn primary" disabled={busy || !lines.length} onClick={save}><Icon name="tick" size={26} stroke={3} />{busy ? t('loading') : `${t('rcSave')} · ${lines.length}`}</Tap>}
      </div>
      <Sheet open={!!pick} onClose={() => setPick(null)}>
        {pick && <ItemPicker line={pick} shop={shop!} nm={nm} onPick={(m) => { set(pick.key, { match: m, sure: true }); setPick(null) }} />}
      </Sheet>
      <NumberSheet open={!!num} title={num?.field === 'qty' ? t('rcQty') : num?.field === 'rate' ? t('rcRate') : t('rcPaid')}
        initial={num?.field === 'paid' ? paid : num?.line ? (num.field === 'qty' ? num.line.qty : num.line.rate) : null}
        onClose={() => setNum(null)}
        onDone={(n) => { if (num?.field === 'paid') setPaid(Math.min(n, total)); else if (num?.line) set(num.line.key, { [num.field]: n }); setNum(null) }} />
    </div>
  )
}

function ItemPicker({ line, shop, nm, onPick }: { line: RLine; shop: Shop; nm: (m: ShopMatchable) => string; onPick: (m: ShopMatchable) => void }) {
  const { t } = useT()
  const [list, setList] = useState(line.cands)
  return <>
    <h2 className="vfig">{t('rcWhich')} "{line.said}"</h2>
    <div className="vc" style={{ marginTop: 16 }}>
      {list.map((m) => <Tap key={m.id} className="vrow" onClick={() => onPick(m)}><span className="t"><b>{nm(m)}</b></span>{m.shop && <span className="vchip">{t('rcInShop')}</span>}</Tap>)}
    </div>
    <Tap className="btn outline" style={{ marginTop: 16 }} onClick={async () => { const v = (await askText({ title: t('rcSearch') }) ?? '').trim(); if (v) setList(searchItems(v, shop, 8)) }}><Icon name="search" size={22} />{t('rcSearch')}</Tap>
  </>
}

// Supplier dues list (from Hisaab): who we owe, and "Paise diye".
export function Suppliers() {
  const { t } = useT()
  const [list, setList] = useState<Sup[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [payTo, setPayTo] = useState<Sup | null>(null)
  const load = () => { setFailed(false); supabase.from('supplier_balances').select('id,name,due').order('due', { ascending: false }).then(({ data, error }) => { if (error) setFailed(true); else setList(((data ?? []) as Sup[]).map((s) => ({ ...s, due: +s.due }))) }, () => setFailed(true)) }
  useEffect(() => { load() }, [])
  return (
    <main className="screen v2 has-bar">
      <TopBar back="/hisaab" title={t('supTitle')} />
      {failed ? <LoadError onRetry={() => { setList(null); load() }} /> : !list ? <div className="vc">{[0, 1, 2].map((k) => <div key={k} className="vrow"><i className="vsk" style={{ width: 150, height: 22 }} /></div>)}</div>
        : !list.length ? <div className="vempty"><h2>{t('supNone')}</h2></div> : (
        <div className="vc">{list.map((s) => (
          <div key={s.id} className="vrow">
            <span className="t"><b>{s.name}</b><span>{s.due > 0 ? t('rcDue') : t('supClear')}</span></span>
            <span className={`a ${s.due > 0 ? 'ud' : ''}`}>{rupees(s.due)}</span>
            {s.due > 0 && <Tap className="btn outline s" onClick={() => setPayTo(s)}><Icon name="cash" size={22} />{t('supPay')}</Tap>}
          </div>
        ))}</div>
      )}
      <Tap className="btn outline" style={{ marginTop: 16 }} onClick={() => navigate('/receipt')}><Icon name="camera" size={24} />{t('rcTitle')}</Tap>
      <NumberSheet open={!!payTo} title={`${payTo?.name ?? ''} — ${t('supPay')}`} initial={null} onClose={() => setPayTo(null)} onDone={async (n) => {
        const s = payTo!; setPayTo(null)
        const { error } = await supabase.rpc('pay_supplier', { p_supplier: s.id, p_amount: n })
        if (error) { errorFx(); toast({ text: t('saveFailed') }); return }
        successFx(); toast({ text: t('saved') }); load()
      }} />
    </main>
  )
}

type RItem = { name: string; name_hi?: string | null; unit?: string | null; qty?: number | null }
type Rcpt = { id: number; items: RItem[] | null; amount: number; lines: number | null; note: string | null; created_at: string; suppliers: { name: string } | null }
/** Every scanned / saved supplier receipt, newest first. */
export function AllReceipts() {
  const { t, lang } = useT()
  const [list, setList] = useState<Rcpt[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState<number | null>(null)
  const load = () => { setFailed(false); supabase.from('supplier_entries').select('id,amount,lines,note,items,created_at,suppliers(name)').eq('kind', 'receipt').order('created_at', { ascending: false }).limit(200)
    .then(({ data, error }) => { if (error) setFailed(true); else setList(((data ?? []) as unknown as Rcpt[]).map((r) => ({ ...r, amount: +r.amount }))) }, () => setFailed(true)) }
  useEffect(() => { load() }, [])
  return (
    <main className="screen v2 has-bar">
      <TopBar back="/settings" title={t('rowReceipts')} />
      {failed ? <LoadError onRetry={() => { setList(null); load() }} /> : !list ? <div className="vc">{[0, 1, 2].map((k) => <div key={k} className="vrow"><i className="vsk" style={{ width: 150, height: 22 }} /></div>)}</div>
        : !list.length ? <div className="vempty"><h2>{t('rcNone')}</h2></div> : (
        <div className="vc">{list.map((r) => (
          <div key={r.id}>
            <button className="vrow" style={{ width: '100%' }} aria-expanded={open === r.id} onClick={() => setOpen(open === r.id ? null : r.id)}>
              <span className="t"><b>{r.suppliers?.name ?? t('rcNoSup')}</b><span>{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}{r.lines ? ` · ${r.lines} ${t('rcItems')}` : ''}</span></span>
              <span className="a">{rupees(r.amount)}</span>
            </button>
            {open === r.id && (
              <div className="vblock" style={{ paddingTop: 0 }}>
                {r.items?.length ? r.items.map((it, i) => <div key={i} className="vrow"><span className="t"><b>{lang === 'hi' && it.name_hi ? it.name_hi : it.name}</b></span><span className="a">{it.qty ?? ''} {it.unit ?? ''}</span></div>)
                  : <p className="vlab">{t('rcNoDetail')}</p>}
                {r.note && <p className="vlab">{r.note}</p>}
              </div>
            )}
          </div>
        ))}</div>
      )}
      <Tap className="btn outline" style={{ marginTop: 16 }} onClick={() => navigate('/receipt')}><Icon name="camera" size={24} />{t('rcTitle')}</Tap>
    </main>
  )
}
