import { useEffect, useRef, useState } from 'react'
import { useT, rupees } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { listen, speechSupported, speak } from '../lib/speech'
import { speakOn, speakRate } from '../lib/prefs'
import { EXAMPLES, parse, plan, type Parsed } from '../lib/assistant'
import { HomeBtn, LoadError, Tap, TopBar } from '../components/ui'
import { Icon } from '../components/Icon'

type Row = { a: string; b?: string; ud?: boolean }
type Answer = { big?: string; sub?: string; rows?: Row[]; empty?: string }
type J = Record<string, any>

const num = (x: unknown) => Number(x ?? 0)
const when = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '')
const hour = (h: number) => `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`
const qty = (n: number, u?: string) => `${+num(n).toFixed(2)}${u ? ' ' + u : ''}`

/** Turn one ask_* result into something short to read and say aloud. */
export function format(p: Parsed, d: any, L: (hi: string, hl: string, en: string) => string): Answer {
  const none = (hi: string, hl: string, en: string): Answer => ({ empty: L(hi, hl, en) })
  switch (p.intent) {
    case 'sales': {
      const r = d as J
      if (!num(r.bills)) return none('इस दौरान कोई बिल नहीं', 'Is dauran koi bill nahi', 'No bills in this period')
      return { big: rupees(num(r.sales)), sub: `${num(r.bills)} bills · avg ${rupees(num(r.avg_bill))}`, rows: [
        { a: 'Cash', b: rupees(num(r.cash)) }, { a: 'UPI', b: rupees(num(r.upi)) }, { a: L('उधार', 'Udhaar', 'Udhaar'), b: rupees(num(r.udhaar)), ud: true }] }
    }
    case 'top_items': {
      const l = d as J[]
      if (!l.length) return none('कोई बिक्री नहीं', 'Koi bikri nahi', 'No sales')
      return { rows: l.map((x) => ({ a: x.name, b: `${qty(x.qty, x.unit)} · ${rupees(num(x.amount))}` })) }
    }
    case 'slow_items': {
      const l = d as J[]
      if (!l.length) return none('सब कुछ बिक रहा है', 'Sab kuch bik raha hai', 'Everything is selling')
      return { sub: L('इतने दिन से नहीं बिका', 'Itne din se nahi bika', 'Not sold for a while'), rows: l.map((x) => ({ a: x.name, b: x.last_sold ? when(x.last_sold) : L('कभी नहीं', 'Kabhi nahi', 'Never') })) }
    }
    case 'low_stock': {
      const l = d as J[]
      if (!l.length) return none('स्टॉक ठीक है', 'Stock theek hai', 'Stock looks fine')
      return { rows: l.map((x) => ({ a: x.name, b: num(x.stock) <= 0 ? L('खत्म', 'Khatam', 'Out') : `${qty(x.stock, x.unit)}${x.days_left != null ? ` · ${x.days_left} ${L('दिन', 'din', 'days')}` : ''}` })) }
    }
    case 'item_stock': {
      const l = d as J[]
      if (!l.length) return none('यह सामान नहीं मिला', 'Yeh item nahi mila', 'Item not found')
      return { rows: l.map((x) => ({ a: x.name, b: x.stock_known ? qty(x.stock, x.unit) : L('गिनती नहीं', 'Ginti nahi', 'Not counted') })) }
    }
    case 'customer_balance': {
      const l = d as J[]
      if (!l.length) return none('यह नाम नहीं मिला', 'Yeh naam nahi mila', 'Name not found')
      if (l.length === 1) return { big: rupees(Math.max(0, num(l[0].balance))), sub: `${l[0].name}${l[0].last_at ? ' · ' + when(l[0].last_at) : ''}` }
      return { rows: l.map((x) => ({ a: x.name, b: rupees(num(x.balance)), ud: true })) }
    }
    case 'top_debtors': {
      const l = (d as J).list as J[]
      if (!l?.length) return none('किसी का उधार बाकी नहीं', 'Kisi ka udhaar baaki nahi', 'No udhaar pending')
      return { big: rupees(num((d as J).total)), sub: L('कुल बाकी', 'Kul baaki', 'Total outstanding'), rows: l.map((x) => ({ a: x.name, b: rupees(num(x.balance)), ud: true })) }
    }
    case 'customer_history': {
      const r = d as J
      if (!r.customer) return none('यह नाम नहीं मिला', 'Yeh naam nahi mila', 'Name not found')
      return { big: rupees(Math.max(0, num(r.balance))), sub: r.customer, rows: (r.entries as J[]).map((e) => ({ a: `${when(e.at)} · ${e.kind === 'payment' ? L('जमा', 'Jama', 'Paid') : L('उधार', 'Udhaar', 'Udhaar')}`, b: rupees(Math.abs(num(e.amount))), ud: e.kind !== 'payment' })) }
    }
    case 'supplier_due': {
      const l = d as J[]
      if (!l.length) return none('कोई सप्लायर बाकी नहीं', 'Koi supplier baaki nahi', 'No supplier dues')
      return { rows: l.map((x) => ({ a: x.name, b: rupees(num(x.due)) })) }
    }
    case 'last_price': {
      const l = d as J[]
      if (!l.length) return none('कोई बिक्री नहीं मिली', 'Koi bikri nahi mili', 'No sale found')
      return { big: rupees(num(l[0].price)), sub: `${l[0].name}${l[0].variant ? ' ' + l[0].variant : ''} · ${when(l[0].at)}${l[0].customer ? ' · ' + l[0].customer : ''}` }
    }
    case 'cash_expected': {
      const r = d as J
      return { big: rupees(num(r.expected)), sub: L('गल्ले में होना चाहिए', 'Galla mein hona chahiye', 'Should be in the drawer'), rows: [{ a: L('कैश बिक्री', 'Cash bikri', 'Cash sales'), b: rupees(num(r.cash_sales)) }, { a: L('उधार वसूली', 'Udhaar vasooli', 'Udhaar collected'), b: rupees(num(r.udhaar_collected)) }] }
    }
    case 'bill_count': return { big: String(num((d as J).bills)), sub: L('बिल', 'bill', 'bills') }
    case 'busiest_hour': {
      const h = ((d as J).hours as J[]) ?? []
      if (!h.length) return none('अभी डेटा नहीं', 'Abhi data nahi', 'No data yet')
      return { big: hour(num(h[0].hour)), sub: L('सबसे ज़्यादा भीड़', 'Sabse zyada bheed', 'Busiest hour'), rows: h.map((x) => ({ a: hour(num(x.hour)), b: `${num(x.bills)} bills` })) }
    }
    case 'udhaar_collected': return { big: rupees(num((d as J).collected)), sub: `${num((d as J).payments)} ${L('भुगतान', 'payments', 'payments')}` }
    case 'profit': return none('मुनाफ़ा निकालने के लिए खरीद भाव चाहिए — अभी दर्ज नहीं', 'Munafa ke liye kharid bhav chahiye — abhi darj nahi', 'Profit needs your buying prices — not recorded yet')
    case 'bill_search': {
      const l = d as J[]
      if (!l.length) return none('कोई बिल नहीं मिला', 'Koi bill nahi mila', 'No bill found')
      return { rows: l.map((x) => ({ a: `${when(x.at)} · ${x.customer ?? 'Walk-in'}`, b: rupees(num(x.total)), ud: x.pay === 'udhaar' })) }
    }
    case 'online_orders': {
      const s = ((d as J).by_status ?? {}) as J, n = Object.values(s).reduce<number>((a, v) => a + num(v), 0)
      if (!n) return none('इस हफ़्ते कोई ऑनलाइन ऑर्डर नहीं', 'Is hafte koi online order nahi', 'No online orders this week')
      return { big: String(n), sub: L('इस हफ़्ते के ऑर्डर', 'Is hafte ke orders', 'Orders this week'), rows: Object.entries(s).map(([k, v]) => ({ a: k, b: String(v) })) }
    }
  }
}

