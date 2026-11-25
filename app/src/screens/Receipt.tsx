import { useEffect, useRef, useState } from 'react'
import { useT, rupees } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { loadShop, invalidateShop, type Shop, type ShopMatchable } from '../lib/shop'
import { isSure, matchName } from '../voice/match'
import { searchItems } from '../voice/draft'
import { navigate } from '../lib/router'
import { askText, BackBar, Sheet, Tap, toast } from '../components/ui'
import { NumberSheet, ru } from '../components/Pad'
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
    <main className="screen has-bar pg">
      <BackBar fallback="/maal" />
      <h1 className="h1">{t('rcTitle')}</h1>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      <div className="pg-acts">
        <Tap className="btn primary" disabled={!shop} onClick={() => fileRef.current?.click()}><Icon name="camera" size={26} />{t('rcTake')}</Tap>
        <Tap className="btn outline" onClick={() => setPhase('review')}>{t('rcNoPhoto')}</Tap>
      </div>
    </main>
  )
  if (phase === 'reading') return (
    <main className="screen has-bar pg">
      <div className="top" />
      <h1 className="h1">{t('rcReading')}</h1>
      {photo && <img src={photo} alt="" style={{ width: '100%', maxHeight: 360, objectFit: 'contain', borderRadius: 14, marginTop: 16, opacity: .7 }} />}
      <div className="skel" style={{ height: 56, marginTop: 16 }} />
    </main>
  )
  return (
    <div className="app">
      <main className="screen has-flow pg">
        <BackBar fallback="/maal" />
        <h1 className="h1">{t('rcCheck')}</h1>
        {aiFailed && <div className="pg-note">{t('rcAiFail')}{photo && <Tap className="btn outline" style={{ marginTop: 12 }} onClick={() => read(photo)}>{t('tryAgain')}</Tap>}</div>}
        {photo && <details className="rc-photo"><summary>{t('rcSeePhoto')}</summary><img src={photo} alt="" style={{ width: '100%', borderRadius: 14 }} /></details>}
        <Tap className="hrow" style={{ marginTop: 8 }} onClick={async () => { const v = await askText({ title: t('rcSupplierAsk'), initial: supplier }); if (v != null) setSupplier(v.trim()) }}>
          <Icon name="truck" /><div className="g"><b>{supplier || <span className="lab">{t('rcSupplier')}</span>}</b></div><Icon name="chev" size={20} />
        </Tap>
        {!supplier && sups.length > 0 && <div className="shop-cats segs">{sups.map((s) => <Tap key={s.id} onClick={() => setSupplier(s.name)}>{s.name}</Tap>)}</div>}
        <div style={{ marginTop: 8 }}>
          {lines.map((l) => (
            <div key={l.key} className={`pg-blk rc-line ${l.match && l.sure ? '' : 'u'}`}>
              <div className="pg-split">
                <Tap className="rc-nm" onClick={() => setPick(l)}>
                  {l.match && l.sure ? nm(l.match) : `${t('rcWhich')} "${l.said}"`}
                  {l.match && l.sure && l.said !== nm(l.match).toLowerCase() && <span>{t('rcOnParchi')}: {l.said}</span>}
                </Tap>
                <Tap className="ghost" aria-label="remove" onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}><Icon name="x" size={22} /></Tap>
              </div>
              <div className="pg-pair" style={{ alignItems: 'center' }}>
                <Tap className="chg" onClick={() => setNum({ line: l, field: 'qty' })}>{l.qty != null ? `${l.qty} ${l.match?.shop?.unit ?? l.match?.unit ?? l.unit ?? ''}` : t('rcQty')}</Tap>
                <Tap className="chg" onClick={() => setNum({ line: l, field: 'rate' })}>{l.rate != null ? `@ ${rupees(l.rate)}` : t('rcRate')}</Tap>
                <span className="num rc-amt">{amt(l) ? rupees(amt(l)) : '—'}</span>
              </div>
            </div>
          ))}
          <div className="pg-acts" style={{ marginTop: 16 }}><Tap className="btn outline" onClick={addLine}><Icon name="plus" size={22} stroke={2.6} />{t('rcAdd')}</Tap></div>
        </div>
        {lines.length > 0 && supplier && <>
          <Tap className="hrow" onClick={() => setNum({ field: 'paid' })}><div className="g"><b>{t('rcPaid')}</b></div><div className="a">{rupees(paid)}</div></Tap>
          <div className="hrow cur"><div className="g"><b>{t('rcDue')}</b></div><div className="a">{rupees(Math.max(0, total - paid))}</div></div>
        </>}
        {printed != null && lines.length > 0 && Math.abs(printed - total) > 1 && <p className="pg-sub">{t('rcPrinted').replace('{x}', rupees(printed))}</p>}
      </main>
      <div className="fbar">
        <div className="sum"><small>{t('total')}</small><b>{ru(total)}</b></div>
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
  return <div className="pgs">
    <h2 className="h2 padt">{t('rcWhich')} "{line.said}"</h2>
    <div className="sl">
      {list.map((m) => <Tap key={m.id} onClick={() => onPick(m)}><span>{nm(m)}</span>{m.shop && <span className="lab">{t('rcInShop')}</span>}</Tap>)}
    </div>
    <div className="gap16" />
    <Tap className="btn outline" onClick={async () => { const v = (await askText({ title: t('rcSearch') }) ?? '').trim(); if (v) setList(searchItems(v, shop, 8)) }}><Icon name="search" size={22} />{t('rcSearch')}</Tap>
  </div>
}

// Supplier dues list (from Hisaab): who we owe, and "Paise diye".
export function Suppliers() {
  const { t } = useT()
  const [list, setList] = useState<Sup[] | null>(null)
  const [payTo, setPayTo] = useState<Sup | null>(null)
  const load = () => supabase.from('supplier_balances').select('id,name,due').order('due', { ascending: false }).then(({ data }) => setList(((data ?? []) as Sup[]).map((s) => ({ ...s, due: +s.due }))))
  useEffect(() => { load() }, [])
  return (
    <main className="screen has-bar pg">
      <BackBar fallback="/hisaab" />
      <h1 className="h1">{t('supTitle')}</h1>
      {!list ? <div className="skel" style={{ height: 120, marginTop: 16 }} /> : !list.length ? <p className="pg-empty">{t('supNone')}</p> : (
        <div style={{ marginTop: 8 }}>{list.map((s) => (
          <div key={s.id} className="hrow cur"><div className="g"><b>{s.name}</b><span>{s.due > 0 ? t('rcDue') : t('supClear')}</span></div>
            <div className="a">{rupees(s.due)}</div>
            {s.due > 0 && <Tap className="btn outline small" onClick={() => setPayTo(s)}>{t('supPay')}</Tap>}</div>
        ))}</div>
      )}
      <div className="pg-acts"><Tap className="btn outline" onClick={() => navigate('/receipt')}><Icon name="camera" size={24} />{t('rcTitle')}</Tap></div>
      <NumberSheet open={!!payTo} title={`${payTo?.name ?? ''} — ${t('supPay')}`} initial={null} onClose={() => setPayTo(null)} onDone={async (n) => {
        const s = payTo!; setPayTo(null)
        const { error } = await supabase.rpc('pay_supplier', { p_supplier: s.id, p_amount: n })
        if (error) { errorFx(); toast({ text: t('saveFailed') }); return }
        successFx(); toast({ text: t('saved') }); load()
      }} />
    </main>
  )
}
