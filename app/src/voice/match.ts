import { fold, soundKey } from './normalize'

// Anything that can be matched by name: catalogue items now, the shop's own items/learned names later.
export type Matchable = { id: string; hinglish: string; hi: string; en: string; brand: string | null; unit: string; loose: boolean; aliases: string[] }
export type Candidate = { id: string; score: number; item: Matchable }

type Entry = { key: string; sound: string; words: string[]; item: Matchable; exact: string }
// Speed: exact names resolve through a Map (O(1)); fuzzy scoring only runs on entries that share
// at least one letter-pair or sound-pair with what was said (inverted index), not on every entry.
export type MatchIndex = { entries: Entry[]; byId: Map<string, Matchable>; exact: Map<string, number[]>; grams: Map<string, number[]> }

const push = (m: Map<string, number[]>, k: string, v: number) => { const a = m.get(k); if (a) { if (a[a.length - 1] !== v) a.push(v) } else m.set(k, [v]) }
function gramsOf(key: string, sound: string): string[] { const g: string[] = []; for (let i = 0; i < key.length - 1; i++) g.push(key.slice(i, i + 2)); for (let i = 0; i < sound.length - 1; i++) g.push('~' + sound.slice(i, i + 2)); return g }

/** Add items to an index (skips ids already present). Used to grow the catalogue with the Universe at runtime. */
export function extendIndex(idx: MatchIndex, items: Matchable[]): number {
  let added = 0
  for (const item of items) {
    if (idx.byId.has(item.id)) continue
    idx.byId.set(item.id, item); added++
    const names = new Set([...item.aliases, item.hinglish, item.en, item.hi].map((a) => a.toLowerCase().trim()).filter(Boolean))
    for (const a of names) {
      const e: Entry = { key: fold(a), sound: soundKey(a), words: a.split(/\s+/), item, exact: a }
      const n = idx.entries.push(e) - 1
      push(idx.exact, e.key, n); push(idx.exact, e.exact, n)
      for (const g of gramsOf(e.key, e.sound)) push(idx.grams, g, n)
    }
  }
  return added
}

export function buildIndex(items: Matchable[]): MatchIndex {
  const idx: MatchIndex = { entries: [], byId: new Map(), exact: new Map(), grams: new Map() }
  extendIndex(idx, items)
  return idx
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
export function matchName(phrase: string, idx: MatchIndex, limit = 6): Candidate[] {
  const p = phrase.toLowerCase().trim()
  if (!p) return []
  const pf = fold(p)
  const ps = soundKey(p)
  const pWords = p.split(/\s+/)
  const best = new Map<string, Candidate>()
  // candidate set: entries sharing any letter/sound pair, plus multi-word aliases contained in the phrase
  const seen = new Set<number>()
  for (const g of gramsOf(pf, ps)) for (const n of idx.grams.get(g) ?? []) seen.add(n)
  for (const n of idx.exact.get(pf) ?? []) seen.add(n)
  for (const n of idx.exact.get(p) ?? []) seen.add(n)
  for (const n of seen) {
    const e = idx.entries[n]
    let s: number
    if (e.exact === p || e.key === pf) s = 1
    else {
      s = dice(pf, e.key)
      // "aashirvaad atta 5 kilo wala" contains the alias "aashirvaad atta": strong but not exact.
      const contained = e.words.length > 1 && e.words.every((w) => pWords.includes(w))
      if (contained) s = Math.max(s, 0.9)
      // Spoken name is the first word(s) of a longer alias ("maggi" vs "maggi 4 pack").
      if (e.exact.startsWith(p + ' ')) s = Math.max(s, 0.8)
      // same sound, different spelling/accent (maida ~ meda, eveready ~ everyday)
      if (ps.length >= 3 && e.sound.length >= 3) { const d = dice(ps, e.sound); if (ps === e.sound) s = Math.max(s, 0.9); else if (d >= 0.75) s = Math.max(s, d * 0.92) }
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
