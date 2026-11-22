import { useEffect, useRef, useState } from 'react'
import { useT, rupees, type Key } from '../lib/i18n'
import { useStore } from '../lib/store'
import { supabase } from '../lib/supabase'
import { listen, speak, speechSupported, type ListenError } from '../lib/speech'
import { speakOn, speakRate } from '../lib/prefs'
import { custLabel, invalidateShop, loadShop, type Customer, type Shop, type ShopMatchable } from '../lib/shop'
import { parse, parseItems } from '../voice/parse'
import { tokenize } from '../voice/normalize'
import { askAi, needsAi } from '../voice/ai'
import { buildDraft, draftTotal, lineFrom, lineTotal, linesReady, searchItems, type Draft, type Line } from '../voice/draft'
import { goBack, navigate } from '../lib/router'
import { errorFx, successFx } from '../lib/feedback'
import { askText, BackBar, BottomBar, Sheet, Tap, toast } from '../components/ui'
import { NumberSheet } from '../components/Pad'
import { Icon } from '../components/Icon'
import { BillCard } from '../components/BillCard'
import { UpiSheet } from '../components/UpiSheet'

type Stage = 'listen' | 'review' | 'done'
type Saved = { kind: 'bill'; billId: string; token: string; total: number; discount: number; phone?: string; customer: string | null; pay: string; balance: number | null; unrecorded: boolean; lines: Line[] }
  | { kind: 'stock'; lines: Line[] } | { kind: 'payment'; customer: string; amount: number; balance: number }

const unitLabel = (u?: string) => ({ kg: 'kg', g: 'g', l: 'L', ml: 'ml', pc: '', pack: 'pkt' } as Record<string, string>)[u ?? ''] ?? ''
// Item name in the owner's language: catalogue has Hindi / Hinglish / English; the shop's own name wins for Hinglish
const itemLabel = (m: ShopMatchable, lang: string) => lang === 'hi' ? m.hi : lang === 'en' ? m.en : m.shop?.name ?? m.hinglish
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const fmtQty = (q: number | null, u?: string) => q == null ? '?' : `${+q.toFixed(3)}${unitLabel(u) ? ' ' + unitLabel(u) : ''}`

