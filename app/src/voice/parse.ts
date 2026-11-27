import { readNumber, isNumberWord } from './numbers'
import { FILLER, SEPARATORS, tokenize, unitOf, extractPay, type Unit, type PayWord } from './normalize'
import { dice, isSure, matchName, type Candidate, type Matchable, type MatchIndex } from './match'
import { fold, phonKey } from './normalize'

export type Intent = 'bill' | 'stock_in' | 'payment' | 'query' | 'galla' | 'unknown'
export type ParsedItem = {
  said: string            // the words the owner used for the item
  qty: number | null      // null = not said (review card asks)
  unit: Unit | null       // unit as spoken (kg/g/l/ml/pc/pack), 'rs' = "₹50 ka dhaniya"
  rupees: number | null   // money-based item ("50 rupaye ka dhaniya")
  candidates: Candidate[] // best guesses, best first
  sure: boolean           // false -> yellow "Yahi wali?" row
}
export type Parsed = {
  intent: Intent
  text: string
  customer: string | null // as spoken, e.g. "Sharma ji"
  customerSure: boolean    // false -> yellow "Yahi naam?" (could also be an item)
  items: ParsedItem[]
  amount: number | null   // payment / galla amount
  pay?: PayWord | null    // said how it is paid: "udhaar mein", "cash", "upi se"
  sure: boolean           // whole result confident (else Gemini may help)
}

