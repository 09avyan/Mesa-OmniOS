import { useEffect, useRef, useState } from 'react'
import { useT, rupees, type Key } from '../lib/i18n'
import { useStore } from '../lib/store'
import { supabase } from '../lib/supabase'
import { pickBest } from '../voice/pickBest'
import { listen, speak, speechSupported, type ListenError } from '../lib/speech'
import { canUndo, speakOn, speakRate } from '../lib/prefs'
import { custLabel, invalidateShop, loadShop, type Customer, type Shop, type ShopMatchable } from '../lib/shop'
import { parse, parseItems } from '../voice/parse'
import { tokenize } from '../voice/normalize'
import { askAi, needsAi } from '../voice/ai'
import { billLinePayload, buildDraft, draftTotal, lineFrom, lineTotal, linesReady, searchItems, withVariant, type Draft, type Line } from '../voice/draft'
import { chooseFlavour, recordSales } from '../voice/flavour'
import { correctionRest, isConfirm } from '../voice/correction'
import { parse as parseQuestion } from '../lib/assistant'
import { goBack, navigate } from '../lib/router'
import { errorFx, successFx } from '../lib/feedback'
import { askText, FlowBar, HomeBtn, LoadError, Sheet, Tap, toast, TopBar, type MicProps } from '../components/ui'
import { enqueueBill, isOffline, newClientKey } from '../lib/offlineQueue'
import { NumberSheet } from '../components/Pad'
import { Icon } from '../components/Icon'
import { billMessage } from '../components/BillCard'
import { UpiQr } from '../components/UpiSheet'

type Stage = 'listen' | 'review' | 'done'
type Saved = { kind: 'bill'; billId: string; token: string; queued?: boolean; savedAt: number; total: number; discount: number; phone?: string; fromOrder?: boolean; customer: string | null; pay: string; balance: number | null; unrecorded: boolean; lines: Line[] }
  | { kind: 'stock'; lines: Line[] } | { kind: 'payment'; customer: string; amount: number; balance: number }

