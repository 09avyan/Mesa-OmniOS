// Poochho: rules-first question understanding. No AI call. Text -> {intent, args}; the answer comes from the ask_* SQL functions.
import { devToLatin } from '../voice/normalize'

export type Intent =
  | 'sales' | 'top_items' | 'slow_items' | 'low_stock' | 'item_stock' | 'customer_balance' | 'top_debtors' | 'customer_history'
  | 'supplier_due' | 'last_price' | 'cash_expected' | 'bill_count' | 'busiest_hour' | 'udhaar_collected' | 'profit'
  | 'bill_search' | 'online_orders'

export type Range = { from: string; to: string; label: 'today' | 'yesterday' | 'week' | 'lastweek' | 'month' | 'lastmonth' | 'day' }
export type Parsed = { intent: Intent; range: Range; name?: string; days?: number }

const pad = (n: number) => String(n).padStart(2, '0')
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }

/** Lower-case Latin words; Devanagari is turned into rough Latin so one rule set serves Hindi, Hinglish and English. */
export function norm(text: string): string {
  const t = text.toLowerCase().replace(/[?.!,;:"“”']/g, ' ')
  return t.split(/\s+/).filter(Boolean).map((w) => (/[ऀ-ॿ]/.test(w) ? devToLatin(w) : w)).join(' ')
}

export function rangeOf(q: string, now = new Date()): Range {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const has = (re: RegExp) => re.test(q)
  if (has(/\b(pichle|pichhle|last|previous|guzre|bite|pichla)\b.*\b(hafte|haphte|hapta|week)\b|\blast week\b/)) {
    const mon = addDays(today, -((today.getDay() + 6) % 7) - 7)
    return { from: iso(mon), to: iso(addDays(mon, 6)), label: 'lastweek' }
  }
  if (has(/\b(pichle|pichhle|last|previous|bite|pichla)\b.*\b(mahine|mahina|month)\b|\blast month\b/)) {
    const a = new Date(today.getFullYear(), today.getMonth() - 1, 1), b = new Date(today.getFullYear(), today.getMonth(), 0)
    return { from: iso(a), to: iso(b), label: 'lastmonth' }
  }
  if (has(/\b(is|this|iss)\b.*\b(hafte|haphte|hapta|week)\b|\b(hafte|haphte|week)\b/)) {
    const mon = addDays(today, -((today.getDay() + 6) % 7))
    return { from: iso(mon), to: iso(today), label: 'week' }
  }
  if (has(/\b(is|this|iss)\b.*\b(mahine|mahina|month)\b|\b(mahine|mahina|month)\b/)) return { from: iso(new Date(today.getFullYear(), today.getMonth(), 1)), to: iso(today), label: 'month' }
  if (has(/\b(kal|yesterday|beeta|beete)\b/) && !has(/\bkal (subah|aana)\b/)) { const y = addDays(today, -1); return { from: iso(y), to: iso(y), label: 'yesterday' } }
  if (has(/\b(parso|parson)\b/)) { const y = addDays(today, -2); return { from: iso(y), to: iso(y), label: 'day' } }
  return { from: iso(today), to: iso(today), label: 'today' }
}

// Words that are not part of a name / item.
const STOP = new Set(('ka ki ke ko se me mein pe par hai hain tha the kitna kitni kitne kya kab kaun kaise kisko kisse aaj kal parso is iss us ye wo yeh woh '
  + 'batao bata do dikhao dikha de dena dedo mujhe mera meri mere hamara total sab sabse zyada jyada kam bacha bachi bache baki baaki bakaya '
  + 'the a an of for to in on my me how much many what is are was show tell give udhaar udhar udhari khata khate hisaab hisab balance history '
  + 'stock maal item items bill bills price rate bhav bhaav last latest hafte week mahine month pichle is hafta mahina ji bhai').split(' '))

const SALUTE = new Set(['ji', 'bhai', 'bhaiya', 'sahab', 'sahib', 'madam', 'mam', 'aunty', 'uncle', 'didi'])

function entity(q: string): string | undefined {
  const w = q.split(' ').filter((x) => x && !STOP.has(x) && !SALUTE.has(x) && !/^\d+$/.test(x))
  const s = w.join(' ').trim()
  return s.length >= 2 ? s : undefined
}

type Rule = { intent: Intent; re: RegExp; w: number }
// Higher weight wins; the first match of equal weight wins. Order = priority.
const RULES: Rule[] = [
  { intent: 'profit', re: /\b(profit|munafa|munaafa|nafa|naafa|labh|margin)\b/, w: 9 },
  { intent: 'busiest_hour', re: /\b(bheed|bhid|busy|rush|peak)\b|kab\b.*\b(zyada|jyada|sabse)\b.*\b(grahak|customer|bill|bikri|log)\b|\bkis (time|waqt|samay)\b.*\b(zyada|jyada)\b/, w: 9 },
  { intent: 'cash_expected', re: /\b(galla|gulla|gallay)\b|\bcash\b.*\b(hona|kitna|expected|chahiye|count|milana)\b|\bcash in hand\b/, w: 9 },
  { intent: 'udhaar_collected', re: /\b(udhaar|udhar|udhari|khata)\b.*\b(wapas|vapas|vasool|vasooli|recover|collect|mila|aaya|aya|jama)\b|\b(vasooli|wasooli|recovery)\b|\b(wapas|vapas)\b.*\b(udhaar|udhar|paisa|paise)\b/, w: 9 },
  { intent: 'top_debtors', re: /\b(sabse|zyada|jyada|top|biggest|kis ?kis|kon ?kon|kaun ?kaun|sabka|sabhi|sab)\b.*\b(udhaar|udhar|udhari|baki|baaki|dena|dues|owe)\b|\b(udhaar|udhar|baki|baaki)\b.*\b(list|sab|total|kul)\b|\bkis ?kis ka\b|\bkitna udhaar (hai|baki|baaki)\b$/, w: 8 },
  { intent: 'supplier_due', re: /\b(supplier|suppliers|wholesaler|dukandar|distributor|vendor|party)\b.*\b(dena|due|baki|baaki|kitna)\b|\b(dena|due)\b.*\b(supplier|wholesaler|vendor)\b|\bmaal ?ka (udhaar|baki)\b/, w: 8 },
  { intent: 'online_orders', re: /\b(online|store|website)\b.*\b(order|orders)\b|\borders?\b.*\b(aaye|aaya|aye|pending|naye|new|kitne)\b|\bonline order\b/, w: 8 },
  { intent: 'slow_items', re: /\b(nahi|nhi|na)\b.*\b(bik|bika|bikta|bikra|chal)\b|\b(slow|dead|padha|pada|pade|padi)\b|\bkam bik|\bkaun sa maal nahi\b|\bnot selling\b/, w: 8 },
  { intent: 'low_stock', re: /\b(khatam|khatm|low stock|kam (hai|ho|hone)|mangwana|mangana|order karna|kya (lena|mangwana)|restock|running out|out of stock|stock out|bahut kam)\b|\bkya kya (kam|khatam)\b/, w: 8 },
  { intent: 'top_items', re: /\b(sabse|zyada|jyada|top|best|most)\b.*\b(bik|bika|bikta|bikne|becha|sell|selling|sold|chal)\b|\bbest ?seller\b|\bkya (zyada|jyada) (bika|bikta|bik)\b/, w: 8 },
  { intent: 'bill_count', re: /\bkitne (bill|bills|grahak|customer|log)\b|\bhow many (bills|customers)\b|\bbill (count|ginti)\b|\bbills? kitne\b/, w: 8 },
  { intent: 'last_price', re: /\b(last|pichla|pichhla|aakhri|akhri|latest)\b.*\b(rate|price|bhav|bhaav|daam|dam)\b|\b(kitne|kis) (mein|me|rate|bhav)\b.*\b(diya|becha|bika|dena|tha)\b|\bkis bhav\b|\b(rate|bhav|bhaav|daam) (kya|kitna)\b/, w: 7 },
  { intent: 'customer_history', re: /\b(history|hisaab|hisab|lena dena|len den|entries|kab kab|purana|statement)\b/, w: 6 },
  { intent: 'item_stock', re: /\b(stock|bacha|bachi|bache|bachha|available|hai kya|kitna hai|kitni hai|kitne hain)\b/, w: 6 },
  { intent: 'customer_balance', re: /\b(udhaar|udhar|udhari|baki|baaki|bakaya|dena|balance|khata|khate|dues?|owe|owes)\b/, w: 7 },
  { intent: 'bill_search', re: /\b(bill|bills)\b.*\b(dhundo|dhoondo|dhundho|search|find|dikhao|dikha|batao)\b|\b(dhundo|dhoondo|search|find)\b.*\bbill\b/, w: 6 },
  { intent: 'sales', re: /\b(bika|bikri|bikra|becha|sale|sales|total|kamai|kamayi|income|collection|hisaab|hisab|kitna kamaya|revenue|business|dhandha|dhanda)\b/, w: 5 },
]

export function parse(text: string, now = new Date()): Parsed | null {
  const q = norm(text)
  if (!q) return null
  let best: Rule | null = null
  for (const r of RULES) if (r.re.test(q) && (!best || r.w > best.w)) best = r
  if (!best) return null
  let intent = best.intent
  const range = rangeOf(q, now)
  const name = entity(q)
  // "<name> ka udhaar" vs "sabka udhaar": no name left -> everyone
  if (intent === 'customer_balance' && !name) intent = 'top_debtors'
  if (intent === 'customer_history' && !name) return { intent: 'top_debtors', range }
  if ((intent === 'item_stock' || intent === 'last_price' || intent === 'bill_search') && !name) return null
  // "<name> ka hisaab" with a known word like "bikri" is sales; with a name it is the khata history
  if (intent === 'customer_history' && /\b(bikri|sale|sales|aaj|kal)\b/.test(q) && !name) intent = 'sales'
  const days = Number(q.match(/\b(\d{1,3})\s*(din|days?)\b/)?.[1]) || undefined
  return { intent, range, name, days }
}

// What to run for an intent (RPC + args). Pure, so it is easy to test.
export function plan(p: Parsed): { fn: string; args: Record<string, unknown> } {
  const dates = { p_from: p.range.from, p_to: p.range.to }
  switch (p.intent) {
    case 'sales': return { fn: 'ask_sales', args: dates }
    case 'top_items': return { fn: 'ask_top_items', args: { ...dates, p_limit: 5 } }
    case 'slow_items': return { fn: 'ask_slow_items', args: { p_days: p.days ?? 30, p_limit: 8 } }
    case 'low_stock': return { fn: 'ask_low_stock', args: { p_limit: 10 } }
    case 'item_stock': return { fn: 'ask_item_stock', args: { p_query: p.name ?? '' } }
    case 'customer_balance': return { fn: 'ask_customer_balance', args: { p_name: p.name ?? '' } }
    case 'top_debtors': return { fn: 'ask_top_debtors', args: { p_limit: 5 } }
    case 'customer_history': return { fn: 'ask_customer_history', args: { p_name: p.name ?? '', p_limit: 8 } }
    case 'supplier_due': return { fn: 'ask_supplier_due', args: { p_name: p.name ?? '' } }
    case 'last_price': return { fn: 'ask_last_price', args: { p_query: p.name ?? '' } }
    case 'cash_expected': return { fn: 'ask_cash_expected', args: { p_date: p.range.from } }
    case 'bill_count': return { fn: 'ask_bill_count', args: dates }
    case 'busiest_hour': return { fn: 'ask_busiest_hour', args: p.range.to === p.range.from ? { p_from: iso(addDays(new Date(p.range.from + 'T00:00:00'), -29)), p_to: p.range.to } : dates }
    case 'udhaar_collected': return { fn: 'ask_udhaar_collected', args: dates }
    case 'profit': return { fn: 'ask_profit_estimate', args: dates }
    case 'bill_search': return { fn: 'ask_bill_search', args: { p_text: p.name ?? '', p_limit: 8 } }
    case 'online_orders': return { fn: 'ask_online_orders', args: {} }
  }
}

export const EXAMPLES = [
  'Aaj kitna bika?', 'Sharma ji ka udhaar?', 'Kya kya khatam ho raha hai?', 'Cheeni kitni bachi?',
  'Sabse zyada kya bika is hafte?', 'Galla mein kitna hona chahiye?', 'Kis kis ka udhaar baaki hai?', 'Maggi ka last rate?',
]