export function Voice() {
  const { t, lang } = useT()
  const { store } = useStore()
  const [stage, setStage] = useState<Stage>('listen')
  const [words, setWords] = useState('')
  const [listening, setListening] = useState(false)
  const [err, setErr] = useState<ListenError | null>(null)
  const [typed, setTyped] = useState('')
  const [shop, setShop] = useState<Shop | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saved, setSaved] = useState<Saved | null>(null)
  const [appendMode, setAppendMode] = useState(false)
  const stopRef = useRef<{ stop(): void } | null>(null)
  const startRef = useRef<(append: boolean) => void>(() => {})
  const draftRef = useRef<Draft | null>(null)
  draftRef.current = draft

  useEffect(() => { loadShop().then(setShop) }, [])

  function start(append = false) {
    setErr(null); setWords(''); setAppendMode(append)
    if (!speechSupported()) { setErr('unsupported'); setStage(append ? 'review' : 'listen'); return }
    setListening(true)
    if (!append) setStage('listen')
    stopRef.current = listen({
      lang: lang === 'en' ? 'en-IN' : 'hi-IN',
      silenceMs: 4000, // shopkeepers pause between items; wait before moving to review
      onWords: setWords,
      onDone: (text) => { setListening(false); understand(text, append) },
      onError: (e) => { setListening(false); setErr(e); if (e === 'no-speech' || e === 'other' || e === 'network') errorFx() },
    })
  }
  startRef.current = start
  // Start listening as soon as the screen opens (the owner already pressed the mic). ?say= lets tests and demos inject words.
  useEffect(() => {
    const q = new URLSearchParams(location.search), say = q.get('say')
    if (q.get('manual')) { loadShop().then((s) => { setShop(s); setDraft({ intent: q.get('manual') === 'stock' ? 'stock_in' : 'bill', heard: '', customerName: null, customer: null, customerSure: true, customerOthers: [], lines: [], amount: null, pay: 'cash' }); setStage('review') }) }
    else if (q.get('order')) {
      // online order -> bill: available lines become bill lines; customer + phone prefilled
      Promise.all([loadShop(), supabase.from('orders').select('id,customer_name,phone,order_lines(item_id,name,unit,qty,price,available)').eq('id', q.get('order')!).maybeSingle()]).then(([s, { data }]) => {
        setShop(s)
        const o = data as { id: string; customer_name: string; phone: string; order_lines: { item_id: string; qty: number; price: number; available: boolean }[] } | null
        if (!o) return
        const lines = o.order_lines.filter((l) => l.available).map((l, i) => {
          const m = [...s.byMatchId.values()].find((x) => x.shop?.id === l.item_id) ?? null
          return { key: 'o' + i, said: '', match: m, candidates: m ? [m] : [], sure: !!m, qty: Number(l.qty), price: Number(l.price), priceSure: true }
        })
        const c = s.customers.find((x) => x.phone === o.phone) ?? null
        setDraft({ intent: 'bill', heard: '', customerName: c?.name ?? o.customer_name, customer: c, customerSure: true, customerOthers: [], lines, amount: null, pay: 'cash', phone: o.phone, orderId: o.id })
        setStage('review')
      })
    }
    else if (say) { setWords(say); loadShop().then(() => understand(say, false)) } else start(false)
    return () => stopRef.current?.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function understand(text: string, append: boolean) {
    const s = shop ?? await loadShop()
    setShop(s)
    const cur = draftRef.current // latest bill, not the one from when listening started
    if (append && cur) {
      // more items or corrections while reviewing: same item again = new quantity, otherwise add
      // a name said now (e.g. "Sharma ji ka hai") fills the customer; the rest are items
      const full = parse(text, s.index, s.customers.map((c) => c.name))
      const items = full.intent === 'bill' || full.intent === 'stock_in' ? full.items : parseItems(tokenize(text), s.index)
      const lines = [...cur.lines]
      if (full.customer && !cur.customerName && cur.intent === 'bill') { cur.customerName = full.customer; cur.customerSure = full.customerSure; cur.customer = s.customers.find((c) => c.name === full.customer) ?? null }
      for (const p of items) {
        const nl = lineFrom(p, s)
        const i = lines.findIndex((l) => l.match && nl.match && l.match.id === nl.match.id)
        if (i >= 0) lines[i] = { ...lines[i], qty: nl.qty ?? lines[i].qty }; else lines.push(nl)
      }
      setDraft({ ...cur, lines }); setStage('review'); return
    }
    let p = parse(text, s.index, s.customers.map((c) => c.name))
    // opened from the Maal tab: whatever is said is stock coming in
    if (new URLSearchParams(location.search).get('stock') && (p.intent === 'bill' || p.intent === 'unknown') && p.items.length) p = { ...p, intent: 'stock_in', customer: null, customerSure: true }
    if (needsAi(p)) {
      setWords(t('understanding'))
      const ai = await askAi(text, s.index, s.customers.map((c) => c.name))
      setWords(text)
      if (ai && (p.intent === 'unknown' || ai.items.filter((i) => i.candidates.length).length >= p.items.filter((i) => i.candidates.length).length)) p = ai
    }
    const d = buildDraft(p, s)
    setDraft(d); setStage('review')
    if (d.intent === 'bill' && d.lines.length === 0) setTimeout(() => startRef.current(true), 400)
    if (store) supabase.from('usage_events').insert({ store_id: store.id, kind: 'voice', meta: { intent: p.intent, sure: p.sure } }).then(() => {})
    if (d.intent === 'query' && speakOn()) speak(queryAnswer(d, t, lang), lang, speakRate())
  }

  const fix = (line: Line) => (patch: Partial<Line>) => draft && setDraft({ ...draft, lines: draft.lines.map((l) => l.key === line.key ? { ...l, ...patch } : l) })

  // ---------- LISTEN ----------
  if (stage === 'listen') {
    const msg = err === 'denied' ? t('micDenied') : err === 'unsupported' ? t('noMicSupport') : err === 'network' ? t('offline') : err ? t('noSpeech') : null
    return (
      <div className="app">
        <main className="screen has-flow">
          <BackBar />
          <h1 className="h1" style={{ marginTop: 8 }}>{listening ? t('listenTitle') : msg ? t('notUnderstood') : t('listenTitle')}</h1>
          <p className="live" aria-live="polite">{words || (listening ? '…' : '')}</p>
          {listening && shop && words && <LivePreview words={words} shop={shop} />}
          {listening && <p style={{ marginTop: 20 }}>{t('listenNote')}</p>}
          {msg && <><div className="gap16" /><div className="err" role="alert">{msg}</div></>}
          {!listening && <TypeBox value={typed} onChange={setTyped} onGo={() => typed.trim() && understand(typed.trim(), false)} />}
        </main>
        {listening
          ? <div className="flowact"><Tap className="btn outline" onClick={() => stopRef.current?.stop()}>{t('listenDone')}</Tap></div>
          : msg && <div className="flowact"><Tap className="btn primary" onClick={() => start(false)}>{t('listenAgain')}</Tap></div>}
        <BottomBar flow listening={listening} micLabel={listening ? t('micSpeaking') : t('mic')} onMic={() => listening ? stopRef.current?.stop() : start(false)} />
      </div>
    )
  }

  // ---------- DONE ----------
  if (stage === 'done' && saved) return <SavedView saved={saved} onUndo={async () => {
    if (saved.kind !== 'bill') return
    const { error } = await supabase.rpc('undo_bill', { p_bill: saved.billId })
    if (error) { errorFx(); toast({ text: t('saveFailed') }); return }
    invalidateShop(); toast({ text: t('billRemoved') }); navigate('/', true)
  }} />

  if (!draft || !shop) return null
  const listenBar = <BottomBar flow listening={listening} micLabel={listening ? t('micSpeaking') : t('micFix')} onMic={() => listening ? stopRef.current?.stop() : start(true)} />

  // ---------- REVIEW: question / galla / unknown ----------
  if (draft.intent === 'query') return <AnswerView draft={draft} bar={listenBar} />
  if (draft.intent === 'galla') return <GallaView amount={draft.amount} bar={listenBar} />
  if (draft.intent === 'unknown' || (draft.intent !== 'payment' && draft.intent !== 'bill' && draft.lines.length === 0)) return (
    <div className="app">
      <main className="screen has-flow">
        <BackBar />
        <h1 className="h1">{t('notUnderstood')}</h1>
        <p className="lab" style={{ marginTop: 4 }}>{t('heard')}: "{draft.heard}"</p>
        <div className="gap24" />
        <p>{t('notUnderstoodBody')}</p>
        <div className="card" style={{ marginTop: 8, lineHeight: '30px' }}>
          <b>"Sharma ji, 2 kilo cheeni"</b><br /><b>"Maal aaya, 10 Aashirvaad atta"</b><br /><b>"Gupta ji ne 500 diye"</b><br /><b>"Cheeni kitni bachi?"</b>
        </div>
        <TypeBox value={typed} onChange={setTyped} onGo={() => typed.trim() && understand(typed.trim(), false)} />
      </main>
      <div className="flowact"><Tap className="btn primary" onClick={() => start(false)}>{t('listenAgain')}</Tap></div>
      <BottomBar flow listening={listening} micLabel={listening ? t('micSpeaking') : t('mic')} onMic={() => start(false)} />
    </div>
  )
  if (draft.intent === 'payment') return <PaymentView draft={draft} shop={shop} bar={listenBar} onSaved={(s) => { setSaved(s); setStage('done') }} />

  // ---------- REVIEW: bill / stock in ----------
  const isBill = draft.intent === 'bill'
  const ready = isBill ? linesReady(draft) && draft.customerSure : draft.lines.length > 0 && draft.lines.every((l) => l.sure && l.match && l.qty != null && l.qty > 0)
  const total = draftTotal(draft)
  const udhaarBlocked = isBill && draft.pay === 'udhaar' && !draft.customerName
  return (
    <ReviewScreen
      draft={draft} setDraft={setDraft} shop={shop} isBill={isBill} ready={ready} total={total} udhaarBlocked={udhaarBlocked}
      fix={fix} bar={listenBar} listening={listening} words={appendMode ? words : ''}
      onSaved={(s) => { setSaved(s); setStage('done') }}
    />
  )
}

// While speaking: show what is being understood, item by item, so the owner can keep going.
function LivePreview({ words, shop }: { words: string; shop: Shop }) {
  const p = parse(words, shop.index, shop.customers.map((c) => c.name))
  if (!p.customer && p.items.length === 0) return null
  return (
    <div className="card" style={{ marginTop: 20, padding: '14px 18px' }}>
      {p.customer && <div className="h2" style={{ marginBottom: 6 }}>{p.customer}</div>}
      {p.items.map((i, k) => (
        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontWeight: 600 }}>
          <span>{i.candidates[0] ? (i.candidates[0].item as ShopMatchable).shop?.name ?? i.candidates[0].item.hinglish : `"${i.said}"`}</span>
          <span className="lab">{i.qty ?? ''} {i.unit ?? ''}</span>
        </div>
      ))}
    </div>
  )
}