const titleName = (s: string) => s.split(' ').map((w) => HONORIFIC.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
const has = (toks: string[], words: string[]) => words.some((w) => w.includes(' ') ? toks.join(' ').includes(w) : toks.includes(w))
const STOCK_IN = ['maal aaya', 'maal aya', 'maal aa gaya', 'maal aagaya', 'stock aaya', 'stock aya', 'naya maal', 'maal', 'aaya', 'aya', 'aa gaya', 'aagaya', 'aaye', 'received', 'माल', 'आया', 'आ गया', 'आए']
const PAY_VERBS = ['diye', 'diya', 'de diye', 'jama', 'jamaa', 'chukaye', 'chukaya', 'lautaye', 'paid', 'pay', 'दिए', 'दिया', 'दिये', 'जमा', 'चुकाए']
const QUERY = ['kitna', 'kitni', 'kitne', 'bacha', 'bachi', 'bache', 'bachaa', 'how much', 'left', 'कितना', 'कितनी', 'कितने', 'बचा', 'बची', 'बचे']
const GALLA = ['galla', 'galle', 'gala', 'gale', 'gulla', 'drawer', 'cash count', 'गल्ला', 'गल्ले', 'गल्ले में']
const HONORIFIC = new Set(['ji', 'jee', 'bhai', 'bhaiya', 'bhaiyya', 'bhaiyaa', 'didi', 'aunty', 'auntie', 'uncle', 'sahab', 'saheb', 'sahib', 'saab', 'sir', 'madam', 'mam', 'maam', 'seth', 'bhabhi', 'chacha', 'chachi', 'babu', 'pandit', 'mr', 'mrs', 'shri', 'shree',
  'जी', 'भाई', 'भैया', 'दीदी', 'साहब', 'साहिब', 'आंटी', 'अंकल', 'सर', 'मैडम', 'मैम', 'सेठ', 'भाभी', 'चाचा', 'चाची', 'बाबू', 'पंडित', 'श्री'])
const CUSTOMER_TAIL = ['ke naam se', 'ke naam', 'ka bill', 'ke liye', 'wala', 'wale', 'wali', 'ke', 'ka', 'ki', 'ko', 'का बिल', 'के नाम से', 'के नाम', 'के लिए', 'वाला', 'वाले', 'वाली', 'का', 'के', 'की', 'को']
// "bhaiya, 2 kilo cheeni": a form of address, not the customer's name
const ADDRESS = new Set(['bhaiya', 'bhaiyya', 'bhaiyaa', 'bhai', 'bhaiyaji', 'uncle', 'aunty', 'auntie', 'didi', 'sir', 'madam', 'mam', 'maam', 'bhabhi', 'भैया', 'भाई', 'दीदी', 'अंकल', 'आंटी', 'सर', 'मैडम', 'मैम', 'भाभी'])

function firstNumberIndex(toks: string[]) { return toks.findIndex((t, i) => isNumberWord(t) && readNumber(toks, i) !== null) }
function firstAmount(toks: string[]): number | null {
  for (let i = 0; i < toks.length; i++) { const n = readNumber(toks, i); if (n) return n.value }
  return null
}
function cleanName(words: string[]) { return words.filter((w) => !FILLER.has(w) && !SEPARATORS.has(w)).join(' ').trim() }

// "sharmaji" is "sharma" + "ji"; "शर्माजी" too
const HON_SUFFIX = ['ji', 'jee', 'bhaiya', 'bhai', 'didi', 'sahab', 'saheb', 'sahib', 'जी', 'भैया', 'भाई', 'दीदी', 'साहब']
const stripGlued = (w: string) => { for (const h of HON_SUFFIX) if (w.length - h.length >= 3 && w.endsWith(h)) return w.slice(0, -h.length); return w }
const nameKey = (s: string) => s.toLowerCase().split(/\s+/).filter((w) => w && !HONORIFIC.has(w)).map(stripGlued).join(' ')
/** How alike two names sound (0..1): honorifics ignored, spelling AND phonetics compared, so "sarma ji" / "शर्मा जी" / "sharmaji" all meet "Sharma ji". */
export function nameScore(a: string, b: string): number {
  const x = nameKey(a), y = nameKey(b)
  if (x.length < 2 || y.length < 2) return 0
  if (x === y) return 1
  const px = phonKey(x), py = phonKey(y)
  if (px.length >= 2 && px === py) return 0.95
  return Math.max(dice(fold(x), fold(y)), dice(px, py) * 0.97)
}
/** Does this phrase sound like a customer we already know? */
function knownCustomer(name: string, known: string[], min = 0.8): string | null {
  let best: string | null = null, score = 0
  for (const c of known) { const d = nameScore(name, c); if (d > score) { score = d; best = c } }
  return score >= min ? best : null
}
function trimTail(head: string[]) {
  for (const tail of CUSTOMER_TAIL) {
    const t = tail.split(' ')
    if (head.length > t.length && head.slice(-t.length).join(' ') === tail) return head.slice(0, -t.length)
  }
  return head
}

type Split = { customer: string | null; customerSure: boolean; rest: string[] }
// words that glue a name to the sentence: "Sharma ji KE LIYE", "Gupta ji WALA", "Ramesh KA BILL"
const TAILW = new Set(['ke', 'liye', 'naam', 'se', 'ka', 'ki', 'ko', 'wala', 'wale', 'wali', 'bill', 'के', 'लिए', 'नाम', 'से', 'का', 'की', 'को', 'वाला', 'वाले', 'वाली', 'बिल'])
const STRONG_TAIL = new Set(['liye', 'naam', 'wala', 'wale', 'wali', 'bill', 'लिए', 'नाम', 'वाला', 'वाले', 'वाली', 'बिल'])
const dropTailStart = (w: string[]) => { let i = 0; while (i < w.length && TAILW.has(w[i])) i++; return w.slice(i) }
const dropTailEnd = (w: string[]) => { let e = w.length; while (e > 1 && TAILW.has(w[e - 1])) e--; return w.slice(0, e) }

/** The name in front of the items ("Sharma ji ke liye ...", "Ramesh cheeni 2 kilo ..."): honorific ends it; else a known customer's name; else a bare unknown word (a guess). */
function headName(head: string[], idx: MatchIndex, known: string[]): (Split & { carry: string[] }) | null {
  const h = head.findIndex((w, i) => i > 0 && HONORIFIC.has(w))
  if (h > 0) {
    const nm = head.slice(0, h + 1).join(' ')
    return { customer: knownCustomer(nm, known) ?? titleName(nm), customerSure: true, rest: [], carry: dropTailStart(head.slice(h + 1)) }
  }
  let bestLen = 0, bestName: string | null = null, bestScore = 0
  for (let len = Math.min(3, head.length); len >= 1; len--) {
    const cand = dropTailEnd(head.slice(0, len)).join(' ')
    const k = knownCustomer(cand, known)
    const sc = k ? nameScore(cand, k) : 0
    if (k && sc > bestScore + 0.001) { bestLen = len; bestName = k; bestScore = sc }
  }
  if (bestName) return { customer: bestName, customerSure: true, rest: [], carry: dropTailStart(head.slice(bestLen)) }
  const trimmed = trimTail(head), name = trimmed.join(' ').trim()
  if (name && head.some((w) => HONORIFIC.has(w))) return { customer: titleName(name), customerSure: true, rest: [], carry: [] }
  const itemScore = matchName(cleanName(trimmed), idx, 1)[0]?.score ?? 0
  if (name && itemScore < 0.7 && trimmed.length <= 3 && cleanName(trimmed)) return { customer: titleName(name), customerSure: false, rest: [], carry: [] }
  return null
}

/**
 * Who is the bill for? Name before the items ("Sharma ji, ..." / "Ramesh 2 kilo cheeni") or after them
 * ("2 kilo cheeni Sharma ji ke liye" / "... Ramesh bhai" / "... Gupta wala"). Known customers (matched by sound, so
 * "sarma ji" / "शर्मा जी" / "sharmaji" all find "Sharma ji") and honorifics (ji, bhai...) are sure; a bare unknown
 * word that is not an item is a guess the owner confirms ("Yahi naam?").
 */
function splitCustomer(toks: string[], idx: MatchIndex, known: string[]): Split {
  while (toks.length > 1 && ADDRESS.has(toks[0]) && (toks[1] === ',' || isNumberWord(toks[1]))) toks = toks.slice(toks[1] === ',' ? 2 : 1)
  const comma = toks.indexOf(',')
  const num = firstNumberIndex(toks)
  const end = comma >= 0 && (num < 0 || comma < num) ? comma : num
  if (end > 0) {
    const head = toks.slice(0, end)
    const rest = toks.slice(end + (toks[end] === ',' ? 1 : 0))
    const r = headName(head, idx, known)
    if (r) return { customer: r.customer, customerSure: r.customerSure, rest: [...r.carry, ...(r.carry.length && rest[0] !== undefined && toks[end] === ',' ? [','] : []), ...rest] }
  }
  // name at the end: "... Sharma ji ke liye" / "... Gupta ji ka"
  const hon = toks.map((w, i) => (HONORIFIC.has(w) ? i : -1)).filter((i) => i > 0).pop()
  if (hon !== undefined && hon >= toks.length - 3) {
    let from = hon - 1
    if (from > 0 && !isNumberWord(toks[from - 1]) && !unitOf(toks[from - 1]) && !SEPARATORS.has(toks[from - 1]) && matchName(toks[from - 1], idx, 1).length === 0) from--
    const name = toks.slice(from, hon + 1).join(' ')
    if ((matchName(toks[from], idx, 1)[0]?.score ?? 0) < 0.85) {
      return { customer: knownCustomer(name, known) ?? titleName(name), customerSure: true, rest: toks.slice(0, from) }
    }
  }
  // name at the end without an honorific: a known customer ("... ramesh", "... ramesh ke liye"), or a word followed by "ke liye"/"wala"
  let e = toks.length; while (e > 1 && TAILW.has(toks[e - 1])) e--
  const strong = toks.slice(e).some((w) => STRONG_TAIL.has(w))
  for (let n = Math.min(2, e - 1); n >= 1; n--) {
    const w = toks.slice(e - n, e)
    if (w.some((x) => isNumberWord(x) || unitOf(x) || SEPARATORS.has(x) || x === ',' || FILLER.has(x))) continue
    const phrase = w.join(' '), itemScore = matchName(phrase, idx, 1)[0]?.score ?? 0
    const kn = knownCustomer(phrase, known, 0.85)
    if (kn && itemScore < 0.9) return { customer: kn, customerSure: true, rest: toks.slice(0, e - n) }
    if (strong && itemScore < 0.7 && w.every((x) => (matchName(x, idx, 1)[0]?.score ?? 0) < 0.7)) return { customer: titleName(phrase), customerSure: false, rest: toks.slice(0, e - n) }
  }
  return { customer: null, customerSure: true, rest: toks }
}

const SIZE_UNITS = new Set<Unit>(['kg', 'g', 'l', 'ml'])
type Size = { value: number; unit: Unit }
const dimOf = (u: Unit) => (u === 'kg' || u === 'g' ? 'w' : 'v')
const baseAmt = (z: Size) => (z.unit === 'kg' || z.unit === 'l' ? z.value * 1000 : z.value)

/** Pack size of a catalogue entry: "750ml", "Original 200g", "Coca-Cola 600ml" -> 750 ml / 200 g / 600 ml. */
function packSize(m: Matchable): { dim: 'w' | 'v'; amt: number } | null {
  const r = /(\d+(?:\.\d+)?)\s?(kg|g|ml|l)\b/i.exec(m.variant ?? '') ?? /(\d+(?:\.\d+)?)\s?(kg|g|ml|l)\b/i.exec(m.en)
  if (!r) return null
  const u = r[2].toLowerCase() as Unit
  return { dim: dimOf(u), amt: baseAmt({ value: parseFloat(r[1]), unit: u }) }
}
const famCache = new WeakMap<object, { n: number; map: Map<string, Matchable[]> }>()
function familyOf(idx: MatchIndex, m: Matchable): Matchable[] {
  let c = famCache.get(idx.byId)
  if (!c || c.n !== idx.byId.size) {
    const map = new Map<string, Matchable[]>()
    for (const x of idx.byId.values()) if (x.family) { const l = map.get(x.family); if (l) l.push(x); else map.set(x.family, [x]) }
    famCache.set(idx.byId, (c = { n: idx.byId.size, map }))
  }
  const l = m.family ? c.map.get(m.family) ?? [] : []
  return [m, ...l.filter((x) => x.id !== m.id)]
}

/** "750 ml coke", "1 litre amul doodh": choose the pack of that size (or N packs of a smaller one, liquids only). */
function pickPack(cands: Candidate[], want: Size, idx: MatchIndex): { cands: Candidate[]; packs: number; exact: boolean } | null {
  const top = cands[0]
  const pool = cands.filter((c) => !c.item.loose && c.score >= top.score - 0.05)
  const dim = dimOf(want.unit), amt = baseAmt(want)
  const options: { m: Matchable; amt: number }[] = []
  for (const c of pool) for (const m of familyOf(idx, c.item)) { const z = packSize(m); if (z && z.dim === dim && !options.some((o) => o.m.id === m.id)) options.push({ m, amt: z.amt }) }
  let hit = options.find((o) => Math.abs(o.amt - amt) < 0.5), packs = 1, exact = true
  if (!hit && dim === 'v') {
    const fits = options.filter((o) => amt % o.amt === 0 && amt / o.amt <= 12).sort((a, b) => b.amt - a.amt)
    if (fits.length) { hit = fits[0]; packs = amt / hit.amt; exact = false }
  }
  if (!hit) return null
  const picked: Candidate = { id: hit.m.id, score: Math.max(top.score, 0.95), item: hit.m }
  return { cands: [picked, ...cands.filter((c) => c.id !== hit!.m.id)], packs, exact }
}

/** Weight/volume said ("1.5 kilo aloo"): the loose item beats a packet that merely sounds alike (Haldiram Aloo Bhujia), unless a brand was named. */
function preferLoose(cands: Candidate[], said: string): Candidate[] {
  const top = cands[0]
  if (!top || top.item.loose) return cands
  const brand = top.item.brand?.toLowerCase()
  if (brand && said.toLowerCase().split(' ').some((w) => dice(fold(w), fold(brand)) >= 0.8)) return cands
  const loose = cands.find((c) => c.item.loose && c.score >= top.score - 0.25 && c.score >= 0.7)
  return loose ? [loose, ...cands.filter((c) => c !== loose)] : cands
}

/** Items: "2 kilo cheeni 1 maggi", "cheeni 2 kilo, maggi ek", "50 rupaye ka dhaniya". */
const WEAK = 0.8
export function parseItems(toks: string[], idx: MatchIndex): ParsedItem[] {
  type Draft = { words: string[]; qty: number | null; unit: Unit | null; rupees: number | null; size: Size | null }
  const fresh = (): Draft => ({ words: [], qty: null, unit: null, rupees: null, size: null })
  const drafts: Draft[] = []
  let cur: Draft = fresh()
  const push = () => { if (cleanName(cur.words) || cur.qty !== null) drafts.push(cur); cur = fresh() }
  const nextReal = (k: number) => { while (k < toks.length && FILLER.has(toks[k]) && !SEPARATORS.has(toks[k])) k++; return toks[k] }

  for (let i = 0; i < toks.length; i++) {
    const t = toks[i]
    if (SEPARATORS.has(t)) { push(); continue }
    const n = isNumberWord(t) ? readNumber(toks, i) : null
    if (n) {
      const nextUnit = unitOf(toks[i + n.used] ?? '')
      // "ek coke 750 ml": a size after the name, not a new item
      if (nextUnit && SIZE_UNITS.has(nextUnit) && cur.qty !== null && cur.size === null && cleanName(cur.words)) {
        const after = nextReal(i + n.used + 1)
        // "2 kilo 500 gram" is one weight, not a pack size followed by a new number
        const m3 = after !== undefined && isNumberWord(after) ? readNumber(toks, toks.indexOf(after, i + n.used + 1)) : null
        const u3 = m3 ? unitOf(toks[toks.indexOf(after!, i + n.used + 1) + m3.used] ?? '') : null
        const weightTail = (nextUnit === 'kg' && u3 === 'g') || (nextUnit === 'l' && u3 === 'ml')
        if (!weightTail && (after === undefined || SEPARATORS.has(after) || isNumberWord(after))) { cur.size = { value: n.value, unit: nextUnit }; i += n.used; continue }
      }
      const hasQty = cur.qty !== null || cur.rupees !== null
      if (hasQty || (cur.words.length && cleanName(cur.words) === '')) push()
      else if (cur.words.length && !hasQty) {
        // name then number: "cheeni 2 kilo" — but if the number is followed by another name and no unit, it starts a new item
        const after = toks[i + n.used + (nextUnit ? 1 : 0)]
        const startsNew = !nextUnit && after && !SEPARATORS.has(after) && !isNumberWord(after)
        if (startsNew) push()
      }
      if (nextUnit === 'rs') cur.rupees = n.value; else { cur.qty = n.value; cur.unit = nextUnit }
      i += n.used - 1 + (nextUnit ? 1 : 0)
      if (nextUnit === 'kg' || nextUnit === 'l') {
        // "2 kilo 500 gram" / "ek kilo aur paanch sau gram" = 2.5 kg / 1.5 kg, one quantity
        let j = i + 1; if (toks[j] === 'aur' || toks[j] === 'and') j++
        const m2 = j < toks.length && isNumberWord(toks[j]) ? readNumber(toks, j) : null
        const u2 = m2 ? unitOf(toks[j + m2.used] ?? '') : null
        if (m2 && u2 === (nextUnit === 'kg' ? 'g' : 'ml') && m2.value < 1000) { cur.qty = n.value + m2.value / 1000; i = j + m2.used }
      }
      continue
    }
    const u = unitOf(t)
    if (u && cur.qty !== null && !cur.unit) {
      // "teen parle g": the g belongs to the product name (Parle-G), not a unit
      const base = cleanName(cur.words)
      if ((t === 'g' || t === 'l') && base && (matchName(base + ' ' + t, idx, 1)[0]?.score ?? 0) >= 0.99) { cur.words.push(t); continue }
      cur.unit = u; continue
    }
    cur.words.push(t)
  }
  push()

  return drafts.map((d) => {
    let said = cleanName(d.words)
    let candidates = said ? matchName(said, idx) : []
    let qty = d.qty, unit = d.unit
    const spoken: Size | null = d.size ?? (qty !== null && unit && SIZE_UNITS.has(unit) ? { value: qty, unit } : null)
    if (spoken) candidates = preferLoose(candidates, said)
    let sure = !!said && isSure(said, candidates, idx)
    if (spoken && candidates.length && !candidates[0].item.loose) {
      const r = pickPack(candidates, spoken, idx)
      if (r) {
        candidates = r.cands
        qty = d.size ? (qty ?? 1) * r.packs : r.packs; unit = 'pc'
        if (r.exact) sure = true
        said = `${said} ${spoken.value}${spoken.unit}`   // the size is now part of what was asked for: the flavour engine keeps exactly this pack
      }
    }
    return { said, qty, unit, rupees: d.rupees, candidates, sure }
  }).filter((d) => d.said && !(d.qty === null && d.rupees === null && !d.sure && (d.candidates[0]?.score ?? 0) < WEAK))   // chatter / mishears with no quantity and no real match are dropped, not shown as bill lines
}

export function parse(text: string, idx: MatchIndex, knownCustomers: string[] = []): Parsed {
  const all = tokenize(text)

  // "Galla mein 4,200 hai"
  if (has(all, GALLA)) { const amount = firstAmount(all); return { text, customer: null, customerSure: true, items: [], amount, pay: null, intent: 'galla', sure: amount !== null } }

  // "udhaar mein", "cash", "upi se": how it is paid, taken out before the rest is read
  const { pay, toks } = extractPay(all)
  const base = { text, customer: null, customerSure: true, items: [], amount: null, pay }

  // "Gupta ji ne 500 diye" / "Gupta ji se 500 mile"
  const neIdx = toks.findIndex((t) => t === 'ne' || t === 'ने' || t === 'se' || t === 'से')
  if (neIdx > 0 && has(toks, [...PAY_VERBS, 'mile', 'mila', 'मिले', 'मिला'])) {
    const amount = firstAmount(toks.slice(neIdx))
    const said = toks.slice(0, neIdx).join(' ')
    const customer = knownCustomer(said, knownCustomers) ?? titleName(said)
    return { ...base, intent: 'payment', customer, amount, sure: amount !== null && !!customer }
  }

  // "Cheeni kitni bachi?"
  if (has(toks, QUERY)) {
    const words = toks.filter((t) => !QUERY.includes(t) && !['hai', 'hain', 'stock', 'mein', 'में', ',', '?'].includes(t))
    const items = parseItems(words, idx)
    return { ...base, intent: 'query', items, sure: items.length === 1 && items[0].sure }
  }

  // "Maal aaya, 10 Aashirvaad atta"
  if (has(toks, STOCK_IN)) {
    const rest = toks.filter((t) => !['maal', 'aaya', 'aya', 'aa', 'gaya', 'aagaya', 'aaye', 'stock', 'naya', 'received', 'माल', 'आया', 'आ', 'गया', 'आए', 'hai', 'है'].includes(t))
    const items = parseItems(rest, idx)
    return { ...base, intent: 'stock_in', items, sure: items.length > 0 && items.every((i) => i.sure && i.qty !== null) }
  }

  // Otherwise a bill: optional customer, then items.
  const { customer, customerSure, rest } = splitCustomer(toks, idx, knownCustomers)
  const items = parseItems(rest, idx)
  // just a name (Sharma ji): start that customer's bill and listen for the items next
  if (items.length === 0) return { ...base, intent: customer ? 'bill' : 'unknown', customer, customerSure, sure: false }
  return { ...base, intent: 'bill', customer, customerSure, items, sure: customerSure && items.every((i) => i.sure) }
}
