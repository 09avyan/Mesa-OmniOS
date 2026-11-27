// Flavour engine: which flavour / pack size of a product does "Maggi" mean in THIS shop?
// Rules (owner, 24 Nov): never block billing with "Yahi wali?" for flavours.
//  1. Parent name only ("maggi")  -> auto-pick: this shop's favourite if it has one, else the Universe default.
//  2. The line always carries the other variants so the UI can show a small "Masala 70g · badlo" chip.
//  3. Only if the shop REALLY sells several flavours of it (>= MIN_SALES recent sales and the top one is under SHARE)
//     the line also carries `ask`: the top 2-3 as one-tap choices with the auto-pick preselected. Still non-blocking.
//  4. Said clearly ("maggi chicken", "coke 250ml") -> exactly that, nothing to ask.
import type { Matchable } from './match'
import { norm } from '../lib/universe'

/** recent sales per product family, newest last: ids of the entry that was sold */
export type FlavourHistory = Record<string, string[]>
export const WINDOW = 30      // sales remembered per product
export const MIN_SALES = 10   // below this the shop has no "regular" yet
export const SHARE = 0.7      // top flavour under 70% of recent sales = mixed

export type FlavourChoice<T extends Matchable = Matchable> = {
  /** what goes on the bill unless the owner changes it */
  match: T
  /** every variant of the product, auto-pick first, then the shop's best sellers, then the rest */
  options: T[]
  /** mixed shop only: the top 2-3 to offer as one-tap choices (auto-pick included, first) */
  ask: T[] | null
  /** true when the owner named the variant themselves */
  explicit: boolean
  /** true when the pick comes from this shop's own sales, not the Universe default */
  learned: boolean
}

type Shoppish<T extends Matchable> = { byMatchId: Map<string, T> }
const famCache = new WeakMap<object, Map<string, Matchable[]>>()
/** all variants of a family, the default (parent entry) first */
export function familyMembers<T extends Matchable>(shop: Shoppish<T>, family: string): T[] {
  let m = famCache.get(shop.byMatchId)
  if (!m) {
    m = new Map()
    for (const x of shop.byMatchId.values()) if (x.family) { const l = m.get(x.family); if (l) l.push(x); else m.set(x.family, [x]) }
    for (const [f, l] of m) l.sort((a, b) => (a.id === f ? -1 : b.id === f ? 1 : 0))
    famCache.set(shop.byMatchId, m)
  }
  return (m.get(family) ?? []) as T[]
}

const counts = (ids: string[]) => { const c = new Map<string, number>(); for (const id of ids.slice(-WINDOW)) c.set(id, (c.get(id) ?? 0) + 1); return c }
/** members sorted by recent sales, most sold first; never-sold ones keep their list order (default first) */
function ranked<T extends Matchable>(members: T[], ids: string[]): T[] {
  const c = counts(ids)
  return members.map((m, i) => ({ m, i, n: c.get(m.id) ?? 0 })).sort((a, b) => b.n - a.n || a.i - b.i).map((x) => x.m)
}
/** the shop sells several flavours of this product regularly: enough recent sales and no flavour has 70% of them */
export function isMixed(ids: string[]): boolean {
  const recent = ids.slice(-WINDOW)
  if (recent.length < MIN_SALES) return false
  const top = Math.max(...counts(recent).values())
  return top / recent.length < SHARE
}

/** was the parent said on its own ("maggi") rather than a specific flavour/size? */
const isGeneric = (m: Matchable, said: string) => !!m.generic && m.generic.some((g) => norm(g) === norm(said))

/** Decide the variant for one spoken/matched line. Returns null when the product has no variants. */
export function chooseFlavour<T extends Matchable>(m: T, said: string, shop: Shoppish<T>, hist: FlavourHistory): FlavourChoice<T> | null {
  if (!m.family) return null
  const members = familyMembers(shop, m.family)
  if (members.length < 2) return null
  const ids = hist[m.family] ?? []
  const byPopularity = ranked(members, ids)
  // said a specific flavour/size: respect it exactly
  if (m.id !== m.family || !isGeneric(m, said)) return { match: m, options: [m, ...byPopularity.filter((x) => x.id !== m.id)], ask: null, explicit: true, learned: false }
  const learned = ids.length > 0
  const pick = learned ? byPopularity[0] : members[0]
  const options = [pick, ...byPopularity.filter((x) => x.id !== pick.id)]
  // only flavours this shop has really sold are offered (never a random one just to fill the row)
  const sold = counts(ids), top = options.filter((o) => sold.has(o.id)).slice(0, 3)
  const ask = isMixed(ids) && top.length >= 2 ? top : null
  return { match: pick, options, ask, explicit: false, learned }
}

// ---- learning: what this shop actually sold, per product family --------------------------------------------------

const KEY = (shopKey: string) => 'omni-flavour:' + shopKey
export function loadHistory(shopKey: string): FlavourHistory {
  try { const v = JSON.parse(localStorage.getItem(KEY(shopKey)) ?? '{}'); return v && typeof v === 'object' ? v : {} } catch { return {} }
}
function saveHistory(shopKey: string, h: FlavourHistory) { try { localStorage.setItem(KEY(shopKey), JSON.stringify(h)) } catch { /* storage blocked or full: learning just stays in memory */ } }
/** counts saved on the server (flavour_sales table) -> a short synthetic history, so a new phone or cleared browser still knows the favourite */
export function seedFromCounts(rows: { family: string; match_id: string; n: number }[]): FlavourHistory {
  const by = new Map<string, { id: string; n: number }[]>()
  for (const r of rows) { const l = by.get(r.family); const e = { id: r.match_id, n: Number(r.n) }; if (l) l.push(e); else by.set(r.family, [e]) }
  const out: FlavourHistory = {}
  for (const [f, l] of by) {
    const total = l.reduce((s, x) => s + x.n, 0), k = total > WINDOW ? WINDOW / total : 1
    // interleave so "last N" keeps the right mix
    const bag = l.map((x) => ({ id: x.id, left: Math.max(1, Math.round(x.n * k)) })); const seq: string[] = []
    while (bag.some((b) => b.left > 0)) for (const b of bag) if (b.left > 0) { seq.push(b.id); b.left-- }
    out[f] = seq.slice(-WINDOW)
  }
  return out
}
/** merge server seed into what this phone already knows (the phone's own recent sales win) */
export const mergeHistory = (local: FlavourHistory, seed: FlavourHistory): FlavourHistory => ({ ...seed, ...Object.fromEntries(Object.entries(local).filter(([, v]) => v.length)) })

/** remember what was just sold. Pure: returns the new history; `persist` also writes it to this phone. */
export function recordSales(hist: FlavourHistory, sold: { family?: string; id: string }[], persistKey?: string): FlavourHistory {
  const next: FlavourHistory = { ...hist }
  for (const s of sold) if (s.family) next[s.family] = [...(next[s.family] ?? []), s.id].slice(-WINDOW)
  if (persistKey) saveHistory(persistKey, next)
  return next
}
