import { fold } from './normalize'

// Anything that can be matched by name: catalogue items now, the shop's own items/learned names later.
export type Matchable = { id: string; hinglish: string; hi: string; en: string; brand: string | null; unit: string; loose: boolean; aliases: string[] }
export type Candidate = { id: string; score: number; item: Matchable }

type Entry = { key: string; words: string[]; item: Matchable; exact: string }
export type MatchIndex = { entries: Entry[]; byId: Map<string, Matchable> }

export function buildIndex(items: Matchable[]): MatchIndex {
  const entries: Entry[] = []
  for (const item of items) {
    const names = new Set([...item.aliases, item.hinglish, item.en, item.hi].map((a) => a.toLowerCase().trim()).filter(Boolean))
    for (const a of names) entries.push({ key: fold(a), words: a.split(/\s+/), item, exact: a })
  }
  return { entries, byId: new Map(items.map((i) => [i.id, i])) }
}

function bigrams(s: string) { const out: string[] = []; for (let i = 0; i < s.length - 1; i++) out.push(s.slice(i, i + 2)); return out }
/** Dice similarity on letter pairs, 0..1. Tolerates small spelling differences ("maggie" vs "maggi"). */
export function dice(a: string, b: string): number {
  if (a === b) return 1
  if (a.length < 2 || b.length < 2) return 0
  const A = bigrams(a), B = bigrams(b), m = new Map<string, number>()
  for (const x of A) m.set(x, (m.get(x) ?? 0) + 1)
  let hit = 0
  for (const x of B) { const c = m.get(x) ?? 0; if (c > 0) { hit++; m.set(x, c - 1) } }
  return (2 * hit) / (A.length + B.length)
}

/** Best candidates for a spoken item name, best first (one per item). */
export function matchName(phrase: string, idx: MatchIndex, limit = 3): Candidate[] {
  const p = phrase.toLowerCase().trim()
  if (!p) return []
  const pf = fold(p)
  const pWords = p.split(/\s+/)
  const best = new Map<string, Candidate>()
  for (const e of idx.entries) {
    let s: number
    if (e.exact === p || e.key === pf) s = 1
    else {
      s = dice(pf, e.key)
      // "aashirvaad atta 5 kilo wala" contains the alias "aashirvaad atta": strong but not exact.
      const contained = e.words.length > 1 && e.words.every((w) => pWords.includes(w))
      if (contained) s = Math.max(s, 0.9)
      // Spoken name is the first word(s) of a longer alias ("maggi" vs "maggi 4 pack").
      if (e.exact.startsWith(p + ' ')) s = Math.max(s, 0.8)
    }
    const prev = best.get(e.item.id)
    if (!prev || s > prev.score) best.set(e.item.id, { id: e.item.id, score: s, item: e.item })
  }
  return [...best.values()].filter((c) => c.score >= 0.55).sort((a, b) => b.score - a.score).slice(0, limit)
}

/**
 * Is the top candidate certain? Not when the gap to the next is small, or when the owner said only a
 * brand/family word that several items share ("maggi", "aashirvaad"): then we ask "Yahi wali?".
 */
export function isSure(phrase: string, cands: Candidate[], idx: MatchIndex): boolean {
  if (cands.length === 0) return false
  const [a, b] = cands
  if (a.score < 0.85) return false
  if (b && b.score >= a.score - 0.12) return false
  const p = phrase.toLowerCase().trim()
  const family = new Set(idx.entries.filter((e) => e.exact === p || e.exact.startsWith(p + ' ')).map((e) => e.item.id))
  if (family.size > 1 && !a.item.loose) return false
  return true
}
