import { parse, type Parsed } from './parse'
import type { MatchIndex } from './match'

/** How well did the rules understand this reading of the sentence? Higher = better. */
export function scoreParsed(p: Parsed, known: string[] = []): number {
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
  }
  if (p.customer) {
    const isKnown = known.some((k) => k.toLowerCase() === p.customer!.toLowerCase())
    s += isKnown ? 3 : p.customerSure ? 1 : -0.5
  }
  return s
}

export type Best = { text: string; parsed: Parsed; index: number; score: number }

/** Parse every n-best reading of what was said and return the one the rules understand best (ties go to the phone's own first choice). */
export function pickBest(alts: string[], idx: MatchIndex, known: string[] = []): Best | null {
  const list = [...new Set(alts.map((a) => a.trim()).filter(Boolean))]
  let best: Best | null = null
  list.forEach((text, index) => {
    const parsed = parse(text, idx, known)
    const score = scoreParsed(parsed, known) + (index === 0 ? 0.5 : 0) - index * 0.01
    if (!best || score > best.score) best = { text, parsed, index, score }
  })
  return best
}