const unitLabel = (u?: string) => ({ kg: 'kg', g: 'g', l: 'L', ml: 'ml', pc: '', pack: 'pkt' } as Record<string, string>)[u ?? ''] ?? ''
// Item name in the owner's language: catalogue has Hindi / Hinglish / English; the shop's own name wins for Hinglish
// a flavour/size entry is always named in full ("Maggi Masala 70g"); old stored shop names don't know the variant
const itemLabel = (m: ShopMatchable, lang: string) => lang === 'hi' ? m.hi : lang === 'en' ? m.en : m.family ? m.hinglish : m.shop?.name ?? m.hinglish
const varLabel = (m: ShopMatchable, lang: string) => (lang === 'hi' ? m.variantHi : m.variant) ?? ''
/** bill text for WhatsApp, one line per item with flavour/size ("Maggi Masala 70g × 2 = ₹28") */
const billText = (shopName: string, lang: string, total: number, lines: Line[], link: string) =>
  billMessage(shopName, lang, total, lines.filter((l) => l.match).map((l) => ({ name: itemLabel(l.match!, lang), qty: l.qty ?? 0, amount: lineTotal(l) })), link)
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
  const [shopErr, setShopErr] = useState(false)
  const stopRef = useRef<{ stop(): void } | null>(null)
  const startRef = useRef<(append: boolean) => void>(() => {})
  const draftRef = useRef<Draft | null>(null)
  draftRef.current = draft

  const fetchShop = () => { setShopErr(false); invalidateShop(); loadShop().then(setShop, () => setShopErr(true)) }
  useEffect(fetchShop, [])

  function start(append = false) {
    setErr(null); setWords(''); setAppendMode(append)
    if (!speechSupported()) { setErr('unsupported'); setStage(append ? 'review' : 'listen'); return }
    setListening(true)
    if (!append) setStage('listen')
    stopRef.current = listen({
      lang: lang === 'en' ? 'en-IN' : 'hi-IN',
      silenceMs: 2600, // short pauses between items are fine; the Ho gaya button ends it at once
      onWords: setWords,
      onDone: (text, alts) => { setListening(false); understand(text, append, alts) },
      onError: (e) => { setListening(false); setErr(e); if (e === 'no-speech' || e === 'other' || e === 'network') errorFx() },
    })
  }
  startRef.current = start
  // Start listening as soon as the screen opens (the owner already pressed the mic). ?say= lets tests and demos inject words.
  useEffect(() => {
    const q = new URLSearchParams(location.search), say = q.get('say')
    if (q.get('manual')) { loadShop().then((s) => { setShop(s); setDraft({ intent: q.get('manual') === 'stock' ? 'stock_in' : 'bill', heard: '', customerName: null, customer: null, customerSure: true, customerOthers: [], lines: [], amount: null, pay: null }); setStage('review') }) }
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
        setDraft({ intent: 'bill', heard: '', customerName: c?.name ?? o.customer_name, customer: c, customerSure: true, customerOthers: [], lines, amount: null, pay: null, phone: o.phone, orderId: o.id })
        setStage('review')
      })
    }
    else if (say) { setWords(say); loadShop().then(() => understand(say, false)) } else start(false)
    return () => stopRef.current?.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function understand(heard: string, append: boolean, alts?: string[]) {
    const s = shop ?? await loadShop()
    setShop(s)
    await Promise.race([s.uniReady, new Promise((r) => setTimeout(r, 4000))])   // the full product list must be in before we guess what was said
    // the phone gives several guesses of what was said: use the one the rules understand best
    const best = alts && alts.length > 1 ? pickBest(alts, s.index, s.customers.map((c) => c.name), { recent: new Set([...Object.keys(s.flavour), ...Object.values(s.flavour).flat()]) }) : null
    const text = best?.text ?? heard
    const cur = draftRef.current // latest bill, not the one from when listening started
    if (append && cur) {
      // more items or corrections while reviewing: same item again = new quantity, otherwise add
      // a name said now (e.g. "Sharma ji ka hai") fills the customer; the rest are items
      if (isConfirm(text)) { setDraft({ ...cur, lines: cur.lines.map((l) => (l.match ? { ...l, sure: true, locked: true } : l)) }); setStage('review'); return }
      const rest = correctionRest(text)
      if (rest !== null) {
        // "nahi, cheeni": swap the item just rejected (the last "Yahi wali?" row, else the last line); never add a second line
        const p = rest ? parseItems(tokenize(rest), s.index).find((x) => x.candidates.length) : null
        const lines = [...cur.lines]
        if (p && lines.length) {
          let t = -1
          for (let i = lines.length - 1; i >= 0; i--) if (!lines[i].sure && !lines[i].locked) { t = i; break }
          if (t < 0) t = lines.length - 1
          const nl = lineFrom(p, s)
          if (nl.match) lines[t] = { ...nl, key: lines[t].key, qty: p.qty != null ? nl.qty : lines[t].qty, sure: true, locked: true }
        }
        setDraft({ ...cur, lines }); setStage('review'); return
      }
      const full = parse(text, s.index, s.customers.map((c) => c.name))
      const items = full.intent === 'bill' || full.intent === 'stock_in' ? full.items : parseItems(tokenize(text), s.index)
      const lines = [...cur.lines]
      if (full.customer && !cur.customerName && cur.intent === 'bill') { cur.customerName = full.customer; cur.customerSure = full.customerSure; cur.customer = s.customers.find((c) => c.name === full.customer) ?? null }
      for (const p of items) {
        const nl = lineFrom(p, s)
        const i = lines.findIndex((l) => l.match && nl.match && l.match.id === nl.match.id)
        if (i >= 0) lines[i] = { ...lines[i], qty: nl.qty ?? lines[i].qty }; else if (nl.match || nl.qty != null) lines.push(nl)
      }
      setDraft({ ...cur, lines }); setStage('review'); return
    }
    let p = parse(text, s.index, s.customers.map((c) => c.name))
    // opened from the Maal tab: whatever is said is stock coming in
    if (new URLSearchParams(location.search).get('stock') && (p.intent === 'bill' || p.intent === 'unknown') && p.items.length) p = { ...p, intent: 'stock_in', customer: null, customerSure: true }
    // a question ("aaj kitna bika", "Sharma ji ka udhaar") has no quantities: hand it to Poochho, the rules-based answerer
    if (!new URLSearchParams(location.search).get('stock') && (p.intent === 'bill' || p.intent === 'unknown' || p.intent === 'query') && p.items.every((i) => i.qty == null && i.rupees == null) && parseQuestion(text)) {
      navigate('/poochho?q=' + encodeURIComponent(text), true); return
    }
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

  const fix = (line: Line) => (patch: Partial<Line>) => draft && setDraft({ ...draft, lines: draft.lines.map((l) => l.key === line.key ? { ...l, ...patch, locked: true } : l) })

  if (shopErr && !shop) return <div className="app"><main className="screen v2"><TopBar back="/" /><LoadError onRetry={fetchShop} /></main></div>

  // ---------- LISTEN ----------
  if (stage === 'listen') {
    const msg = err === 'denied' ? t('micDenied') : err === 'unsupported' ? t('noMicSupport') : err === 'network' ? t('offline') : err ? t('noSpeech') : null
    const live = listening && shop && words ? parse(words, shop.index, shop.customers.map((c) => c.name)) : null
    return (
      <div className="app">
        <main className="screen v2 has-flow">
          <TopBar icon="x" back="/" title={listening ? t('billBanRaha') : msg ? t('notUnderstood') : t('listenTitle')} />
          {listening && <div className="vlisten"><i />{t('sunRaha')}</div>}
          <p className="vsaid" aria-live="polite">{words}{listening && <i className="caret" />}</p>
          {live && shop && <LivePreview p={live} shop={shop} />}
          {msg && <><div className="err" role="alert">{msg}</div><div className="gap16" /><HomeBtn /></>}
          {!listening && <TypeBox value={typed} onChange={setTyped} onGo={() => typed.trim() && understand(typed.trim(), false)} />}
        </main>
        {listening
          ? <div className="vfoot vlfoot"><div className="vwave" aria-hidden="true">{[12, 28, 40, 20, 48, 32, 16, 44, 24, 36, 16, 28].map((h, i) => <i key={i} style={{ maxHeight: h }} />)}</div>
              <Tap className="btn vo" onClick={() => stopRef.current?.stop()}><Icon name="tick" size={22} stroke={2.6} />{t('hoGaya')}</Tap></div>
          : <FlowBar mic={{ listening, micLabel: t('mic'), onMic: () => start(false) }}>{msg ? <Tap className="btn primary wide" onClick={() => start(false)}>{t('listenAgain')}</Tap> : <div className="sum" />}</FlowBar>}
      </div>
    )
  }

  // ---------- DONE ----------
  if (stage === 'done' && saved) return <SavedView saved={saved} onUndo={async () => {
    if (saved.kind !== 'bill' || !saved.billId) return
    if (!canUndo(saved.savedAt)) { toast({ text: t('undoGone') }); return }
    const { error } = await supabase.rpc('undo_bill', { p_bill: saved.billId })
    if (error) { errorFx(); toast({ text: t('saveFailed') }); return }
    invalidateShop(); toast({ text: saved.fromOrder ? t('orderBackReady') : t('billRemoved') }); navigate(saved.fromOrder ? '/orders' : '/', true)
  }} />

  if (!draft || !shop) return null
  const mic: MicProps = { listening, micLabel: listening ? t('micSpeaking') : t('micFix'), onMic: () => listening ? stopRef.current?.stop() : start(true) }

  // ---------- REVIEW: question / galla / unknown ----------
  if (draft.intent === 'query') return <AnswerView draft={draft} mic={mic} />
  if (draft.intent === 'galla') return <GallaView amount={draft.amount} mic={mic} />
  if (draft.intent === 'unknown' || (draft.intent !== 'payment' && draft.intent !== 'bill' && draft.lines.length === 0)) return (
    <div className="app">
      <main className="screen v2 has-flow">
        <TopBar title={t('notUnderstood')} back="/" />
        <p className="vlab">{t('heard')}: "{draft.heard}"</p>
        <p style={{ marginTop: 16 }}>{t('notUnderstoodBody')}</p>
        <div className="vc" style={{ marginTop: 8, padding: 16, lineHeight: '30px' }}>
          <b>"Sharma ji, 2 kilo cheeni"</b><br /><b>"Maal aaya, 10 Aashirvaad atta"</b><br /><b>"Gupta ji ne 500 diye"</b><br /><b>"Cheeni kitni bachi?"</b>
        </div>
        <TypeBox value={typed} onChange={setTyped} onGo={() => typed.trim() && understand(typed.trim(), false)} />
        <div className="gap16" /><HomeBtn />
      </main>
      <FlowBar mic={{ listening, micLabel: listening ? t('micSpeaking') : t('mic'), onMic: () => start(false) }}><Tap className="btn primary wide" onClick={() => start(false)}>{t('listenAgain')}</Tap></FlowBar>
    </div>
  )
  if (draft.intent === 'payment') return <PaymentView draft={draft} shop={shop} mic={mic} onSaved={(s) => { setSaved(s); setStage('done') }} />

  // ---------- REVIEW: bill / stock in ----------
  const isBill = draft.intent === 'bill'
  const ready = isBill ? linesReady(draft) && draft.customerSure : draft.lines.length > 0 && draft.lines.every((l) => l.sure && l.match && l.qty != null && l.qty > 0)
  const total = draftTotal(draft)
  const udhaarBlocked = isBill && draft.pay === 'udhaar' && !draft.customerName
  return (
    <ReviewScreen
      draft={draft} setDraft={setDraft} shop={shop} isBill={isBill} ready={ready} total={total} udhaarBlocked={udhaarBlocked}
      fix={fix} mic={mic} listening={listening} words={appendMode ? words : ''}
      onSaved={(s) => { setSaved(s); setStage('done') }}
    />
  )
}