function TypeBox({ value, onChange, onGo }: { value: string; onChange: (v: string) => void; onGo: () => void }) {
  const { t } = useT()
  return (
    <div className="field" style={{ marginTop: 28 }}>
      <label htmlFor="typed">{t('typeInstead')}</label>
      <div style={{ display: 'flex', gap: 10 }}>
        <input id="typed" className="input" value={value} placeholder={t('typeHint')} onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onGo()} />
        <Tap className="btn primary small" style={{ minWidth: 72 }} disabled={!value.trim()} onClick={onGo}>{t('next')}</Tap>
      </div>
    </div>
  )
}

// ---------- bill / stock review card ----------
function ReviewScreen({ draft, setDraft, shop, isBill, ready, total, udhaarBlocked, fix, bar, listening, words, onSaved }: {
  draft: Draft; setDraft: (d: Draft) => void; shop: Shop; isBill: boolean; ready: boolean; total: number; udhaarBlocked: boolean
  fix: (l: Line) => (p: Partial<Line>) => void; bar: React.ReactNode; listening: boolean; words: string; onSaved: (s: Saved) => void
}) {
  const { t } = useT()
  const [pick, setPick] = useState<Line | null>(null)
  const [pad, setPad] = useState<{ line: Line; field: 'qty' | 'price' } | null>(null)
  const [disc, setDisc] = useState(0)
  const [discOpen, setDiscOpen] = useState(false)
  const [custOpen, setCustOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [upiOpen, setUpiOpen] = useState(false)
  const { store } = useStore()
  const pending = draft.lines.find((l) => !l.sure || !l.match) ?? (isBill && !draft.customerSure ? draft.lines[0] : undefined)
  const reason = draft.lines.length === 0 ? t('sayItems') : pending ? t('answerFirst') : isBill && draft.lines.some((l) => l.price == null) ? t('priceFirst') : t('fixFirst')
  const prevBal = draft.customer?.balance ?? 0
  const net = Math.max(0, total - disc)

  async function save() {
    setBusy(true)
    const lines = draft.lines.map((l) => ({
      item_id: l.match!.shop?.id ?? null, catalog_id: l.match!.id.startsWith('shop:') ? null : l.match!.id,
      name: l.match!.shop?.name ?? l.match!.hinglish, name_hi: l.match!.shop?.name_hi ?? l.match!.hi,
      unit: l.match!.shop?.unit ?? l.match!.unit, loose: l.match!.loose, said: l.said, qty: l.qty, price: l.price,
    }))
    const res = isBill
      ? await supabase.rpc('save_bill', { p: { customer: draft.customerName, customer_id: draft.customer?.id ?? null, order_id: draft.orderId ?? null, new_customer: !!draft.newCustomer, tag: draft.tag ?? null, phone: draft.phone ?? draft.customer?.phone ?? null, pay: draft.pay, discount: disc, voice_text: draft.heard, lines } })
      : await supabase.rpc('add_stock', { p: { reason: 'stock_in', lines } })
    setBusy(false)
    if (res.error) { errorFx(); toast({ text: t('saveFailed') }); return }
    successFx(); invalidateShop()
    if (isBill) {
      const r = res.data as { bill_id: string; share_token: string; total: number; balance: number | null; has_unrecorded: boolean }
      onSaved({ kind: 'bill', billId: r.bill_id, token: r.share_token, total: Number(r.total), discount: disc, phone: (draft.phone ?? draft.customer?.phone ?? '').replace(/\D/g, ''), customer: draft.customerName, pay: draft.pay, balance: r.balance == null ? null : Number(r.balance), unrecorded: r.has_unrecorded, lines: draft.lines })
    } else onSaved({ kind: 'stock', lines: draft.lines })
  }

  const cta = !ready
    ? <Tap className="btn warn" onClick={() => (document.querySelector('.it.u') ?? document.querySelector('.pricebtn'))?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
        {isBill && total > 0 ? `${t('total')} ${rupees(net)} · ${reason}` : cap(reason)}
      </Tap>
    : udhaarBlocked
      ? <Tap className="btn warn" onClick={() => setCustOpen(true)}>{t('udhaarNeedsName')}</Tap>
      : <Tap className="btn primary" disabled={busy} onClick={save}><Icon name="tick" size={24} stroke={3} />
          {busy ? t('saving') : isBill ? `${t('saveBill')} · ${rupees(net)}` : t('stockAdd')}</Tap>

  return (
    <div className="app">
      <main className="screen has-flow">
        <BackBar />
        {isBill ? (
          <div className="who">
            <div className="av">{(draft.customerName ?? '?').trim().charAt(0).toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="lab" style={{ lineHeight: '20px' }}>{t('billWhose')}{draft.customerName && !draft.customer && draft.customerOthers.length <= 1 ? ` · ${t('newCustomer')}` : ''}</div>
              <div className="h1" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{draft.customerName ?? <span className="lab" style={{ font: "600 20px Mukta" }}>{t('walkIn')}</span>}</div>
            </div>
            <Tap className="ghost" style={{ color: 'var(--ac)', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 4 }} onClick={() => setCustOpen(true)}>{draft.customerName ? t('change') : t('addName')}</Tap>
          </div>
        ) : <h1 className="h1" style={{ marginTop: 8 }}>{t('stockInTitle')}</h1>}
        {isBill && draft.customerName && !draft.customer && draft.customerOthers.length > 1 && !draft.customerSure && (
          <div className="it u" style={{ borderRadius: 16, marginTop: 12 }}>
            <div className="ask">{t('whichOne')}</div>
            <div className="stack" style={{ marginTop: 8 }}>
              {draft.customerOthers.map((c) => <Tap key={c.id} className="rowb" style={{ minHeight: 56 }} onClick={() => setDraft({ ...draft, customer: c, customerName: c.name, customerSure: true, newCustomer: false })}>
                <span className="grow">{custLabel(c)}</span>{c.balance > 0 && <span style={{ color: 'var(--ud)' }}>{rupees(c.balance)}</span>}</Tap>)}
              <Tap className="chg" onClick={async () => { const tg = await askText({ title: t('tagAsk') }) ?? ''; setDraft({ ...draft, customer: null, newCustomer: true, tag: tg.trim() || undefined, customerSure: true }) }}>+ {t('newOne')} {draft.customerName}</Tap>
            </div>
          </div>
        )}
        {isBill && draft.customer && <Tap className="ghost" style={{ marginLeft: -12, fontSize: 17, color: 'var(--ink2)' }} onClick={async () => { const tg = await askText({ title: t('tagAsk') }) ?? ''; setDraft({ ...draft, customer: null, newCustomer: true, tag: tg.trim() || undefined, customerSure: true }) }}>{t('notThisOne')}</Tap>}
        {isBill && !draft.customerSure && draft.customerName && draft.customerOthers.length <= 1 && (
          <div className="it u" style={{ borderRadius: 16, marginTop: 12 }}>
            <div className="guess" style={{ marginTop: 0 }}><span className="gtxt">{t('thisName')}</span>
              <div style={{ display: 'flex', gap: 10 }}>
                <Tap className="chg yes" onClick={() => setDraft({ ...draft, customerSure: true })}>✓ {t('yes')}</Tap>
                <Tap className="chg" onClick={() => {
                  const extra = parseItems(tokenize(draft.customerName!), shop.index).map((p) => lineFrom({ ...p, qty: p.qty ?? 1 }, shop))
                  setDraft({ ...draft, customerName: null, customer: null, customerSure: true, lines: [...extra, ...draft.lines] })
                }}>{t('itsAnItem')}</Tap>
              </div>
            </div>
          </div>
        )}

        {isBill && draft.lines.length === 0 && <p className="h2" style={{ marginTop: 20, color: 'var(--ac)' }}>{t('sayItems')}</p>}
        <div className="items" style={draft.lines.length ? undefined : { display: 'none' }}>
          {draft.lines.map((l) => <LineRow key={l.key} l={l} isBill={isBill} onPick={() => setPick(l)} onPad={(field) => setPad({ line: l, field })} fix={fix(l)}
            onRemove={() => setDraft({ ...draft, lines: draft.lines.filter((x) => x.key !== l.key) })} />)}
        </div>
        {listening && <p className="live" style={{ fontSize: 24, marginTop: 16 }}>{words || '…'}</p>}
        <Tap className="linkrow" style={{ marginTop: 12 }} onClick={() => setPick({ key: 'new', said: '', match: null, candidates: [], sure: true, qty: 1, price: null, priceSure: false })}><span>+ {t('addItem')}</span><span>›</span></Tap>

        {isBill && ready && <>
          <div className="sec">{t('howPaid')}</div>
          <div className="pay">
            {(['cash', 'upi', 'udhaar'] as const).map((p) => (
              <Tap key={p} className={`pb ${draft.pay === p ? 'on' : ''} ${p === 'udhaar' ? 'ud' : ''}`} onClick={() => { setDraft({ ...draft, pay: p }); if (p === 'upi') setUpiOpen(true) }}>
                {draft.pay === p && '✓ '}{t(p)}
              </Tap>
            ))}
          </div>
          {draft.customerName && (
            <div className="field" style={{ marginTop: 14 }}>
              <label htmlFor="ph">{t('phoneOpt')}</label>
              <input id="ph" className="input" inputMode="tel" maxLength={13} placeholder="98xxxxxxxx" value={draft.phone ?? draft.customer?.phone ?? ''}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value.replace(/[^\d+]/g, '') })} />
            </div>
          )}
          {draft.pay === 'udhaar' && draft.customerName && (
            <div className="udnote">
              <div style={{ fontWeight: 600 }}>{t('udhaarBefore')} {rupees(prevBal)} + {t('udhaarThisBill')} {rupees(net)}</div>
              <div className="num">{draft.customerName} {t('udhaarTotal')}: {rupees(prevBal + net)}</div>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <Tap className="linkrow" style={{ flex: 1 }} onClick={() => setDiscOpen(true)}>
              <span>{t('discount')}</span><span>{disc ? `− ${rupees(disc)}` : '›'}</span>
            </Tap>
            {disc > 0 && <Tap className="chg" style={{ minHeight: 48 }} onClick={() => setDisc(0)}>{t('remove')}</Tap>}
          </div>
        </>}
        {!isBill && <div className="gap16" />}
      </main>
      <div className="flowact">{cta}</div>
      {bar}

      <ItemPicker open={!!pick} line={pick} shop={shop} onClose={() => setPick(null)}
        onPick={(m) => { if (pick && pick.key === 'new') { const pr = m.shop?.price ?? m.shop?.learned_price ?? m.lastPrice ?? null; setDraft({ ...draft, lines: [...draft.lines, { key: 'n' + Date.now(), said: '', match: m, candidates: [m], sure: true, qty: 1, price: pr, priceSure: m.shop?.price != null || m.shop?.learned_price != null }] }) } else if (pick) { const pr = m.shop?.price ?? m.shop?.learned_price ?? m.lastPrice ?? null; fix(pick)({ match: m, sure: true, price: pr, priceSure: m.shop?.price != null || m.shop?.learned_price != null, qty: pick.qty ?? 1 }) } setPick(null) }} />
      <NumberSheet open={!!pad} title={pad?.field === 'price' ? `${pad.line.match?.hinglish ?? ''} — ${t('priceAsk')}` : `${pad?.line.match?.hinglish ?? ''} — ${t('qtyAsk')}`}
        initial={pad ? (pad.field === 'price' ? pad.line.price : pad.line.qty) : null} unit={pad?.field === 'qty' ? unitLabel(pad.line.match?.unit) : '₹'}
        onClose={() => setPad(null)} onDone={(n) => pad && fix(pad.line)(pad.field === 'price' ? { price: n, priceSure: true } : { qty: n })} />
      <UpiSheet open={upiOpen} upi={store?.upi_id ?? null} name={store?.name ?? ''} amount={net} onClose={() => setUpiOpen(false)} />
      <NumberSheet open={discOpen} title={t('discount')} initial={disc || null} unit="₹" onClose={() => setDiscOpen(false)} onDone={(n) => setDisc(Math.min(n, total))} />
      <CustomerPicker open={custOpen} shop={shop} current={draft.customerName} onClose={() => setCustOpen(false)}
        onPick={(name, c) => { setDraft({ ...draft, customerName: name, customer: c, customerSure: true }); setCustOpen(false) }} />
    </div>
  )
}

function LineRow({ l, isBill, onPick, onPad, fix, onRemove }: { l: Line; isBill: boolean; onPick: () => void; onPad: (f: 'qty' | 'price') => void; fix: (p: Partial<Line>) => void; onRemove: () => void }) {
  const { t } = useT()
  const unit = l.match?.shop?.unit ?? l.match?.unit
  const step = l.match?.loose && (unit === 'kg' || unit === 'l') ? 0.5 : 1
  const { lang } = useT()
  const name = l.match ? itemLabel(l.match, lang) : `"${l.said}"`
  const stepper = (
    <div className="step">
      <Tap aria-label="minus" onClick={() => (l.qty ?? 0) - step <= 0 ? onRemove() : fix({ qty: +((l.qty ?? 0) - step).toFixed(3) })}><i>−</i></Tap>
      <Tap aria-label="quantity" onClick={() => onPad('qty')}><em>{fmtQty(l.qty, unit)}</em></Tap>
      <Tap aria-label="plus" onClick={() => fix({ qty: +((l.qty ?? 0) + step).toFixed(3) })}><i>+</i></Tap>
    </div>
  )
  const priceLine = isBill && l.match && (
    <Tap className="pricebtn" onClick={() => onPad('price')} style={{ color: l.price == null ? 'var(--danger)' : l.priceSure ? 'var(--ink2)' : '#7A5600' }}>
      {l.price == null ? t('priceAsk') : `₹${+l.price.toFixed(2)}${unitLabel(unit) ? '/' + unitLabel(unit) : ' ' + t('perUnit')}`}
      {l.price != null && ` · ${rupees(lineTotal(l))}`}{l.price != null && !l.priceSure && ` · ${t('priceCheck')}`}
    </Tap>
  )
  if (!l.match) return (
    <div className="it u">
      <div className="qrow" style={{ margin: 0 }}><div><div className="nm">{name}</div><div className="ask" style={{ margin: 0 }}>{t('whatIsThis')}</div></div></div>
      <div className="guess"><span /><div style={{ display: 'flex', gap: 10 }}><Tap className="chg yes" onClick={onPick}>{t('pickItem')}</Tap><Tap className="chg" onClick={onRemove}>{t('remove')}</Tap></div></div>
    </div>
  )
  return (
    <div className={`it ${l.sure ? '' : 'u'}`} style={{ display: 'block' }}>
      <div className="qrow" style={{ margin: 0 }}>
        <div style={{ minWidth: 0 }}><div className="nm">{name}</div>{priceLine}</div>
        {stepper}
      </div>
      {!l.sure && (
        <div className="guess"><span className="gtxt">{t('thisOne')}</span>
          <div style={{ display: 'flex', gap: 10 }}><Tap className="chg yes" onClick={() => fix({ sure: true })}>✓ {t('yes')}</Tap><Tap className="chg" onClick={onPick}>{t('other')}</Tap></div>
        </div>
      )}
    </div>
  )
}

function ItemPicker({ open, line, shop, onClose, onPick }: { open: boolean; line: Line | null; shop: Shop; onClose: () => void; onPick: (m: ShopMatchable) => void }) {
  const { t, lang } = useT()
  const [q, setQ] = useState('')
  const list = q.trim() ? searchItems(q, shop, 8) : (line?.candidates.length ? line.candidates : searchItems(line?.said ?? '', shop, 8))
  return (
    <Sheet open={open} onClose={() => { setQ(''); onClose() }}>
      <h2 className="h2">{t('pickItem')}</h2><div className="gap8" />
      <input className="input" value={q} placeholder={t('searchItem')} onChange={(e) => setQ(e.target.value)} />
      <div className="stack" style={{ marginTop: 12 }}>
        {list.map((m) => (
          <Tap key={m.id} className="rowb" style={{ minHeight: 60 }} onClick={() => { setQ(''); onPick(m) }}>
            <span className="grow">{itemLabel(m, lang)}<span className="lab" style={{ display: 'block', fontSize: 17, fontWeight: 500, lineHeight: '22px' }}>{lang === 'hi' ? m.hinglish : m.hi}</span></span>
            <span className="chev">›</span>
          </Tap>
        ))}
      </div>
    </Sheet>
  )
}

function CustomerPicker({ open, shop, current, onClose, onPick }: { open: boolean; shop: Shop; current: string | null; onClose: () => void; onPick: (name: string | null, c: Customer | null) => void }) {
  const { t } = useT()
  const [q, setQ] = useState('')
  const list = shop.customers.filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6)
  return (
    <Sheet open={open} onClose={onClose}>
      <h2 className="h2">{t('billWhose')}</h2><div className="gap8" />
      <div style={{ display: 'flex', gap: 10 }}>
        <input className="input" value={q} placeholder={current ?? t('addName')} onChange={(e) => setQ(e.target.value)} />
        <Tap className="btn primary small" style={{ minWidth: 72 }} disabled={!q.trim()} onClick={() => { onPick(q.trim(), shop.customers.find((c) => c.name.toLowerCase() === q.trim().toLowerCase()) ?? null); setQ('') }}>{t('ok')}</Tap>
      </div>
      <div className="stack" style={{ marginTop: 12 }}>
        {list.map((c) => <Tap key={c.id} className="rowb" style={{ minHeight: 60 }} onClick={() => { onPick(c.name, c); setQ('') }}><span className="grow">{custLabel(c)}</span>{c.balance > 0 && <span style={{ color: 'var(--ud)' }}>{rupees(c.balance)}</span>}</Tap>)}
        <Tap className="rowb" style={{ minHeight: 60, boxShadow: 'inset 0 0 0 2px var(--line)', background: 'none' }} onClick={() => onPick(null, null)}><span className="grow lab">{t('walkIn')}</span></Tap>
      </div>
    </Sheet>
  )
}

// ---------- udhaar payment ----------
function PaymentView({ draft, shop, bar, onSaved }: { draft: Draft; shop: Shop; bar: React.ReactNode; onSaved: (s: Saved) => void }) {
  const { t } = useT()
  const [cust, setCust] = useState<Customer | null>(draft.customer)
  const [amount, setAmount] = useState<number | null>(draft.amount)
  const [padOpen, setPadOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const choices = cust ? [] : (draft.customerOthers.length ? draft.customerOthers : shop.customers.filter((c) => c.balance > 0).slice(0, 5))
  async function save() {
    if (!cust || !amount) return
    setBusy(true)
    const { data, error } = await supabase.rpc('log_payment', { p_customer: cust.id, p_amount: amount })
    setBusy(false)
    if (error) { errorFx(); toast({ text: t('saveFailed') }); return }
    successFx(); invalidateShop()
    onSaved({ kind: 'payment', customer: cust.name, amount, balance: Number(data) })
  }
  return (
    <div className="app">
      <main className="screen has-flow">
        <BackBar />
        <h1 className="h1" style={{ marginTop: 8 }}>{t('paymentTitle')}</h1>
        <div className="gap16" />
        {cust ? (
          <div className="who"><div className="av">{cust.name.charAt(0).toUpperCase()}</div>
            <div style={{ flex: 1 }}><div className="lab" style={{ lineHeight: '20px' }}>{t('whoPaid')}</div><div className="h1">{cust.name}</div></div>
            <Tap className="ghost" style={{ color: 'var(--ac)', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 4 }} onClick={() => setCust(null)}>{t('change')}</Tap></div>
        ) : (
          <>
            <div className="it u" style={{ borderRadius: 18 }}><div className="ask" style={{ margin: 0 }}>{draft.customerName ? `"${draft.customerName}" — ` : ''}{t('noSuchCustomer')}</div></div>
            <div className="stack" style={{ marginTop: 12 }}>
              {choices.map((c) => <Tap key={c.id} className="rowb" onClick={() => setCust(c)}><span className="grow">{c.name}</span><span style={{ color: 'var(--ud)' }}>{rupees(c.balance)}</span></Tap>)}
            </div>
          </>
        )}
        {cust && <div className="card" style={{ marginTop: 20 }}>
          <Tap className="linkrow" style={{ color: 'var(--ink)' }} onClick={() => setPadOpen(true)}><span className="lab">{t('amount')}</span><span className="big" style={{ fontSize: 38 }}>{amount ? rupees(amount) : '?'}</span></Tap>
          <div className="divider" />
          <div className="linkrow" style={{ color: 'var(--ink)', fontWeight: 500 }}><span className="lab">{t('balanceNow')}</span><span className="num" style={{ color: 'var(--ud)' }}>{rupees(cust.balance)}</span></div>
          <div className="linkrow" style={{ color: 'var(--ink)', fontWeight: 500 }}><span className="lab">{t('balanceAfter')}</span><span className="num">{rupees(cust.balance - (amount ?? 0))}</span></div>
        </div>}
      </main>
      <div className="flowact">
        <Tap className="btn primary" disabled={!cust || !amount || busy} onClick={save}><Icon name="tick" size={24} stroke={3} />{busy ? t('saving') : `${t('payDo')}${amount ? ' · ' + rupees(amount) : ''}`}</Tap>
      </div>
      {bar}
      <NumberSheet open={padOpen} title={t('amount')} initial={amount} unit="₹" onClose={() => setPadOpen(false)} onDone={setAmount} />
    </div>
  )
}

// ---------- "Cheeni kitni bachi?" ----------
function queryAnswer(d: Draft, t: (k: Key) => string, lang: string): string {
  const m = d.lines[0]?.match
  if (!m) return t('notUnderstood')
  const name = lang === 'hi' ? m.hi : m.shop?.name ?? m.hinglish
  if (!m.shop?.stock_known) return `${name}: ${t('stockUnknown')}`
  return `${name} ${fmtQty(Math.max(0, m.shop.stock), m.shop.unit)} ${t('stockLeft')}`
}
function AnswerView({ draft, bar }: { draft: Draft; bar: React.ReactNode }) {
  const { t, lang } = useT()
  const m = draft.lines[0]?.match
  return (
    <div className="app">
      <main className="screen has-flow">
        <BackBar />
        <p className="lab" style={{ marginTop: 8 }}>{t('heard')}: "{draft.heard}"</p>
        <div className="card center" style={{ marginTop: 20, padding: '32px 24px' }}>
          {m && <div className="h2">{lang === 'hi' ? m.hi : m.shop?.name ?? m.hinglish}</div>}
          {m?.shop?.stock_known
            ? <><div className="big" style={{ marginTop: 8 }}>{fmtQty(Math.max(0, m.shop.stock), m.shop.unit)}</div><div className="lab">{t('stockLeft')}</div></>
            : <p style={{ marginTop: 8 }}>{m ? t('stockUnknown') : t('notUnderstood')}</p>}
        </div>
      </main>
      <div className="flowact"><Tap className="btn primary" onClick={() => goBack()}>{t('ok')}</Tap></div>
      {bar}
    </div>
  )
}

// ---------- "Galla mein 4,200 hai" ----------
function GallaView({ amount, bar }: { amount: number | null; bar: React.ReactNode }) {
  const { t } = useT()
  const { store } = useStore()
  const [cash, setCash] = useState<number | null>(null)
  useEffect(() => { supabase.rpc('today_summary').then(({ data }) => setCash(Number((data as { cash: number } | null)?.cash ?? 0))) }, [])
  useEffect(() => { if (store && amount != null && cash != null) supabase.from('usage_events').insert({ store_id: store.id, kind: 'galla', meta: { said: amount, cash } }).then(() => {}) }, [store, amount, cash])
  const gap = amount != null && cash != null ? amount - cash : null
  return (
    <div className="app">
      <main className="screen has-flow">
        <BackBar />
        <h1 className="h1" style={{ marginTop: 8 }}>{t('gallaTitle')}</h1>
        <div className="card" style={{ marginTop: 20 }}>
          <div className="linkrow" style={{ color: 'var(--ink)', fontWeight: 500 }}><span className="lab">{t('gallaSaid')}</span><span className="num">{amount != null ? rupees(amount) : '?'}</span></div>
          <div className="linkrow" style={{ color: 'var(--ink)', fontWeight: 500 }}><span className="lab">{t('gallaBills')}</span><span className="num">{cash != null ? rupees(cash) : '…'}</span></div>
        </div>
        {gap != null && (
          <div className={gap === 0 ? 'card' : 'udnote'} style={{ marginTop: 16, ...(gap === 0 ? { background: 'var(--acs)', color: 'var(--ac)' } : {}) }}>
            <div className="h2">{gap === 0 ? t('gallaMatch') : `${rupees(Math.abs(gap))} ${gap < 0 ? t('gallaLess') : t('gallaMore')}`}</div>
            {gap !== 0 && <p style={{ marginTop: 4 }}>{t('gallaNote')}</p>}
          </div>
        )}
      </main>
      <div className="flowact"><Tap className="btn primary" onClick={() => goBack()}>{t('ok')}</Tap></div>
      {bar}
    </div>
  )
}

// ---------- after ✓ ----------
function SavedView({ saved, onUndo }: { saved: Saved; onUndo: () => void }) {
  const { t, lang } = useT()
  const { store } = useStore()
  const link = saved.kind === 'bill' ? `${location.origin}/b/${saved.token}` : ''
  const waText = saved.kind === 'bill' ? encodeURIComponent(`${store?.name ?? ''}: ${lang === 'en' ? 'Your bill' : 'Aapka bill'} ${rupees(saved.total)}\n${link}`) : ''
  const lineSummary = saved.kind !== 'payment' ? saved.lines.map((l) => `${fmtQty(l.qty, l.match?.unit)} ${l.match?.shop?.name ?? l.match?.hinglish ?? ''}`).join(', ') : ''
  return (
    <div className="app">
      <main className="screen has-flow">
        {saved.kind === 'bill' ? (
          <div style={{ marginTop: 4 }}>
            <BillCard lang={lang} brand={false} b={{
              store: store?.name ?? '', customer: saved.customer, pay: saved.pay, subtotal: saved.total + saved.discount, discount: saved.discount, total: saved.total, status: 'saved',
              at: new Date().toISOString(), no: saved.token.slice(0, 6).toUpperCase(),
              lines: saved.lines.map((l) => ({ name: l.match?.shop?.name ?? l.match?.hinglish ?? '', name_hi: l.match?.hi, catalog_id: l.match && !l.match.id.startsWith('shop:') ? l.match.id : null, qty: l.qty ?? 0, unit: l.match?.shop?.unit ?? l.match?.unit ?? 'pc', price: l.price ?? 0, amount: lineTotal(l) })),
            }} />
            {saved.pay === 'udhaar' && saved.balance != null && <div className="udnote">{saved.customer} {t('udhaarTotal')}: {rupees(saved.balance)}</div>}
          </div>
        ) : <>
          <div className="ok"><div className="okc"><Icon name="tick" size={48} stroke={3} /></div>
            <h1 className="h1" style={{ marginTop: 22 }}>{saved.kind === 'stock' ? t('stockAdded') : t('paySaved')}</h1>
            {saved.kind === 'payment' && <><div className="lab" style={{ marginTop: 4 }}>{saved.customer}</div><div className="big" style={{ marginTop: 6 }}>{rupees(saved.amount)}</div></>}
          </div>
          <div className="changed"><span>
            {saved.kind === 'stock' && <>+ {lineSummary}</>}
            {saved.kind === 'payment' && <>{t('balanceAfter')}: <b>{rupees(saved.balance)}</b></>}
          </span></div>
        </>}
        {saved.kind === 'bill' && saved.unrecorded && <p className="lab" style={{ marginTop: 12 }}>{t('unrecordedNote')}</p>}
        {saved.kind === 'bill' && <>
          <a className="wa tap" href={`https://wa.me/${saved.kind === 'bill' && saved.phone ? (saved.phone.length === 10 ? '91' + saved.phone : saved.phone) : ''}?text=${waText}`} target="_blank" rel="noreferrer" style={{ color: '#137A3C', boxShadow: 'inset 0 0 0 2px #1FA855', textDecoration: 'none' }}>
            <Icon name="wa" size={26} />{saved.customer ? `${saved.customer} ${t('sendWa')}` : t('sendWaWalkIn')}
          </a>
          <div className="undorow" style={{ marginTop: 36 }}><span className="lab">{t('mistake')}</span>
            <Tap className="undo" style={{ height: 56, padding: '0 22px', background: '#fff', boxShadow: 'inset 0 0 0 2px #8A7A66' }} onClick={onUndo}>{t('removeBill')}</Tap></div>
        </>}
      </main>
      <div className="flowact"><Tap className="btn primary" onClick={() => navigate('/', true)}><Icon name="home" size={24} />{t('goHome')}</Tap></div>
      <BottomBar flow onMic={() => navigate('/bolo?new=' + Date.now(), true)} />
    </div>
  )
}
