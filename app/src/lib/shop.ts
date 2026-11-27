import { supabase } from './supabase'
import { CATALOG } from '../voice/catalog'
import { buildIndex, dice, extendIndex, type Matchable, type MatchIndex } from '../voice/match'
import { fold } from '../voice/normalize'
import { loadUniverse, universeMatchables } from './universe'
import { loadHistory, mergeHistory, seedFromCounts, type FlavourHistory } from '../voice/flavour'

export type ShopItem = { id: string; catalog_id: string | null; name: string; name_hi: string | null; unit: string; loose: boolean; price: number | null; learned_price: number | null; stock: number; stock_known: boolean; hidden_online: boolean }
export type Customer = { id: string; name: string; tag: string | null; phone: string | null; balance: number }
/** 'Sharma ji · gali 4' — tag tells same-name customers apart */
export const custLabel = (c: { name: string; tag?: string | null }) => c.tag ? `${c.name} · ${c.tag}` : c.name

// One matchable per thing the shop can sell: catalogue items merged with the shop's own items + learned names.
export type ShopMatchable = Matchable & { shop?: ShopItem; lastPrice?: number }
export type Shop = { items: ShopItem[]; customers: Customer[]; index: MatchIndex; byMatchId: Map<string, ShopMatchable>
  /** what this shop sold per product family (flavour engine); `shopKey` names it on this phone */ flavour: FlavourHistory; shopKey: string; /** resolves when the whole Universe is in the matching index */ uniReady: Promise<void> }

let cache: Shop | null = null
let loading: Promise<Shop> | null = null

export function invalidateShop() { cache = null }

export async function loadShop(): Promise<Shop> {
  if (cache) return cache
  loading ??= (async () => {
    const [it, al, cu, lp, fs, ses] = await Promise.all([
      supabase.from('items').select('id,catalog_id,name,name_hi,unit,loose,price,learned_price,stock,stock_known,hidden_online'),
      supabase.from('item_aliases').select('alias,item_id'),
      supabase.from('customer_balances').select('id,name,tag,phone,balance').order('last_at', { ascending: false, nullsFirst: false }),
      supabase.from('bill_lines').select('item_id,price,bills!inner(created_at,status)').eq('bills.status', 'saved').order('created_at', { referencedTable: 'bills', ascending: false }).limit(500),
      supabase.from('flavour_sales').select('family,match_id,n'),   // table from migration 0012; missing/denied = just no server seed
      supabase.auth.getSession(),
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
    for (const s of items.filter((i) => !i.catalog_id)) {
      list.push({ id: 'shop:' + s.id, hinglish: s.name, hi: s.name_hi ?? s.name, en: s.name, brand: null, unit: s.unit, loose: s.loose, aliases: aliases.get(s.id) ?? [s.name.toLowerCase()], shop: s, lastPrice: last.get(s.id) })
    }
    const customers = ((cu.data ?? []) as Customer[]).map((c) => ({ ...c, balance: Number(c.balance) }))
    const shopKey = ses.data.session?.user.id ?? 'local'
    const flavour = mergeHistory(loadHistory(shopKey), seedFromCounts(fs.error ? [] : ((fs.data ?? []) as { family: string; match_id: string; n: number }[])))
    const index = buildIndex(list), byMatchId = new Map(list.map((m) => [m.id, m]))
    // The shop opens at once on the catalogue + own items. The Universe (5,000+ items) joins the index in small slices in the
    // background (never freezes an old phone, never abandoned because it was slow); `uniReady` resolves when it is all in.
    const known = new Set(list.flatMap((m) => [m.hinglish, m.en, m.hi, ...m.aliases].map((a) => fold(a.toLowerCase().trim()))))
    const uniReady = (async () => {
      let uni: ShopMatchable[] = []
      try { await loadUniverse(); uni = universeMatchables() as ShopMatchable[] } catch { return }
      const fresh: ShopMatchable[] = []
      for (const u of uni) {
        if ([u.hinglish, u.en, u.hi].some((a) => known.has(fold(a.toLowerCase().trim())))) continue
        // a variant that replaced an old stand-alone item (Maggi 280g, Tata Salt 500g) keeps that item's stock row and price
        const shop = byCatalog.get(u.id) ?? u.aka?.map((a) => byCatalog.get(a)).find(Boolean)
        fresh.push({ ...u, shop, lastPrice: shop ? last.get(shop.id) : undefined })
      }
      for (let i = 0; i < fresh.length; i += 250) {
        const part = fresh.slice(i, i + 250)
        extendIndex(index, part)
        for (const m of part) byMatchId.set(m.id, m)
        await new Promise<void>((r) => setTimeout(r, 0))   // let the screen breathe between slices
      }
    })()
    cache = { items, customers, index, byMatchId, flavour, shopKey, uniReady }
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
