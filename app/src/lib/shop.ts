import { supabase } from './supabase'
import { CATALOG } from '../voice/catalog'
import { buildIndex, dice, type Matchable, type MatchIndex } from '../voice/match'
import { fold } from '../voice/normalize'
import { loadUniverse, universeMatchables } from './universe'

export type ShopItem = { id: string; catalog_id: string | null; name: string; name_hi: string | null; unit: string; loose: boolean; price: number | null; learned_price: number | null; stock: number; stock_known: boolean; hidden_online: boolean }
export type Customer = { id: string; name: string; tag: string | null; phone: string | null; balance: number }
/** 'Sharma ji · gali 4' — tag tells same-name customers apart */
export const custLabel = (c: { name: string; tag?: string | null }) => c.tag ? `${c.name} · ${c.tag}` : c.name

// One matchable per thing the shop can sell: catalogue items merged with the shop's own items + learned names.
export type ShopMatchable = Matchable & { shop?: ShopItem; lastPrice?: number }
export type Shop = { items: ShopItem[]; customers: Customer[]; index: MatchIndex; byMatchId: Map<string, ShopMatchable> }

let cache: Shop | null = null
let loading: Promise<Shop> | null = null

export function invalidateShop() { cache = null }

export async function loadShop(): Promise<Shop> {
  if (cache) return cache
  loading ??= (async () => {
    const [it, al, cu, lp] = await Promise.all([
      supabase.from('items').select('id,catalog_id,name,name_hi,unit,loose,price,learned_price,stock,stock_known,hidden_online'),
      supabase.from('item_aliases').select('alias,item_id'),
      supabase.from('customer_balances').select('id,name,tag,phone,balance').order('last_at', { ascending: false, nullsFirst: false }),
      supabase.from('bill_lines').select('item_id,price,bills!inner(created_at,status)').eq('bills.status', 'saved').order('created_at', { referencedTable: 'bills', ascending: false }).limit(500),
    ])
    const items = (it.data ?? []).map((x) => ({ ...x, price: num(x.price), learned_price: num(x.learned_price), stock: Number(x.stock) })) as ShopItem[]
    const last = new Map<string, number>()
    for (const r of (lp.data ?? []) as { item_id: string | null; price: number }[]) if (r.item_id && !last.has(r.item_id)) last.set(r.item_id, Number(r.price))
    const aliases = new Map<string, string[]>()
    for (const a of (al.data ?? []) as { alias: string; item_id: string }[]) aliases.set(a.item_id, [...(aliases.get(a.item_id) ?? []), a.alias])

    const byCatalog = new Map(items.filter((i) => i.catalog_id).map((i) => [i.catalog_id!, i]))
    const list: ShopMatchable[] = CATALOG.map((c) => {
      const shop = byCatalog.get(c.id)
      return { ...c, aliases: [...c.aliases, ...(shop ? aliases.get(shop.id) ?? [] : [])], shop, lastPrice: shop ? last.get(shop.id) : undefined }
    })
    // Universe: items the catalogue doesn't have. No price comes from the Universe: every shop keeps its OWN price
    // on its own items row (created on first sale/stock-in): stock-entry rate or manual price, else learned after
    // 3 bills at the same price; the owner can always change it. (Owner rule, 24 Nov.)
    const uni = await Promise.race([loadUniverse().then(() => universeMatchables()).catch(() => []), new Promise<[]>((r) => setTimeout(() => r([]), 1500))])
    const known = new Set(list.flatMap((m) => [m.hinglish, m.en, m.hi, ...m.aliases].map((a) => fold(a.toLowerCase().trim()))))
    for (const u of uni) {
      if ([u.hinglish, u.en, u.hi].some((a) => known.has(fold(a.toLowerCase().trim())))) continue
      const shop = byCatalog.get(u.id)
      list.push({ ...u, shop, lastPrice: shop ? last.get(shop.id) : undefined })
    }
    for (const s of items.filter((i) => !i.catalog_id)) {
      list.push({ id: 'shop:' + s.id, hinglish: s.name, hi: s.name_hi ?? s.name, en: s.name, brand: null, unit: s.unit, loose: s.loose, aliases: aliases.get(s.id) ?? [s.name.toLowerCase()], shop: s, lastPrice: last.get(s.id) })
    }
    const customers = ((cu.data ?? []) as Customer[]).map((c) => ({ ...c, balance: Number(c.balance) }))
    cache = { items, customers, index: buildIndex(list), byMatchId: new Map(list.map((m) => [m.id, m])) }
    loading = null
    return cache
  })()
  return loading
}
const num = (v: unknown) => (v === null || v === undefined ? null : Number(v))

/** Shop's selling price for an item: own price > learned (3 bills) > last used (needs a check). */
export function priceOf(m: ShopMatchable): { price: number | null; sure: boolean } {
  if (m.shop?.price != null) return { price: m.shop.price, sure: true }
  if (m.shop?.learned_price != null) return { price: m.shop.learned_price, sure: true }
  if (m.lastPrice != null) return { price: m.lastPrice, sure: false }
  return { price: null, sure: false }
}

/** Best existing customer for a spoken name ("sharma ji" ~ "Sharma Ji"); null if it looks new. */
export function findCustomer(name: string, customers: Customer[]): { match: Customer | null; others: Customer[] } {
  const key = fold(name.replace(/\b(ji|jee|bhai|bhaiya|didi|sahab|जी|भाई)\b/gi, ''))
  const scored = customers.map((c) => ({ c, s: dice(key, fold(c.name.replace(/\b(ji|jee|bhai|bhaiya|didi|sahab|जी|भाई)\b/gi, ''))) }))
    .filter((x) => x.s >= 0.6).sort((a, b) => b.s - a.s)
  // a tag said aloud picks the exact person ("sharma ji gali 4")
  const byTag = customers.filter((c) => c.tag && fold(name).includes(fold(c.tag)))
  if (byTag.length === 1) return { match: byTag[0], others: [] }
  const strong = scored.filter((x) => x.s >= 0.8)
  // two people with the same name: don't guess, ask
  if (strong.length > 1 && strong[1].s >= strong[0].s - 0.05) return { match: null, others: strong.slice(0, 5).map((x) => x.c) }
  return { match: strong[0]?.c ?? null, others: scored.slice(0, 4).map((x) => x.c) }
}
