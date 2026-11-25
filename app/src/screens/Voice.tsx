import { useEffect, useRef, useState } from 'react'
import { useT, rupees, type Key } from '../lib/i18n'
import { useStore } from '../lib/store'
import { supabase } from '../lib/supabase'
import { pickBest } from '../voice/pickBest'
import { listen, speak, speechSupported, type ListenError } from '../lib/speech'
import { speakOn, speakRate } from '../lib/prefs'
import { custLabel, invalidateShop, loadShop, type Customer, type Shop, type ShopMatchable } from '../lib/shop'
import { parse, parseItems } from '../voice/parse'
import { tokenize } from '../voice/normalize'
import { askAi, needsAi } from '../voice/ai'
import { billLinePayload, buildDraft, draftTotal, lineFrom, lineTotal, linesReady, searchItems, withVariant, type Draft, type Line } from '../voice/draft'
import { chooseFlavour, recordSales } from '../voice/flavour'
import { goBack, navigate } from '../lib/router'
import { errorFx, successFx } from '../lib/feedback'
import { askText, BackBar, FlowBar, Sheet, Tap, toast, type MicProps } from '../components/ui'
import { NumberSheet } from '../components/Pad'
import { Icon } from '../components/Icon'
import { billMessage } from '../components/BillCard'
import { UpiQr } from '../components/UpiSheet'

