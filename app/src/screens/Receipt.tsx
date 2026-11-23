import { useEffect, useRef, useState } from 'react'
import { useT, rupees } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { loadShop, invalidateShop, type Shop, type ShopMatchable } from '../lib/shop'
import { isSure, matchName } from '../voice/match'
import { searchItems } from '../voice/draft'
import { navigate } from '../lib/router'
import { askText, BackBar, Sheet, Tap, toast } from '../components/ui'
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
    <main className="screen has-bar">
      <BackBar fallback="/maal" />
      <h1 className="h1">{t('rcTitle')}</h1>
      <p className="lab" style={{ marginTop: 4 }}>{t('rcHow')}</p>
      <div className="gap24" />
      <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      <Tap className="btn primary" disabled={!shop} onClick={() => fileRef.current?.click()}><Icon name="camera" size={26} />{t('rcTake')}</Tap>
      <div className="gap8" />
      <Tap className="btn quiet" onClick={() => setPhase('review')}>{t('rcNoPhoto')}</Tap>
      <p className="lab center" style={{ marginTop: 20, fontSize: 17 }}>{t('rcTip')}</p>
    </main>
  )
  if (phase === 'reading') return (
    <main className="screen has-bar">
      <div className="top" />
      <h1 className="h1">{t('rcReading')}</h1>
      {photo && <img src={photo} alt="" style={{ width: '100%', maxHeight: 360, objectFit: 'contain', borderRadius: 16, marginTop: 16, opacity: .7 }} />}
      <div className="skel" style={{ height: 56, marginTop: 16 }} />
    </main>
  )
  return (
    <div className="app">
      <main className="screen has-flow">
        <BackBar fallback="/maal" />
        <h1 className="h1">{t('rcCheck')}</h1>
        {aiFailed && <div className="udnote">{t('rcAiFail')}{photo && <Tap className="btn outline small" style={{ marginTop: 10, width: '100%' }} onClick={() => read(photo)}>{t('tryAgain')}</Tap>}</div>}
        {photo && <details style={{ marginTop: 12 }}><summary className="lab" style={{ minHeight: 44, cursor: 'pointer' }}>{t('rcSeePhoto')}</summary><img src={photo} alt="" style={{ width: '100%', borderRadius: 16 }} /></details>}
        <Tap className="rowb" style={{ marginTop: 12 }} onClick={async () => { const v = await askText({ title: t('rcSupplierAsk'), initial: supplier }); if (v != null) setSupplier(v.trim()) }}>
          <Icon name="truck" /><span className="grow">{supplier || <span className="lab">{t('rcSupplier')}</span>}</span><span className="chev"><Icon name="chev" size={20} /></span>
        </Tap>
        {!supplier && sups.length > 0 && <div className="shop-cats segs" style={{ paddingTop: 8 }}>{sups.map((s) => <Tap key={s.id} onClick={() => setSupplier(s.name)}>{s.name}</Tap>)}</div>}
        <div className="stack" style={{ marginTop: 16 }}>
          {lines.map((l) => (
            <div key={l.key} className="card" style={{ padding: '14px 16px', ...(l.match && l.sure ? {} : { background: 'var(--uns)', boxShadow: 'inset 0 0 0 2px var(--unsb)' }) }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Tap className="grow" style={{ textAlign: 'left', fontWeight: 700, fontSize: 19, minHeight: 48, flex: 1 }} onClick={() => setPick(l)}>
                  {l.match && l.sure ? nm(l.match) : `${t('rcWhich')} "${l.said}"`}
                  {l.match && l.sure && l.said !== nm(l.match).toLowerCase() && <span className="lab" style={{ display: 'block', fontSize: 17, fontWeight: 500 }}>{t('rcOnParchi')}: {l.said}</span>}
                </Tap>
                <Tap className="ghost" aria-label="remove" style={{ minWidth: 48, minHeight: 48, color: 'var(--ink2)' }} onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}>✕</Tap>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Tap className="btn outline small" style={{ flex: 1 }} onClick={() => setNum({ line: l, field: 'qty' })}>{l.qty != null ? `${l.qty} ${l.match?.shop?.unit ?? l.match?.unit ?? l.unit ?? ''}` : t('rcQty')}</Tap>
                <Tap className="btn outline small" style={{ flex: 1 }} onClick={() => setNum({ line: l, field: 'rate' })}>{l.rate != null ? `@ ${rupees(l.rate)}` : t('rcRate')}</Tap>
                <span className="num" style={{ alignSelf: 'center', minWidth: 72, textAlign: 'right' }}>{amt(l) ? rupees(amt(l)) : '—'}</span>
              </div>
            </div>
          ))}
          <Tap className="btn quiet" onClick={addLine}>+ {t('rcAdd')}</Tap>
        </div>
        {lines.length > 0 && (
          <div className="card" style={{ marginTop: 16 }}>
            <div className="linkrow" style={{ color: 'var(--ink)' }}><span>{t('total')}</span><span className="num">{rupees(total)}</span></div>
            {printed != null && Math.abs(printed - total) > 1 && <p className="lab" style={{ fontSize: 17 }}>{t('rcPrinted').replace('{x}', rupees(printed))}</p>}
            {supplier && <>
              <Tap className="linkrow" onClick={() => setNum({ field: 'paid' })}><span>{t('rcPaid')}</span><span className="num">{rupees(paid)}</span></Tap>
              <div className="linkrow" style={{ color: 'var(--c-udh)' }}><span>{t('rcDue')}</span><span className="num">{rupees(Math.max(0, total - paid))}</span></div>
            </>}
          </div>
        )}
      </main>
      <div className="flowact">
        {pending ? <Tap className="btn warn" onClick={() => (pending.match && pending.sure ? setNum({ line: pending, field: 'qty' }) : setPick(pending))}>{t('rcFixFirst')}</Tap>
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
    <h2 className="h2">{t('rcWhich')} "{line.said}"</h2>
    <div className="gap16" />
    <div className="stack">
      {list.map((m) => <Tap key={m.id} className="rowb" onClick={() => onPick(m)}><span className="grow">{nm(m)}</span>{m.shop && <span className="lab" style={{ fontWeight: 500 }}>{t('rcInShop')}</span>}</Tap>)}
      <Tap className="btn quiet" onClick={async () => { const v = (await askText({ title: t('rcSearch') }) ?? '').trim(); if (v) setList(searchItems(v, shop, 8)) }}>{t('rcSearch')}</Tap>
    </div>
  </>
}

// Supplier dues list (from Hisaab): who we owe, and "Paise diye".
export function Suppliers() {
  const { t } = useT()
  const [list, setList] = useState<Sup[] | null>(null)
  const [payTo, setPayTo] = useState<Sup | null>(null)
  const load = () => supabase.from('supplier_balances').select('id,name,due').order('due', { ascending: false }).then(({ data }) => setList(((data ?? []) as Sup[]).map((s) => ({ ...s, due: +s.due }))))
  useEffect(() => { load() }, [])
  return (
    <main className="screen has-bar">
      <BackBar fallback="/hisaab" />
      <h1 className="h1">{t('supTitle')}</h1>
      {!list ? <div className="skel" style={{ height: 120, marginTop: 16 }} /> : !list.length ? <p className="lab" style={{ marginTop: 16 }}>{t('supNone')}</p> : (
        <div className="stack" style={{ marginTop: 16 }}>{list.map((s) => (
          <div key={s.id} className="rowb" style={{ cursor: 'default' }}><Icon name="truck" /><span className="grow">{s.name}<span className="lab" style={{ display: 'block', fontSize: 17, fontWeight: 500 }}>{s.due > 0 ? t('rcDue') : t('supClear')}</span></span>
            <span className="num" style={{ color: s.due > 0 ? 'var(--c-udh)' : 'var(--ac)' }}>{rupees(s.due)}</span>
            {s.due > 0 && <Tap className="btn outline small" onClick={() => setPayTo(s)}>{t('supPay')}</Tap>}</div>
        ))}</div>
      )}
      <div className="gap16" />
      <Tap className="btn quiet" onClick={() => navigate('/receipt')}><Icon name="camera" size={24} />{t('rcTitle')}</Tap>
      <NumberSheet open={!!payTo} title={`${payTo?.name ?? ''} — ${t('supPay')}`} initial={null} onClose={() => setPayTo(null)} onDone={async (n) => {
        const s = payTo!; setPayTo(null)
        const { error } = await supabase.rpc('pay_supplier', { p_supplier: s.id, p_amount: n })
        if (error) { errorFx(); toast({ text: t('saveFailed') }); return }
        successFx(); toast({ text: t('saved') }); load()
      }} />
    </main>
  )
}