export function Poochho() {
  const { t, lang } = useT()
  const L = (hi: string, hl: string, en: string) => (lang === 'hi' ? hi : lang === 'en' ? en : hl)
  const [heard, setHeard] = useState('')
  const [text, setText] = useState('')
  const [ans, setAns] = useState<Answer | null>(null)
  const [miss, setMiss] = useState(false)
  const [busy, setBusy] = useState(false)
  const [fail, setFail] = useState(false)
  const [live, setLive] = useState(false)
  const stop = useRef<{ stop(): void } | null>(null)
  useEffect(() => () => stop.current?.stop(), [])

  async function ask(q: string) {
    const s = q.trim()
    if (!s) return
    setHeard(s); setMiss(false); setFail(false); setAns(null)
    const p = parse(s)
    if (!p) { setMiss(true); return }
    setBusy(true)
    const { fn, args } = plan(p)
    const { data, error } = await supabase.rpc(fn, args)
    setBusy(false)
    if (error) { setFail(true); return }
    const a = format(p, data, L)
    setAns(a)
    const say = a.empty ?? [a.big, a.sub].filter(Boolean).join(', ') ?? ''
    if (say && speakOn()) speak(say, lang, speakRate())
  }
  function mic() {
    if (live) { stop.current?.stop(); return }
    if (!speechSupported()) { setMiss(true); return }
    setLive(true); setAns(null); setMiss(false); setHeard('')
    stop.current = listen({
      lang: lang === 'en' ? 'en-IN' : 'hi-IN', silenceMs: 1800,
      onWords: setHeard, onDone: (tx) => { setLive(false); ask(tx) }, onError: () => { setLive(false); setMiss(true) },
    })
  }

  return (
    <main className="screen v2 has-foot">
      <TopBar title={t('poochho')} back="/" />
      <form className="vstack" onSubmit={(e) => { e.preventDefault(); ask(text); setText('') }}>
        <div className="vc vask" style={{ gap: 8 }}>
          <input aria-label={t('poochho')} value={text} onChange={(e) => setText(e.target.value)} placeholder={L('यहाँ लिखें…', 'Yahan likho…', 'Type here…')}
            style={{ flex: 1, minWidth: 0, height: 56, border: 0, background: 'transparent', color: 'inherit', font: '500 18px/24px var(--font)', outline: 0 }} />
          <Tap type="submit" className="btn primary s" style={{ width: 'auto', padding: '0 16px' }} aria-label="Send"><Icon name="send" size={22} /></Tap>
        </div>
      </form>
      {heard && <p className="vlab" style={{ margin: '16px 4px 0' }}>“{heard}”</p>}
      {busy && <div className="vsk" style={{ height: 120, marginTop: 16 }} />}
      {fail && <LoadError onRetry={() => ask(heard)} />}
      {ans && !busy && (
        <div className="vc vstack" style={{ marginTop: 16 }} aria-live="polite">
          {ans.empty && <p style={{ font: '700 20px/28px var(--font)' }}>{ans.empty}</p>}
          {ans.big && <div className="vbig">{ans.big}</div>}
          {ans.sub && <p className="vlab">{ans.sub}</p>}
          {ans.rows?.map((r, i) => <div className="vrow" key={i}><span className="t"><b>{r.a}</b></span>{r.b && <span className={`a ${r.ud ? 'ud' : ''}`}>{r.b}</span>}</div>)}
        </div>
      )}
      {miss && <p className="vnote" style={{ marginTop: 16 }}><b>{L('समझ नहीं आया। ऐसे पूछें:', 'Samajh nahi aaya. Aise poochho:', 'Did not get that. Try:')}</b></p>}
      {(!heard || miss) && !live && (
        <div className="vstack" style={{ marginTop: 16 }}>
          {EXAMPLES.slice(0, 6).map((e) => <Tap key={e} className="vrow" onClick={() => ask(e)}><span className="t"><b>{e}</b></span></Tap>)}
        </div>
      )}
      <div className="vfoot">
        <Tap className={`btn vo ${live ? 'on' : ''}`} onClick={mic}><Icon name="mic" size={24} />{live ? L('सुन रहा हूँ…', 'Sun raha hoon…', 'Listening…') : t('poochho')}</Tap>
        {ans && <HomeBtn />}
      </div>
    </main>
  )
}