type Stage = 'listen' | 'review' | 'done'
type Saved = { kind: 'bill'; billId: string; token: string; total: number; discount: number; phone?: string; fromOrder?: boolean; customer: string | null; pay: string; balance: number | null; unrecorded: boolean; lines: Line[] }
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
    // the phone gives several guesses of what was said: use the one the rules understand best
    const best = alts && alts.length > 1 ? pickBest(alts, s.index, s.customers.map((c) => c.name)) : null
    const text = best?.text ?? heard
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
    const live = listening && shop && words ? parse(words, shop.index, shop.customers.map((c) => c.name)) : null
    const sofar = live ? live.items.reduce((a, i) => { const m = i.candidates[0]?.item as ShopMatchable | undefined; const pr = m?.shop?.price ?? m?.shop?.learned_price ?? m?.lastPrice ?? 0; return a + pr * (i.qty ?? 1) }, 0) : 0
    return (
      <div className="app">
        <main className="screen has-flow">
          <BackBar right={listening ? <span className="stat"><span><i />{t('micSpeaking')}</span></span> : undefined} />
          {!listening && <h1 className="h1" style={{ marginTop: 8 }}>{msg ? t('notUnderstood') : t('listenTitle')}</h1>}
          <p className="live" aria-live="polite">{words || (listening ? '' : '')}{listening && <i className="caret" />}</p>
          {live && <LivePreview p={live} />}
          {msg && <><div className="gap16" /><div className="err" role="alert">{msg}</div></>}
          {!listening && <TypeBox value={typed} onChange={setTyped} onGo={() => typed.trim() && understand(typed.trim(), false)} />}
        </main>
        <FlowBar mic={{ listening, micLabel: listening ? t('micSpeaking') : t('mic'), onMic: () => listening ? stopRef.current?.stop() : start(false) }}>
          {listening
            ? <><div className="sum">{sofar > 0 && <><small>{t('abTak')}</small><b>{rupees(sofar)}</b></>}</div><Tap className="btn primary" onClick={() => stopRef.current?.stop()}><Icon name="tick" size={22} stroke={3} />{t('hoGaya')}</Tap></>
            : msg ? <Tap className="btn primary wide" onClick={() => start(false)}>{t('listenAgain')}</Tap> : <div className="sum" />}
        </FlowBar>
      </div>
    )
  }

  // ---------- DONE ----------
  if (stage === 'done' && saved) return <SavedView saved={saved} onUndo={async () => {
    if (saved.kind !== 'bill') return
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

// While speaking: the bill forms line by line, so the owner can keep going.
function LivePreview({ p }: { p: ReturnType<typeof parse> }) {
  const { lang } = useT()
  if (!p.customer && p.items.length === 0) return null
  return (
    <div className="lbill">
      {p.customer && <div className="lrow2"><b>{p.customer}</b></div>}
      {p.items.map((i, k) => {
        const m = i.candidates[0]?.item as ShopMatchable | undefined
        const pr = m?.shop?.price ?? m?.shop?.learned_price ?? m?.lastPrice
        return (
          <div key={k} className="lrow2">
            <span><b>{m ? itemLabel(m, lang) : `"${i.said}"`}</b><em>{i.qty ?? ''} {i.unit ?? ''}</em></span>
            {pr != null && <span className="num">{rupees(pr * (i.qty ?? 1))}</span>}
          </div>
        )
      })}
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
function ReviewScreen({ draft, setDraft, shop, isBill, ready, total, udhaarBlocked, fix, mic, listening, words, onSaved }: {
  draft: Draft; setDraft: (d: Draft) => void; shop: Shop; isBill: boolean; ready: boolean; total: number; udhaarBlocked: boolean
  fix: (l: Line) => (p: Partial<Line>) => void; mic: MicProps; listening: boolean; words: string; onSaved: (s: Saved) => void
}) {
  const { t, lang } = useT()
  const [pick, setPick] = useState<Line | null>(null)
  const [pad, setPad] = useState<{ line: Line; field: 'qty' | 'price' } | null>(null)
  const [disc, setDisc] = useState(0)
  const [discOpen, setDiscOpen] = useState(false)
  const [custOpen, setCustOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState<'check' | 'pay'>('check')
  const { store } = useStore()
  const pending = draft.lines.find((l) => !l.sure || !l.match) ?? (isBill && !draft.customerSure ? draft.lines[0] : undefined)
  const custPending = isBill && !draft.customerSure
  const reason = draft.lines.length === 0 ? t('sayItems') : custPending ? t('pickCustFirst').replace('{name}', draft.customerName ?? '') : pending ? t('answerFirst') : isBill && draft.lines.some((l) => l.price == null) ? t('priceFirst') : t('fixFirst')
  const prevBal = draft.customer?.balance ?? 0
  const net = Math.max(0, total - disc)

  async function save() {
    setBusy(true)
    const lines = draft.lines.map(billLinePayload)
    const res = isBill
      ? await supabase.rpc('save_bill', { p: { customer: draft.customerName, customer_id: draft.customer?.id ?? null, order_id: draft.orderId ?? null, new_customer: !!draft.newCustomer, tag: draft.tag ?? null, phone: draft.phone ?? draft.customer?.phone ?? null, pay: draft.pay, discount: disc, voice_text: draft.heard, lines } })
      : await supabase.rpc('add_stock', { p: { reason: 'stock_in', lines } })
    setBusy(false)
    if (res.error) { errorFx(); toast({ text: t('saveFailed') }); return }
    successFx(); invalidateShop()
    // flavour engine learns what this shop really sold (kept on this phone, and by the server through save_bill)
    if (isBill && shop) shop.flavour = recordSales(shop.flavour, draft.lines.filter((l) => l.match).map((l) => ({ family: l.match!.family, id: l.match!.id })), shop.shopKey)
    if (isBill) {
      const r = res.data as { bill_id: string; share_token: string; total: number; balance: number | null; has_unrecorded: boolean }
      onSaved({ kind: 'bill', billId: r.bill_id, token: r.share_token, total: Number(r.total), discount: disc, fromOrder: !!draft.orderId, phone: (draft.phone ?? draft.customer?.phone ?? '').replace(/\D/g, ''), customer: draft.customerName, pay: draft.pay ?? "cash", balance: r.balance == null ? null : Number(r.balance), unrecorded: r.has_unrecorded, lines: draft.lines })
    } else onSaved({ kind: 'stock', lines: draft.lines })
  }

  const after = draft.pay === 'udhaar' && draft.customerName ? t('dkUdhaar').replace('{name}', draft.customerName).replace('{x}', rupees(prevBal + net))
    : draft.pay === 'upi' ? t('dkUpi').replace('{x}', rupees(net)) : t('dkCash').replace('{x}', rupees(net))
  const fixFirst = () => (document.querySelector('.it.u') ?? document.querySelector('.pricebtn'))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  useEffect(() => { if (!ready) setTimeout(() => { const u = document.querySelectorAll('.items .it.u'); const last = u[u.length - 1]; if (last && last.getBoundingClientRect().bottom > window.innerHeight - 260) last.scrollIntoView({ block: 'center' }) }, 300) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const cta = !ready
    ? <Tap className="btn dk-wait dk-todo" onClick={fixFirst}><small><Icon name="up" size={20} stroke={2.6} /> {cap(reason)}</small><span className="dk-sub">{isBill ? t('saveBill') : t('stockAdd')} · {t('dkAfter')}</span></Tap>
    : udhaarBlocked
      ? <Tap className="btn dk-wait" onClick={() => setCustOpen(true)}><span>{t('saveBill')}</span><small>{t('udhaarNeedsName')}</small></Tap>
      : isBill && !draft.pay
        ? <div className="btn dk-wait" aria-disabled="true"><span>{t('saveBill')} · {rupees(net)}</span><small>{t('dkChoose')}</small></div>
        : <Tap className="btn primary dk-go" disabled={busy} onClick={save}>
            <span><Icon name="tick" size={22} stroke={3} /> {busy ? t('saving') : isBill ? `${t('saveBill')} · ${rupees(net)}` : t('stockAdd')}</span>
            {isBill && !busy && <small>{after}</small>}
          </Tap>
  const payLabel = draft.pay === 'udhaar' ? t('saveUdhaar') : draft.pay === 'upi' ? t('saveUpi') : t('saveCash')
  const udChg = draft.pay === 'udhaar' && draft.customerName
  const goPay = () => { setStep('pay'); window.scrollTo(0, 0) }
  const checkBar = !isBill
    ? <FlowBar mic={mic}>{cta}</FlowBar>
    : <FlowBar mic={mic}>
        <div className="sum"><small>{t('kulWord')}</small><b>{rupees(net)}</b></div>
        {ready ? <Tap className="btn primary" onClick={goPay}>{t('paisaLo')}<Icon name="chev" size={22} stroke={2.6} /></Tap>
          : <Tap className="btn primary" onClick={fixFirst}><Icon name="up" size={20} stroke={2.6} />{t('confirmFirst')}</Tap>}
      </FlowBar>
  const payBar = (
    <div className="paydock">
      <div className="ph">{t('howPaid')}</div>
      <div className="dk-tiles">
        {(['cash', 'upi', 'udhaar'] as const).map((p) => (
          <Tap key={p} className={`dk-tile ${draft.pay === p ? (p === 'udhaar' ? 'onu' : 'on') : ''}`} aria-pressed={draft.pay === p} onClick={() => setDraft({ ...draft, pay: p })}>
            {draft.pay === p && <span className="tk"><Icon name="tick" size={16} stroke={3} /></span>}
            <Icon name={p === 'cash' ? 'cash' : p === 'upi' ? 'qr' : 'book'} size={32} />{t(p)}
          </Tap>
        ))}
      </div>
      <div className="dk-chg">{udChg && <><span>{draft.customerName} · {t('khataWord')}</span><span className="num">{rupees(prevBal)} → <b>{rupees(prevBal + net)}</b></span></>}</div>
      <div className="dkrow">
        <Tap className="fmic" onClick={mic.onMic} aria-label={mic.micLabel}><Icon name="mic" size={28} /></Tap>
        {!draft.pay ? <div className="btn dk-wait" aria-disabled="true"><Icon name="up" size={20} stroke={2.6} />{t('dkChoose')}</div>
          : udhaarBlocked ? <Tap className="btn dk-wait" onClick={() => setCustOpen(true)}>{t('udhaarNeedsName')}</Tap>
          : <Tap className="btn dk-go" disabled={busy} onClick={save}><Icon name={draft.pay === 'cash' ? 'cash' : draft.pay === 'upi' ? 'qr' : 'book'} size={24} />{busy ? t('saving') : <><span className="num">{rupees(net)}</span><span>{payLabel}</span></>}</Tap>}
      </div>
    </div>
  )
  if (isBill && step === 'pay') {
    const upiId = store?.upi_id ?? null
    return (
      <div className="app">
        <main className="screen has-pay">
          <div className="top"><Tap className="ghost back" onClick={() => setStep('check')}><Icon name="back" size={22} stroke={2.4} />{t('back')}</Tap></div>
          {draft.pay === 'upi' && upiId ? <div className="qrv"><UpiQr upi={upiId} name={store?.name ?? ''} amount={net} /></div> : (
            <div className="slip">
              <div className="slip-h"><b>{draft.customerName ?? t('walkInShort')}</b>{draft.customer && draft.customer.balance > 0 && <span className="num">{t('udhaar')} {rupees(draft.customer.balance)}</span>}</div>
              {draft.lines.filter((l) => l.match).map((l) => <div key={l.key} className="sr"><span>{itemLabel(l.match!, lang)}</span><span className="num">{rupees(lineTotal(l))}</span></div>)}
              {disc > 0 && <div className="sr"><span>{t('discount')}</span><span className="num">− {rupees(disc)}</span></div>}
              <div className="dbl" />
              <div className="sr tot"><span>{t('kulWord')}</span><span className="num">{rupees(net)}</span></div>
            </div>
          )}
          {draft.pay === 'upi' && !upiId && <p className="lab" style={{ marginTop: 16 }}>{t('upiMissingBody')}</p>}
          {draft.pay !== 'upi' && <>
            {draft.customerName && (
              <div className="field" style={{ marginTop: 16 }}>
                <label htmlFor="ph">{t('phoneOpt')}</label>
                <input id="ph" className="input" inputMode="tel" maxLength={13} placeholder="98xxxxxxxx" value={draft.phone ?? draft.customer?.phone ?? ''}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value.replace(/[^\d+]/g, '') })} />
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <Tap className="linkrow" style={{ flex: 1 }} onClick={() => setDiscOpen(true)}><span>{t('discount')}</span><span>{disc ? `− ${rupees(disc)}` : <Icon name="chev" size={20} />}</span></Tap>
              {disc > 0 && <Tap className="chg" style={{ minHeight: 56 }} onClick={() => setDisc(0)}>{t('remove')}</Tap>}
            </div>
          </>}
        </main>
        {payBar}
        <NumberSheet open={discOpen} title={t('discount')} initial={disc || null} unit="₹" onClose={() => setDiscOpen(false)} onDone={(n) => setDisc(Math.min(n, total))} />
        <CustomerPicker open={custOpen} shop={shop} current={draft.customerName} onClose={() => setCustOpen(false)}
          onPick={(name, c) => { setDraft({ ...draft, customerName: name, customer: c, customerSure: true }); setCustOpen(false) }} />
      </div>
    )
  }

  return (
    <div className="app">
      <main className="screen has-flow">
        <BackBar />
        {isBill ? (
          <div className="who">
            <div className="av">{(draft.customerName ?? '?').trim().charAt(0).toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="lab" style={{ lineHeight: '20px' }}>{t('billWhose')}{draft.customerName && !draft.customer && draft.customerOthers.length <= 1 ? ` · ${t('newCustomer')}` : ''}</div>
              <div className="h1" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{draft.customerName ?? <span className="lab" style={{ font: "600 20px Hind" }}>{t('walkIn')}</span>}</div>
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
        {isBill && draft.customer && <Tap className="ghost" style={{ marginLeft: -12, fontSize: 18, color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: 4 }} onClick={async () => { const tg = await askText({ title: t('tagAsk') }) ?? ''; setDraft({ ...draft, customer: null, newCustomer: true, tag: tg.trim() || undefined, customerSure: true }) }}>{t('notThisOne')}</Tap>}
        {isBill && !draft.customerSure && draft.customerName && draft.customerOthers.length <= 1 && (
          <div className="it u" style={{ borderRadius: 16, marginTop: 12 }}>
            <div className="guess" style={{ marginTop: 0 }}><span className="gtxt">{t('thisName')}</span>
              <div style={{ display: 'flex', gap: 10 }}>
                <Tap className="chg yes" onClick={() => setDraft({ ...draft, customerSure: true })}><Icon name="tick" size={22} stroke={3} />{t('yes')}</Tap>
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
        <Tap className="linkrow" style={{ marginTop: 12 }} onClick={() => setPick({ key: 'new', said: '', match: null, candidates: [], sure: true, qty: 1, price: null, priceSure: false })}><span>+ {t('addItem')}</span><span><Icon name="chev" size={20} /></span></Tap>

        {!isBill && <div className="gap16" />}
      </main>
      {checkBar}

      <ItemPicker open={!!pick} line={pick} shop={shop} onClose={() => setPick(null)}
        onPick={(m) => { if (pick && pick.key === 'new') { const pr = m.shop?.price ?? m.shop?.learned_price ?? m.lastPrice ?? null; setDraft({ ...draft, lines: [...draft.lines, { key: 'n' + Date.now(), said: '', match: m, candidates: [m], sure: true, qty: 1, price: pr, priceSure: m.shop?.price != null || m.shop?.learned_price != null, flavour: chooseFlavour(m, '', shop, shop.flavour) }] }) } else if (pick) { const pr = m.shop?.price ?? m.shop?.learned_price ?? m.lastPrice ?? null; fix(pick)({ match: m, sure: true, price: pr, priceSure: m.shop?.price != null || m.shop?.learned_price != null, qty: pick.qty ?? 1, flavour: chooseFlavour(m, '', shop, shop.flavour) }) } setPick(null) }} />
      <NumberSheet open={!!pad} title={pad?.field === 'price' ? `${pad.line.match?.hinglish ?? ''} — ${t('priceAsk')}` : `${pad?.line.match?.hinglish ?? ''} — ${t('qtyAsk')}`}
        initial={pad ? (pad.field === 'price' ? pad.line.price : pad.line.qty) : null} unit={pad?.field === 'qty' ? unitLabel(pad.line.match?.unit) : '₹'}
        onClose={() => setPad(null)} onDone={(n) => pad && fix(pad.line)(pad.field === 'price' ? { price: n, priceSure: true } : { qty: n })} />
      <CustomerPicker open={custOpen} shop={shop} current={draft.customerName} onClose={() => setCustOpen(false)}
        onPick={(name, c) => { setDraft({ ...draft, customerName: name, customer: c, customerSure: true }); setCustOpen(false) }} />
    </div>
  )
}

function LineRow({ l, isBill, onPick, onPad, fix, onRemove }: { l: Line; isBill: boolean; onPick: () => void; onPad: (f: 'qty' | 'price') => void; fix: (p: Partial<Line>) => void; onRemove: () => void }) {
  const { t } = useT()
  const [flOpen, setFlOpen] = useState(false)
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
          <div style={{ display: 'flex', gap: 10 }}><Tap className="chg yes" onClick={() => fix({ sure: true })}><Icon name="tick" size={22} stroke={3} />{t('yes')}</Tap><Tap className="chg" onClick={onPick}>{t('nahi')}</Tap></div>
        </div>
      )}
      {l.flavour && l.match && (
        // flavour engine: never a blocking question. Auto-picked flavour shown as a small chip; a shop that really sells a mix gets the top few as one-tap choices.
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 10 }}>
          {l.flavour.ask && <span className="gtxt">{t('flWhich')}</span>}
          {(l.flavour.ask ?? [l.match]).map((m) => <Tap key={m.id} className={`chg ${l.flavour!.ask && m.id === l.match!.id ? 'yes' : ''}`} onClick={() => (l.flavour!.ask ? fix(withVariant(l, m)) : setFlOpen(true))}>
            {l.flavour!.ask && m.id === l.match!.id && <Icon name="tick" size={22} stroke={3} />}{varLabel(m, lang)}{!l.flavour!.ask && ` · ${t('flChange')}`}</Tap>)}
          {l.flavour.ask && <Tap className="chg" onClick={() => setFlOpen(true)}>{t('flChange')}</Tap>}
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
      <FlowBar mic={mic}>
        <Tap className="btn primary wide" disabled={!cust || !amount || busy} onClick={save}><Icon name="tick" size={24} stroke={3} />{busy ? t('saving') : `${t('payDo')}${amount ? ' · ' + rupees(amount) : ''}`}</Tap>
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
      <FlowBar mic={mic}><Tap className="btn primary wide" onClick={() => goBack()}>{t('ok')}</Tap></FlowBar>
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
      <FlowBar mic={mic}><Tap className="btn primary wide" onClick={() => goBack()}>{t('ok')}</Tap></FlowBar>
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
  const clock = new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
  return (
    <div className="app">
      <main className="screen has-flow">
        <div className="top"><span /><span className="lab num">{clock}</span></div>
        <div className="dh">
          <span className="stamp"><Icon name="tick" size={30} stroke={2.8} /></span>
          <h1>{saved.kind === 'bill' ? (ud ? t('wroteUdhaar') : t('billSaved')) : saved.kind === 'stock' ? t('stockAdded') : t('paySaved')}</h1>
        </div>
        {saved.kind === 'bill' && (
          <div className="ticket">
            <div className="tk-h"><b>{saved.customer ?? t('walkInShort')}</b><span className="num">{rupees(saved.total)}</span></div>
            {ud
              ? <>
                  <div className="tk-r"><span>{t('oldBal')}</span><span className="num">{rupees((saved.balance ?? 0) - saved.total)}</span></div>
                  <div className="tk-r"><span>{t('thisBill')}</span><span className="num">+ {rupees(saved.total)}</span></div>
                  <div className="perf" />
                  <div className="tk-f"><span>{t('newBal')}</span><span className="num big ud">{rupees(saved.balance ?? 0)}</span></div>
                </>
              : <>
                  {saved.lines.filter((l) => l.match).slice(0, 4).map((l) => <div key={l.key} className="tk-r"><span>{itemLabel(l.match!, lang)}</span><span className="num">{rupees(lineTotal(l))}</span></div>)}
                  <div className="perf" />
                  <div className="tk-f"><span>{saved.pay === 'upi' ? 'UPI' : 'Cash'}</span><span className="num big">{rupees(saved.total)}</span></div>
                </>}
          </div>
        )}
        {saved.kind === 'payment' && <div className="ticket"><div className="tk-h"><b>{saved.customer}</b><span className="num">{rupees(saved.amount)}</span></div><div className="perf" /><div className="tk-f"><span>{t('newBal')}</span><span className="num big">{rupees(saved.balance)}</span></div></div>}
        {saved.kind === 'stock' && <p className="sv-sum" style={{ marginTop: 20 }}>+ {lineSummary}</p>}
        {saved.kind === 'bill' && saved.unrecorded && <p className="lab" style={{ marginTop: 16 }}>{t('unrecordedNote')}</p>}
      </main>
      <FlowBar className="stack-up">
        <div style={{ display: 'flex', gap: 12 }}>
          {saved.kind === 'bill' && <a className="btn ghostln tap" style={{ flex: 'none', textDecoration: 'none', padding: '0 20px' }} href={wa} target="_blank" rel="noreferrer"><Icon name="wa" size={22} />WhatsApp</a>}
          <Tap className="btn vo wide" onClick={() => navigate('/bolo?new=' + Date.now(), true)}><Icon name="mic" size={24} />{t('nextBill')}</Tap>
        </div>
        {saved.kind === 'bill' && <Tap className="btn undo" onClick={onUndo}><Icon name="undo" size={20} />{t('undoBill')}</Tap>}
      </FlowBar>
    </div>
  )
}