// While speaking: the bill forms line by line, with the same unit-aware totals as the Check screen.
function LivePreview({ p, shop }: { p: ReturnType<typeof parse>; shop: Shop }) {
  const { lang, t } = useT()
  if (!p.customer && p.items.length === 0) return null
  const lines = p.items.map((i) => ({ i, l: lineFrom({ ...i, qty: i.qty ?? 1 }, shop) }))
  const sofar = lines.reduce((a, { l }) => a + lineTotal(l), 0)
  return (
    <div className="vc">
      {p.customer && <div className="vrow" style={{ minHeight: 56 }}><span className="t"><b>{p.customer}</b></span></div>}
      {lines.map(({ i, l }, k) => (
        <div key={k} className="vrow">
          <span className="t"><b>{l.match ? itemLabel(l.match, lang) : `"${i.said}"`}</b><span>{l.match ? `${fmtQty(l.qty, l.match.shop?.unit ?? l.match.unit)}${l.price != null ? ` × ₹${+l.price.toFixed(2)}` : ''}` : t('whatIsThis')}</span></span>
          {l.price != null && <span className="a">{rupees(lineTotal(l))}</span>}
        </div>
      ))}
      {sofar > 0 && <div className="vrow" style={{ minHeight: 56 }}><span className="t"><b>{t('abTak')}</b></span><span className="a vfig" style={{ fontSize: 24 }}>{rupees(sofar)}</span></div>}
    </div>
  )
}

function TypeBox({ value, onChange, onGo }: { value: string; onChange: (v: string) => void; onGo: () => void }) {
  const { t } = useT()
  return (
    <div className="field" style={{ marginTop: 28 }}>
      <label htmlFor="typed" className="vlab">{t('typeInstead')}</label>
      <div style={{ display: 'flex', gap: 10 }}>
        <input id="typed" className="input" value={value} placeholder={t('typeHint')} onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onGo()} />
        <Tap className="btn primary small" style={{ minWidth: 72 }} disabled={!value.trim()} onClick={onGo}>{t('next')}</Tap>
      </div>
    </div>
  )
}

