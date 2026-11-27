import type { Parsed, ParsedItem } from './parse'
import { matchName, type Candidate } from './match'
import { chooseFlavour, type FlavourChoice } from './flavour'
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
  /** said as money ("50 rupaye ka dhaniya") and the shop has no price yet: the line is that amount (qty 1 x price) */ rupees?: number
  /** flavour engine: the variants of this product + the "Kaunsa?" one-tap choices (only if this shop sells a mix). Never blocks. */
  flavour?: FlavourChoice<ShopMatchable> | null
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
  orderId?: string                 // bill made from an online order
  lines: Line[]
  amount: number | null
  pay: 'cash' | 'upi' | 'udhaar' | null   // nothing pre-selected: owner must choose
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
  // several flavours/sizes of one product: pick this shop's favourite (else the Universe default) without asking; "badlo" stays one tap away
  const flavour = candidates[0] ? chooseFlavour(candidates[0], p.said, shop, shop.flavour) : null
  const match = flavour?.match ?? candidates[0] ?? null
  const { price, sure: priceSure } = match ? priceOf(match) : { price: null, sure: false }
  // "50 rupaye ka dhaniya": with a shop price the qty follows from it; without one the line IS the amount (1 x Rs 50)
  const amountLine = p.rupees != null && price == null
  return {
    key: 'l' + ++n, said: p.said, match, candidates, sure: p.sure && !!match,
    qty: amountLine ? 1 : qtyFor(p, match, price), price: amountLine ? p.rupees : price, priceSure: amountLine ? true : priceSure, flavour,
    ...(amountLine ? { rupees: p.rupees! } : {}),
  }
}

/** The owner picked another flavour/size for a line ("badlo" / "Kaunsa?"): new item, its own price, and no more questions. */
export function withVariant(l: Line, m: ShopMatchable): Partial<Line> {
  const { price, sure } = priceOf(m)
  const f = l.flavour
  return { match: m, sure: true, price, priceSure: sure, flavour: f ? { ...f, match: m, ask: null, explicit: true, options: [m, ...f.options.filter((x) => x.id !== m.id)] } : f }
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
    pay: parsed.pay ?? null,
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

/** One bill/stock line as save_bill / add_stock want it. Carries the flavour/size (variant, variant_hi) and the product family it belongs to. */
export function billLinePayload(l: Line) {
  const m = l.match!
  return {
    item_id: m.shop?.id ?? null, catalog_id: m.id.startsWith('shop:') ? null : m.id,
    name: m.shop?.name ?? m.hinglish, name_hi: m.shop?.name_hi ?? m.hi,
    unit: m.shop?.unit ?? m.unit, loose: m.loose, said: l.said, qty: l.qty, price: l.price,
    variant: m.variant ?? null, variant_hi: m.variantHi ?? null, family: m.family ?? null,
  }
}
