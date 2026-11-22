import type { Parsed, ParsedItem } from './parse'
import { matchName, type Candidate } from './match'
import { priceOf, findCustomer, type Shop, type ShopMatchable, type Customer } from '../lib/shop'

// What the Review card shows and edits. Built from what was heard; nothing is saved until ✓.
export type Line = {
  key: string
  said: string
  match: ShopMatchable | null
  candidates: ShopMatchable[]
  sure: boolean          // false -> yellow "Yahi wali?" until Haan/Doosri
  qty: number | null
  price: number | null   // per unit
  priceSure: boolean     // false -> price box highlighted ("Daam sahi?")
}
export type Draft = {
  intent: Parsed['intent']
  heard: string
  customerName: string | null
  customer: Customer | null       // existing customer if we recognised the name
  customerSure: boolean           // false -> yellow "Yahi naam?"
  customerOthers: Customer[]
  newCustomer?: boolean            // owner said "Yeh nahi, naya …"
  tag?: string                     // pehchaan for a new same-name customer
  phone?: string                   // typed after payment; WhatsApp goes here
  lines: Line[]
  amount: number | null
  pay: 'cash' | 'upi' | 'udhaar'
}

let n = 0
const toMatchables = (c: Candidate[], shop: Shop) => c.map((x) => shop.byMatchId.get(x.id)).filter(Boolean) as ShopMatchable[]

/** Spoken unit vs the item's selling unit: "500 gram" of a kg item = 0.5. "₹50 ka dhaniya" = 50 / price. */
export function qtyFor(p: ParsedItem, m: ShopMatchable | null, price: number | null): number | null {
  if (p.rupees != null) return price ? Math.round((p.rupees / price) * 1000) / 1000 : null
  if (p.qty == null) return m ? 1 : null
  const unit = m?.unit
  if (p.unit === 'g' && unit === 'kg') return p.qty / 1000
  if (p.unit === 'ml' && unit === 'l') return p.qty / 1000
  if (p.unit === 'kg' && unit === 'g') return p.qty * 1000
  return p.qty
}

export function lineFrom(p: ParsedItem, shop: Shop): Line {
  const candidates = toMatchables(p.candidates, shop)
  const match = candidates[0] ?? null
  const { price, sure: priceSure } = match ? priceOf(match) : { price: null, sure: false }
  const rupeePrice = p.rupees != null && price == null ? null : price
  return {
    key: 'l' + ++n, said: p.said, match, candidates, sure: p.sure && !!match,
    qty: qtyFor(p, match, rupeePrice), price, priceSure,
  }
}

export function buildDraft(parsed: Parsed, shop: Shop): Draft {
  const found = parsed.customer ? findCustomer(parsed.customer, shop.customers) : { match: null, others: [] }
  return {
    intent: parsed.intent,
    heard: parsed.text,
    customerName: found.match?.name ?? parsed.customer,
    customer: found.match,
    customerSure: parsed.customerSure && !(parsed.customer && !found.match && found.others.length > 1),
    customerOthers: found.others,
    lines: parsed.items.map((p) => lineFrom(p, shop)),
    amount: parsed.amount,
    pay: 'cash',
  }
}

/** Search for the "Doosri / kuch aur" picker: any catalogue or shop item by name. */
export function searchItems(q: string, shop: Shop, limit = 6): ShopMatchable[] {
  return toMatchables(matchName(q, shop.index, limit), shop)
}

export const lineTotal = (l: Line) => (l.qty != null && l.price != null ? Math.round(l.qty * l.price * 100) / 100 : 0)
export const draftTotal = (d: Draft) => d.lines.reduce((s, l) => s + lineTotal(l), 0)
/** Everything answered? (items first, money second — DESIGN.md rule 16) */
export const linesReady = (d: Draft) => d.lines.length > 0 && d.lines.every((l) => l.sure && l.match && l.qty != null && l.qty > 0 && l.price != null)