// ---------- bill / stock review card ----------
function ReviewScreen({ draft, setDraft, shop, isBill, ready, total, udhaarBlocked, fix, mic, listening, words, onSaved }: {
  draft: Draft; setDraft: (d: Draft) => void; shop: Shop; isBill: boolean; ready: boolean; total: number; udhaarBlocked: boolean
  fix: (l: Line) => (p: Partial<Line>) => void; mic: MicProps; listening: boolean; words: string; onSaved: (s: Saved) => void
}) {
  const { t } = useT()
  const [pick, setPick] = useState<Line | null>(null)
  const [pad, setPad] = useState<{ line: Line; field: 'qty' | 'price' } | null>(null)
  const [disc, setDisc] = useState(0)
  const [discOpen, setDiscOpen] = useState(false)
  const [custOpen, setCustOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState<'check' | 'pay' | 'upi'>('check')
  const clientKey = useRef(newClientKey()) // one key per bill: a double tap or a retry can never save it twice
  const { store } = useStore()
  const pending = draft.lines.find((l) => !l.sure || !l.match) ?? (isBill && !draft.customerSure ? draft.lines[0] : undefined)
  const custPending = isBill && !draft.customerSure
  const reason = draft.lines.length === 0 ? t('sayItems') : custPending ? t('pickCustFirst').replace('{name}', draft.customerName ?? '') : pending ? t('answerFirst') : isBill && draft.lines.some((l) => l.price == null) ? t('priceFirst') : t('fixFirst')
  const prevBal = draft.customer?.balance ?? 0
  const net = Math.max(0, total - disc)

  async function save(pay: Draft['pay'] = draft.pay) {
    if (busy) return
    setBusy(true)
    const lines = draft.lines.map(billLinePayload)
    const payload = { customer: draft.customerName, customer_id: draft.customer?.id ?? null, order_id: draft.orderId ?? null, new_customer: !!draft.newCustomer, tag: draft.tag ?? null, phone: draft.phone ?? draft.customer?.phone ?? null, pay, discount: disc, voice_text: draft.heard, lines, client_key: clientKey.current }
    const res = isBill ? await supabase.rpc('save_bill', { p: payload }) : await supabase.rpc('add_stock', { p: { reason: 'stock_in', lines } })
    setBusy(false)
    if (res.error) {
      errorFx()
      // no internet: keep the bill on this phone, it goes through when the net is back
      if (isBill && isOffline(res.error)) {
        enqueueBill(payload)
        onSaved({ kind: 'bill', billId: '', token: '', queued: true, savedAt: Date.now(), total: net, discount: disc, fromOrder: !!draft.orderId, phone: '', customer: draft.customerName, pay: pay ?? 'cash', balance: null, unrecorded: false, lines: draft.lines })
        return
      }
      toast({ text: t('saveFailed') }); return
    }
    successFx(); invalidateShop()
    // flavour engine learns what this shop really sold (kept on this phone, and by the server through save_bill)
    if (isBill && shop) shop.flavour = recordSales(shop.flavour, draft.lines.filter((l) => l.match).map((l) => ({ family: l.match!.family, id: l.match!.id })), shop.shopKey)
    if (isBill) {
      const r = res.data as { bill_id: string; share_token: string; total: number; balance: number | null; has_unrecorded: boolean }
      onSaved({ kind: 'bill', billId: r.bill_id, token: r.share_token, savedAt: Date.now(), total: Number(r.total), discount: disc, fromOrder: !!draft.orderId, phone: (draft.phone ?? draft.customer?.phone ?? '').replace(/\D/g, ''), customer: draft.customerName, pay: pay ?? 'cash', balance: r.balance == null ? null : Number(r.balance), unrecorded: r.has_unrecorded, lines: draft.lines })
    } else onSaved({ kind: 'stock', lines: draft.lines })
  }

  const fixFirst = () => (document.querySelector('.vit.u,.vit.q') ?? document.querySelector('.pricebtn'))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  useEffect(() => { if (!ready) setTimeout(() => { const u = document.querySelectorAll('.vit.q'); const last = u[u.length - 1]; if (last && last.getBoundingClientRect().bottom > window.innerHeight - 260) last.scrollIntoView({ block: 'center' }) }, 300) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const goPay = () => { setDraft({ ...draft, pay: null }); setStep('pay'); window.scrollTo(0, 0) } // nothing is pre-selected for money
  const choose = (p: 'cash' | 'upi' | 'udhaar') => { setDraft({ ...draft, pay: p }); if (p === 'upi') { setStep('upi'); window.scrollTo(0, 0) } }

  const checkBar = !isBill
    ? <FlowBar mic={mic}>
        {ready ? <Tap className="btn primary wide" disabled={busy} onClick={() => save()}><Icon name="tick" size={22} stroke={2.6} />{busy ? t('saving') : t('stockAdd')}</Tap>
          : <Tap className="btn primary wide" onClick={fixFirst}><Icon name="up" size={20} stroke={2.6} />{cap(reason)}</Tap>}
      </FlowBar>
    : <FlowBar mic={mic}>
        <div className="sum"><small>{t('itemsN').replace('{n}', String(draft.lines.length))}</small><b>{rupees(net)}</b></div>
        {ready ? <Tap className="btn primary" onClick={goPay}>{t('next')}<Icon name="chev" size={22} stroke={2.6} /></Tap>
          : <Tap className="btn primary" onClick={fixFirst}><Icon name="up" size={20} stroke={2.6} />{t('confirmFirst')}</Tap>}
      </FlowBar>

  const pickers = (
    <>
      <NumberSheet open={discOpen} title={t('discount')} initial={disc || null} unit="₹" onClose={() => setDiscOpen(false)} onDone={(n) => setDisc(Math.min(n, total))} />
      <CustomerPicker open={custOpen} shop={shop} current={draft.customerName} onClose={() => setCustOpen(false)}
        onPick={(name, c) => { setDraft({ ...draft, customerName: name, customer: c, customerSure: true }); setCustOpen(false) }} />
    </>
  )

  // ---------- UPI: the QR, nothing else ----------
  if (isBill && step === 'upi') {
    const upiId = store?.upi_id ?? null
    return (
      <div className="app">
        <main className="screen v2 has-foot vcenter">
          <TopBar title={t('upiTitle')} onBack={() => { setDraft({ ...draft, pay: null }); setStep('pay') }} />
          <div className="vbig" style={{ marginLeft: 0 }}>{rupees(net)}</div>
          {upiId
            ? <><div className="vlab" style={{ marginTop: 4 }}>{t('showQr')}</div>
                <UpiQr upi={upiId} name={store?.name ?? ''} amount={net} />
                <div style={{ marginTop: 16, font: '600 18px/24px var(--font)' }}>{upiId}</div></>
            : <p className="vlab" style={{ marginTop: 24 }}>{t('upiMissingBody')}</p>}
        </main>
        <div className="vfoot vgrid2 w">
          <Tap className="btn outline" onClick={() => { setDraft({ ...draft, pay: null }); setStep('pay') }}><Icon name="back" size={22} />{t('change')}</Tap>
          <Tap className="btn primary" disabled={busy} onClick={() => save('upi')}><Icon name="tick" size={22} stroke={2.6} />{busy ? t('saving') : t('upiGot')}</Tap>
        </div>
        {pickers}
      </div>
    )
  }

  // ---------- PAY ----------
  if (isBill && step === 'pay') {
    const nm = draft.customerName
    const why = !draft.pay ? t('dkChoose') : udhaarBlocked ? t('udhaarNeedsName') : ''
    return (
      <div className="app">
        <main className="screen v2 has-foot2">
          <TopBar title={t('pickMoney')} onBack={() => setStep('check')} />
          <div className="vc vcenter" style={{ padding: '24px 20px' }}>
            <div className="vlab">{nm ?? t('walkInShort')} · {t('itemsN').replace('{n}', String(draft.lines.length))}</div>
            <div className="vbig" style={{ marginTop: 8 }}>{rupees(net)}</div>
          </div>
          <div className="vpay">
            {(['cash', 'upi', 'udhaar'] as const).map((p) => (
              <Tap key={p} className={`vtile ${p === 'udhaar' ? 'ud' : ''}`} aria-pressed={draft.pay === p} onClick={() => choose(p)}>
                <Icon name={p === 'cash' ? 'cash' : p === 'upi' ? 'qr' : 'book'} size={28} />{t(p)}
              </Tap>
            ))}
          </div>
          {nm && (
            <div className="vc" style={{ marginTop: 16 }}>
              <div className="vrow"><span className="vav">{nm.trim().slice(0, 2).toUpperCase()}</span>
                <span className="t"><b>{nm}</b><span>{draft.pay === 'udhaar' ? `${rupees(prevBal)} → ${rupees(prevBal + net)}` : t('prevUdhaar')}</span></span>
                {draft.pay !== 'udhaar' && prevBal > 0 && <span className="a ud">{rupees(prevBal)}</span>}</div>
              {draft.pay !== 'upi' && <div className="vrow" style={{ minHeight: 64 }}>
                <label htmlFor="ph" className="vlab" style={{ flex: 'none' }}>WhatsApp</label>
                <input id="ph" className="input" style={{ minHeight: 48, background: 'transparent', boxShadow: 'none', textAlign: 'right' }} inputMode="tel" maxLength={13} placeholder="98xxxxxxxx" value={draft.phone ?? draft.customer?.phone ?? ''}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value.replace(/[^\d+]/g, '') })} /></div>}
            </div>
          )}
          <Tap className="vrow vc" style={{ marginTop: 12, minHeight: 56 }} onClick={() => setDiscOpen(true)}><span className="t"><b>{t('discount')}</b></span><span className="a">{disc ? `− ${rupees(disc)}` : <Icon name="chev" size={20} />}</span></Tap>
        </main>
        <div className="vfoot">
          {why && <p className="why">{why}</p>}
          {!draft.pay ? <div className="btn" aria-disabled="true"><Icon name="tick" size={22} />{t('saveBill')}</div>
            : udhaarBlocked ? <Tap className="btn primary" onClick={() => setCustOpen(true)}><Icon name="user" size={22} />{t('addName')}</Tap>
            : <Tap className="btn primary" disabled={busy} onClick={() => save()}><Icon name="tick" size={22} stroke={2.6} />{busy ? t('saving') : `${t('saveBill')} · ${rupees(net)}`}</Tap>}
        </div>
        {pickers}
      </div>
    )
  }

  // ---------- CHECK ----------
  const who = isBill && (
    <Tap className="vwho" onClick={() => setCustOpen(true)}><Icon name="user" size={20} />{draft.customerName ?? t('addName')}</Tap>
  )
  return (
    <div className="app">
      <main className="screen v2 has-flow">
        <TopBar title={isBill ? t('billCheck') : t('stockInTitle')} back="/" right={who || undefined} />
        {isBill && draft.customerName && !draft.customer && draft.customerOthers.length > 1 && !draft.customerSure && (
          <div className="vc vit q" style={{ marginBottom: 12 }}>
            <b>{t('whichOne')}</b><span />
            <div className="ask" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
              {draft.customerOthers.map((c) => <Tap key={c.id} className="btn s outline" style={{ justifyContent: 'space-between' }} onClick={() => setDraft({ ...draft, customer: c, customerName: c.name, customerSure: true, newCustomer: false })}>
                <span>{custLabel(c)}</span>{c.balance > 0 && <span className="ud">{rupees(c.balance)}</span>}</Tap>)}
              <Tap className="btn s outline" onClick={async () => { const tg = await askText({ title: t('tagAsk') }) ?? ''; setDraft({ ...draft, customer: null, newCustomer: true, tag: tg.trim() || undefined, customerSure: true }) }}><Icon name="plus" size={22} />{t('newOne')} {draft.customerName}</Tap>
            </div>
          </div>
        )}
        {isBill && !draft.customerSure && draft.customerName && draft.customerOthers.length <= 1 && (
          <div className="vc vit q" style={{ marginBottom: 12 }}>
            <b>{t('thisName')}</b><span />
            <div className="ask">
              <Tap className="btn s primary" onClick={() => setDraft({ ...draft, customerSure: true })}><Icon name="tick" size={22} stroke={2.6} />{t('yes')}</Tap>
              <Tap className="btn s outline" onClick={() => {
                const extra = parseItems(tokenize(draft.customerName!), shop.index).map((p) => lineFrom({ ...p, qty: p.qty ?? 1 }, shop))
                setDraft({ ...draft, customerName: null, customer: null, customerSure: true, lines: [...extra, ...draft.lines] })
              }}>{t('itsAnItem')}</Tap>
            </div>
          </div>
        )}
        {isBill && draft.customer && <Tap className="ulink" style={{ minHeight: 48, font: '600 18px/24px var(--font)' }} onClick={async () => { const tg = await askText({ title: t('tagAsk') }) ?? ''; setDraft({ ...draft, customer: null, newCustomer: true, tag: tg.trim() || undefined, customerSure: true }) }}>{t('notThisOne')}</Tap>}

        {draft.lines.length === 0 && <p className="vsaid" style={{ color: 'var(--vt)' }}>{t('sayItems')}</p>}
        {draft.lines.length > 0 && <div className="vc">
          {draft.lines.map((l) => <LineRow key={l.key} l={l} isBill={isBill} onPick={() => setPick(l)} onPad={(field) => setPad({ line: l, field })} fix={fix(l)}
            onRemove={() => setDraft({ ...draft, lines: draft.lines.filter((x) => x.key !== l.key) })} />)}
        </div>}
        {listening && <p className="vsaid">{words || '…'}</p>}
        <Tap className="btn outline s" style={{ marginTop: 12 }} onClick={() => setPick({ key: 'new', said: '', match: null, candidates: [], sure: true, qty: 1, price: null, priceSure: false })}><Icon name="plus" size={22} />{t('addItemBtn')}</Tap>
      </main>
      {checkBar}

      <ItemPicker open={!!pick} line={pick} shop={shop} onClose={() => setPick(null)}
        onPick={(m) => { if (pick && pick.key === 'new') { const pr = m.shop?.price ?? m.shop?.learned_price ?? m.lastPrice ?? null; setDraft({ ...draft, lines: [...draft.lines, { key: 'n' + Date.now(), said: '', match: m, candidates: [m], sure: true, qty: 1, price: pr, priceSure: m.shop?.price != null || m.shop?.learned_price != null, flavour: chooseFlavour(m, '', shop, shop.flavour) }] }) } else if (pick) { const pr = m.shop?.price ?? m.shop?.learned_price ?? m.lastPrice ?? null; fix(pick)({ match: m, sure: true, price: pr, priceSure: m.shop?.price != null || m.shop?.learned_price != null, qty: pick.qty ?? 1, flavour: chooseFlavour(m, '', shop, shop.flavour) }) } setPick(null) }} />
      <NumberSheet open={!!pad} title={pad?.field === 'price' ? `${pad.line.match?.hinglish ?? ''} — ${t('priceAsk')}` : `${pad?.line.match?.hinglish ?? ''} — ${t('qtyAsk')}`}
        initial={pad ? (pad.field === 'price' ? pad.line.price : pad.line.qty) : null} unit={pad?.field === 'qty' ? unitLabel(pad.line.match?.unit) : '₹'}
        onClose={() => setPad(null)} onDone={(n) => pad && fix(pad.line)(pad.field === 'price' ? { price: n, priceSure: true } : { qty: n })} />
      {pickers}
    </div>
  )
}

