import { nameScore, parse, type Parsed } from './parse'
import type { MatchIndex, Matchable } from './match'

/**
 * What we know about THIS shop, to break ties between readings that are equally clear: items the shop already stocks
 * (a Matchable with a `shop` row counts automatically, or pass the ids), and what it sold lately (match ids / product families).
 */
export type PickContext = { shopItems?: Set<string>; recent?: Iterable<string> }
const OWN = 0.8, RECENT = 0.6
const recentSet = new WeakMap<object, Set<string>>()
function recentOf(ctx?: PickContext): Set<string> | null {
  if (!ctx?.recent) return null
  const key = ctx.recent as object
  let s = recentSet.get(key); if (!s) recentSet.set(key, (s = ctx.recent instanceof Set ? ctx.recent : new Set(ctx.recent)))
  return s
}
const isOwn = (m: Matchable, ctx?: PickContext) => !!(ctx?.shopItems?.has(m.id) || (m as { shop?: unknown }).shop)

/** How well did the rules understand this reading of the sentence? Higher = better. */
export function scoreParsed(p: Parsed, known: string[] = [], ctx?: PickContext): number {
  let s = 0
  if (p.intent === 'unknown') return -10
  if (p.intent === 'payment' || p.intent === 'galla') s += p.amount !== null ? 5 : -2
  if (p.intent === 'query') s += p.items.length === 1 ? 3 : 0
  if (p.intent === 'bill' || p.intent === 'stock_in' || p.intent === 'query') {
    if (p.items.length === 0) s -= 3
    else s += 1
  }
  for (const i of p.items) {
    if (i.candidates.length === 0) { s -= 4; continue }            // unknown word: nothing in the catalogue sounds like it
    s += i.sure ? 3 : 1
    s += i.candidates[0].score * 2
    if (i.qty !== null || i.rupees !== null) s += 1
    // context: a name this shop really has / sold lately beats one that merely sounds alike
    if (i.candidates[0].score >= 0.7) {
      const m = i.candidates[0].item, rec = recentOf(ctx)
      if (isOwn(m, ctx)) s += OWN
      if (rec && (rec.has(m.id) || (m.family && rec.has(m.family)))) s += RECENT
    }
  }
  if (p.customer) {
    const isKnown = known.some((k) => k.toLowerCase() === p.customer!.toLowerCase() || nameScore(p.customer!, k) >= 0.9)
    s += isKnown ? 3 : p.customerSure ? 1 : -0.5
  }
  return s
}

export type Best = { text: string; parsed: Parsed; index: number; score: number }

/** Parse every n-best reading of what was said and return the one the rules understand best (ties go to the phone's own first choice). */
export function pickBest(alts: string[], idx: MatchIndex, known: string[] = [], ctx?: PickContext): Best | null {
  const list = [...new Set(alts.map((a) => a.trim()).filter(Boolean))]
  let best: Best | null = null
  list.forEach((text, index) => {
    const parsed = parse(text, idx, known)
    const score = scoreParsed(parsed, known, ctx) + (index === 0 ? 0.5 : 0) - index * 0.01
    if (!best || score > best.score) best = { text, parsed, index, score }
  })
  return best
}