function LineRow({ l, isBill, onPick, onPad, fix, onRemove }: { l: Line; isBill: boolean; onPick: () => void; onPad: (f: 'qty' | 'price') => void; fix: (p: Partial<Line>) => void; onRemove: () => void }) {
  const { t, lang } = useT()
  const [flOpen, setFlOpen] = useState(false)
  const unit = l.match?.shop?.unit ?? l.match?.unit
  const step = l.match?.loose && (unit === 'kg' || unit === 'l') ? 0.5 : 1
  const name = l.match ? itemLabel(l.match, lang) : `"${l.said}"`
  if (!l.match) return (
    <div className="vit q">
      <b>{name}</b><span />
      <div className="ask"><b>{t('whatIsThis')}</b><Tap className="btn s primary" onClick={onPick}>{t('pickItem')}</Tap><Tap className="btn s outline" onClick={onRemove}><Icon name="x" size={22} />{t('remove')}</Tap></div>
    </div>
  )
  const stepper = (
    <div className="vqty">
      <Tap aria-label="minus" onClick={() => (l.qty ?? 0) - step <= 0 ? onRemove() : fix({ qty: +((l.qty ?? 0) - step).toFixed(3) })}><Icon name="minus" size={22} /></Tap>
      <Tap aria-label="quantity" className="qv" onClick={() => onPad('qty')}><b>{fmtQty(l.qty, unit)}</b></Tap>
      <Tap aria-label="plus" onClick={() => fix({ qty: +((l.qty ?? 0) + step).toFixed(3) })}><Icon name="plus" size={22} /></Tap>
    </div>
  )
  const priceTxt = l.price == null ? t('priceAsk') : `₹${+l.price.toFixed(2)} ${unitLabel(unit) ? '/ ' + unitLabel(unit) : t('pricePerPc')}`
  return (
    <div className={`vit ${l.sure ? '' : 'q'}`}>
      <b>{name}</b>
      <span className="a">{isBill && l.price != null ? rupees(lineTotal(l)) : ''}</span>
      {isBill
        ? <Tap className="pricebtn" style={{ textAlign: 'left', color: 'var(--ink2)', minHeight: 48, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: l.price == null || !l.priceSure ? 'underline' : undefined, textUnderlineOffset: 4 }} onClick={() => onPad('price')}>{priceTxt}{l.price != null && !l.priceSure && ` · ${t('priceCheck')}`}</Tap>
        : <span />}
      {stepper}
      {!l.sure && (
        <div className="ask"><b>{t('thisOne')}</b>
          <Tap className="btn s primary" onClick={() => fix({ sure: true })}><Icon name="tick" size={22} stroke={2.6} />{t('yes')}</Tap>
          <Tap className="btn s outline" onClick={onPick}><Icon name="x" size={22} />{t('nahi')}</Tap></div>
      )}
      {l.flavour && l.match && (
        // flavour engine: never a blocking question. Auto-picked flavour shown as a small chip; a shop that really sells a mix gets the top few as one-tap choices.
        <div className="flv">
          {l.flavour.ask && <span className="vlab" style={{ alignSelf: 'center' }}>{t('flWhich')}</span>}
          {(l.flavour.ask ?? [l.match]).map((m) => <Tap key={m.id} className={`btn s ${l.flavour!.ask && m.id === l.match!.id ? 'primary' : 'outline'}`} onClick={() => (l.flavour!.ask ? fix(withVariant(l, m)) : setFlOpen(true))}>
            {l.flavour!.ask && m.id === l.match!.id && <Icon name="tick" size={22} stroke={2.6} />}{varLabel(m, lang)}{!l.flavour!.ask && ` · ${t('flChange')}`}</Tap>)}
          {l.flavour.ask && <Tap className="btn s outline" onClick={() => setFlOpen(true)}>{t('flChange')}</Tap>}
        </div>
      )}
      {l.flavour && (
        <Sheet open={flOpen} onClose={() => setFlOpen(false)}>
          <h2 className="h2">{t('flTitle')}</h2><div className="gap8" />
          <div className="stack" style={{ marginTop: 8, maxHeight: '60vh', overflowY: 'auto' }}>
            {l.flavour.options.map((m) => (
              <Tap key={m.id} className="rowb" style={{ minHeight: 56, ...(m.id === l.match?.id ? { boxShadow: 'inset 0 0 0 2px var(--ac)' } : {}) }} onClick={() => { fix(withVariant(l, m)); setFlOpen(false) }}>
                <span className="grow">{varLabel(m, lang)}</span>{m.id === l.match?.id && <Icon name="tick" size={22} stroke={3} />}</Tap>
            ))}
          </div>
        </Sheet>
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
            <span className="chev"><Icon name="chev" size={20} /></span>
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
function PaymentView({ draft, shop, mic, onSaved }: { draft: Draft; shop: Shop; mic: MicProps; onSaved: (s: Saved) => void }) {
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
      <main className="screen v2 has-flow">
        <TopBar title={t('paymentTitle')} back="/" right={cust ? <Tap className="vwho" onClick={() => setCust(null)}><Icon name="user" size={20} />{cust.name}</Tap> : undefined} />
        {!cust && (
          <>
            <p className="vlab" style={{ marginBottom: 12 }}>{draft.customerName ? `"${draft.customerName}" — ` : ''}{t('noSuchCustomer')}</p>
            <div className="vc">
              {choices.map((c) => <Tap key={c.id} className="vrow" onClick={() => setCust(c)}><span className="vav">{c.name.trim().slice(0, 2).toUpperCase()}</span><span className="t"><b>{c.name}</b></span><span className="a ud">{rupees(c.balance)}</span></Tap>)}
            </div>
          </>
        )}
        {cust && <div className="vc">
          <Tap className="vrow" style={{ minHeight: 88 }} onClick={() => setPadOpen(true)}><span className="vlab">{t('amount')}</span><span style={{ flex: 1 }} /><span className="vmid">{amount ? rupees(amount) : '?'}</span></Tap>
          <div className="vrow" style={{ minHeight: 56 }}><span className="t"><b style={{ fontWeight: 600 }}>{t('balanceNow')}</b></span><span className="a ud">{rupees(cust.balance)}</span></div>
          <div className="vrow" style={{ minHeight: 56 }}><span className="t"><b style={{ fontWeight: 600 }}>{t('balanceAfter')}</b></span><span className="a ud">{rupees(cust.balance - (amount ?? 0))}</span></div>
        </div>}
      </main>
      <FlowBar mic={mic}>
        <Tap className="btn primary wide" disabled={!cust || !amount || busy} onClick={save}><Icon name="tick" size={24} stroke={2.6} />{busy ? t('saving') : `${t('payDo')}${amount ? ' · ' + rupees(amount) : ''}`}</Tap>
      </FlowBar>
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
function AnswerView({ draft, mic }: { draft: Draft; mic: MicProps }) {
  const { t, lang } = useT()
  const m = draft.lines[0]?.match
  return (
    <div className="app">
      <main className="screen v2 has-flow">
        <TopBar title={t('answerTitle')} back="/" />
        <p className="vlab">{t('heard')}: "{draft.heard}"</p>
        <div className="vc vcenter" style={{ marginTop: 16, padding: '32px 24px' }}>
          {m && <div className="h2">{lang === 'hi' ? m.hi : m.shop?.name ?? m.hinglish}</div>}
          {m?.shop?.stock_known
            ? <><div className="vbig" style={{ marginTop: 8 }}>{fmtQty(Math.max(0, m.shop.stock), m.shop.unit)}</div><div className="vlab">{t('stockLeft')}</div></>
            : <p style={{ marginTop: 8 }}>{m ? t('stockUnknown') : t('notUnderstood')}</p>}
        </div>
      </main>
      <FlowBar mic={mic}><HomeBtn /><Tap className="btn primary wide" onClick={() => goBack()}>{t('ok')}</Tap></FlowBar>
    </div>
  )
}

// ---------- "Galla mein 4,200 hai" ----------
function GallaView({ amount, mic }: { amount: number | null; mic: MicProps }) {
  const { t } = useT()
  const { store } = useStore()
  const [cash, setCash] = useState<number | null>(null)
  useEffect(() => { supabase.rpc('today_summary').then(({ data }) => setCash(Number((data as { cash: number } | null)?.cash ?? 0))) }, [])
  useEffect(() => { if (store && amount != null && cash != null) supabase.from('usage_events').insert({ store_id: store.id, kind: 'galla', meta: { said: amount, cash } }).then(() => {}) }, [store, amount, cash])
  const gap = amount != null && cash != null ? amount - cash : null
  return (
    <div className="app">
      <main className="screen v2 has-flow">
        <TopBar title={t('gallaTitle')} back="/" />
        <div className="vc">
          <div className="vrow"><span className="t"><b style={{ fontWeight: 600 }}>{t('gallaSaid')}</b></span><span className="a">{amount != null ? rupees(amount) : '?'}</span></div>
          <div className="vrow"><span className="t"><b style={{ fontWeight: 600 }}>{t('gallaBills')}</b></span><span className="a">{cash != null ? rupees(cash) : '…'}</span></div>
        </div>
        {gap != null && (
          <div className={gap === 0 ? 'vbanner' : 'vnote'} style={{ marginTop: 16, display: 'block' }}>
            <div className="h2">{gap === 0 ? t('gallaMatch') : `${rupees(Math.abs(gap))} ${gap < 0 ? t('gallaLess') : t('gallaMore')}`}</div>
            {gap !== 0 && <p style={{ marginTop: 4 }}>{t('gallaNote')}</p>}
          </div>
        )}
      </main>
      <FlowBar mic={mic}><HomeBtn /><Tap className="btn primary wide" onClick={() => goBack()}>{t('ok')}</Tap></FlowBar>
    </div>
  )
}

// ---------- after ✓ ----------
function SavedView({ saved, onUndo }: { saved: Saved; onUndo: () => void }) {
  const { t, lang } = useT()
  const { store } = useStore()
  const link = saved.kind === 'bill' ? `${location.origin}/b/${saved.token}` : ''
  // WhatsApp text lists every line with its flavour/size ("Maggi Masala 70g x 2 = ₹28")
  const waText = saved.kind === 'bill' ? encodeURIComponent(billText(store?.name ?? '', lang, saved.total, saved.lines, link)) : ''
  const wa = saved.kind === 'bill' ? `https://wa.me/${saved.phone ? (saved.phone.length === 10 ? '91' + saved.phone : saved.phone) : ''}?text=${waText}` : ''
  const lineSummary = saved.kind !== 'payment' ? saved.lines.map((l) => `${fmtQty(l.qty, l.match?.unit)} ${l.match ? itemLabel(l.match, lang) : ''}`).join(', ') : ''
  const ud = saved.kind === 'bill' && saved.pay === 'udhaar' && !!saved.customer && saved.balance != null
  // lines that took the shop's stock below zero (the stock we hold in the app was already low or zero)
  const negative = saved.kind === 'bill' && saved.lines.some((l) => l.match?.shop?.stock_known && l.qty != null && l.match.shop.stock - l.qty < 0)
  const title = saved.kind === 'bill' ? (saved.queued ? t('queuedTitle') : ud ? t('wroteUdhaar') : t('billSavedV2')) : saved.kind === 'stock' ? t('stockAdded') : t('paySaved')
  const payWord = saved.kind === 'bill' ? (saved.pay === 'upi' ? 'UPI' : saved.pay === 'udhaar' ? t('udhaar') : 'Cash') : ''
  const sub = saved.kind === 'bill' ? [saved.queued ? '' : `#${saved.token.slice(0, 4).toUpperCase()}`, saved.customer ?? '', payWord].filter(Boolean).join(' · ') : saved.kind === 'payment' ? saved.customer : ''
  const big = saved.kind === 'bill' ? saved.total : saved.kind === 'payment' ? saved.amount : null
  return (
    <div className="app">
      <main className="screen v2 has-foot2 vcenter">
        <div className="vtop"><span style={{ flex: 1 }} /><Tap className="ib" aria-label={t('goHome')} onClick={() => navigate('/', true)}><Icon name="x" size={24} /></Tap></div>
        <div style={{ paddingTop: 8 }}>
          <span className="vdone"><Icon name={saved.kind === 'bill' && saved.queued ? 'cloudOff' : 'tick'} size={44} stroke={2.2} /></span>
          <h1 className="vh1" style={{ marginTop: 24 }}>{title}</h1>
          {sub && <p className="vlab" style={{ marginTop: 4 }}>{sub}</p>}
          {big != null && <div className="vbig" style={{ marginTop: 16 }}>{rupees(big)}</div>}
          {ud && <p className="vlab ud" style={{ marginTop: 4 }}>{t('newBal')} {rupees(saved.kind === 'bill' ? saved.balance ?? 0 : 0)}</p>}
          {saved.kind === 'payment' && <p className="vlab" style={{ marginTop: 4 }}>{t('newBal')} {rupees(saved.balance)}</p>}
          {saved.kind === 'stock' && <p className="vlab" style={{ marginTop: 16 }}>+ {lineSummary}</p>}
        </div>
        {saved.kind === 'bill' && saved.queued && <p className="vlab" style={{ marginTop: 16 }}>{t('queuedToast')}</p>}
        {saved.kind === 'bill' && saved.unrecorded && <p className="vlab" style={{ marginTop: 16 }}>{t('unrecordedNote')}</p>}
        {negative && <div className="vnote" style={{ marginTop: 24, textAlign: 'left' }}><b>{t('stockWasZero')}</b><Tap className="btn s outline" onClick={() => navigate('/maal')}>{t('openMaal')}</Tap></div>}
        {saved.kind === 'bill' && !saved.queued && canUndo(saved.savedAt) && (
          <div className="vc" style={{ marginTop: negative ? 12 : 32, padding: '8px 8px 8px 20px', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
            <span className="vlab" style={{ flex: 1 }}>{t('oops')}</span>
            <Tap className="btn outline s" style={{ padding: '0 16px', width: 'auto' }} onClick={onUndo}><Icon name="undo" size={22} />{t('undoBill')}</Tap>
          </div>
        )}
      </main>
      <div className="vfoot flat">
        {saved.kind === 'bill' && !saved.queued && <a className="btn wa tap" style={{ textDecoration: 'none' }} href={wa} target="_blank" rel="noreferrer"><Icon name="send" size={22} />{t('waSend')}</a>}
        <div className="vgrid2">
          <HomeBtn />
          <Tap className="btn outline s" onClick={() => navigate('/bolo?new=' + Date.now(), true)}><Icon name="plus" size={22} />{t('newBill')}</Tap>
        </div>
      </div>
    </div>
  )
}
