import { fold, phonKey, skelKey, soundKey } from './normalize'

// Anything that can be matched by name: catalogue items now, the shop's own items/learned names later.
export type Matchable = { id: string; hinglish: string; hi: string; en: string; brand: string | null; unit: string; loose: boolean; aliases: string[]
  /** variant family: every flavour/size of one product shares the id of its parent entry (the default variant) */ family?: string
  /** short label of the variant ("Masala 70g") and its Hindi form */ variant?: string; variantHi?: string
  /** old item ids this entry replaces, as "u:<id>" */ aka?: string[]
  /** only on a family's default entry: what the parent alone is called ("maggi", "मैगी") */ generic?: string[] }
export type Candidate = { id: string; score: number; item: Matchable }

type Entry = { key: string; sound: string; phon: string; words: string[]; item: Matchable; exact: string }
// Speed: exact names resolve through a Map (O(1)); fuzzy scoring only runs on entries that share
// at least one letter-pair or sound-pair with what was said (inverted index), not on every entry.
// phon / skel: Hinglish phonetic keys (see phonKey in normalize.ts): unseen spellings that sound like a known name land here.
export type MatchIndex = { entries: Entry[]; byId: Map<string, Matchable>; exact: Map<string, number[]>; grams: Map<string, number[]>; phon: Map<string, number[]>; skel: Map<string, number[]> }

const push = (m: Map<string, number[]>, k: string, v: number) => { const a = m.get(k); if (a) { if (a[a.length - 1] !== v) a.push(v) } else m.set(k, [v]) }
function gramsOf(key: string, sound: string): string[] { const g: string[] = []; for (let i = 0; i < key.length - 1; i++) g.push(key.slice(i, i + 2)); for (let i = 0; i < sound.length - 1; i++) g.push('~' + sound.slice(i, i + 2)); return g }

/** Add items to an index (skips ids already present). Used to grow the catalogue with the Universe at runtime. */
export function extendIndex(idx: MatchIndex, items: Matchable[]): number {
  let added = 0
  for (const item of items) {
    if (idx.byId.has(item.id)) continue
    idx.byId.set(item.id, item); added++
    const lower = (a: string) => a.toLowerCase().trim()
    const names = new Set([...item.aliases, item.hinglish, item.en, item.hi].map(lower).filter(Boolean))
    const main = new Set([item.hinglish, item.en, item.hi].map(lower))
    // Index size: a spelling whose phonetic key an own name / earlier spelling already has finds the same item through that entry,
    // so it keeps its exact-match slot but adds no letter-pair / phonetic postings (the bulk of the index memory and build time).
    const es: Entry[] = [...names].map((a) => ({ key: fold(a), sound: soundKey(a), phon: phonKey(a), words: a.split(/\s+/), item, exact: a }))
    const seenPhon = new Set<string>()
    for (const e of es) if (main.has(e.exact) && e.phon.length >= 3) seenPhon.add(e.phon)
    for (const e of es) {
      const n = idx.entries.push(e) - 1
      push(idx.exact, e.key, n); push(idx.exact, e.exact, n)
      if (e.phon.length >= 3) {
        if (seenPhon.has(e.phon) && !main.has(e.exact)) continue
        seenPhon.add(e.phon)
        push(idx.phon, e.phon, n); const sk = skelKey(e.phon); if (sk.length >= 3) push(idx.skel, sk, n)
      }
      for (const g of gramsOf(e.key, e.sound)) push(idx.grams, g, n)
    }
  }
  return added
}

export function buildIndex(items: Matchable[]): MatchIndex {
  const idx: MatchIndex = { entries: [], byId: new Map(), exact: new Map(), grams: new Map(), phon: new Map(), skel: new Map() }
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

const counts = new WeakMap<MatchIndex, Uint8Array>()
const POSTINGS = 5000
const SKEL = 0.62   // consonant-skeleton guess: below the 0.7 "this is a known word" line, so unknown names still read as unknown
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
  // Speed: count how many letter/sound pairs each entry shares with what was said and only score the best-overlapping ones
  // (with 3,000+ variants a bare gram hit would drag thousands of entries through the similarity test on every word).
  const grams = [...new Set(gramsOf(pf, ps))]
  // rarest letter-pairs first; very common pairs ("ma", "~ka" sit in thousands of names) are skipped once enough rare ones have been read
  const lists: number[][] = []
  for (const g of grams) { const l = idx.grams.get(g); if (l) lists.push(l) }
  lists.sort((a, b) => a.length - b.length)
  let cnt = counts.get(idx); if (!cnt || cnt.length < idx.entries.length) counts.set(idx, (cnt = new Uint8Array(idx.entries.length + 8192)))
  const touched: number[] = []
  let read = 0, used = 0
  for (const l of lists) {
    if (used >= 3 && read + l.length > POSTINGS) break
    used++; read += l.length
    for (let i = 0; i < l.length; i++) { const n = l[i]; if (cnt[n]++ === 0) touched.push(n) }
  }
  const need = Math.max(1, Math.floor(used * 0.3))
  const strong: number[] = []
  for (const n of touched) { if (cnt[n] >= need) strong.push(n) }
  if (strong.length > 250) strong.sort((a, b) => cnt![b] - cnt![a])
  for (let i = 0; i < Math.min(250, strong.length); i++) seen.add(strong[i])
  for (const n of touched) cnt[n] = 0
  for (const n of idx.exact.get(pf) ?? []) seen.add(n)
  for (const n of idx.exact.get(p) ?? []) seen.add(n)
  // phonetic layer: names that SOUND the same whatever the spelling (kolgate = colgate, ashirbad = aashirvaad)
  const pk = phonKey(p)
  const phonHit = pk.length >= 3 ? idx.phon.get(pk) : undefined
  if (phonHit) for (const n of phonHit) seen.add(n)
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
      // phonetic key: coarser than the sound key (c=k, v=b, o=u, silent trailing a/h), so STT spellings never seen before still land
      if (pk.length >= 3 && e.phon.length >= 3) { if (pk === e.phon) s = Math.max(s, 0.88); else { const d = dice(pk, e.phon); if (d >= 0.82) s = Math.max(s, d * 0.9) } }
    }
    const prev = best.get(e.item.id)
    if (!prev || s > prev.score) best.set(e.item.id, { id: e.item.id, score: s, item: e.item })
  }
  // last resort: nothing close, so try the consonant skeleton (maida/meda/mayda = "md"): shown as a guess, never "sure"
  if (pk.length >= 3 && ![...best.values()].some((c) => c.score >= 0.7)) {
    const sk = skelKey(pk)
    if (sk.length >= 3) for (const n of idx.skel.get(sk) ?? []) { const e = idx.entries[n]; const prev = best.get(e.item.id); if (!prev || prev.score < SKEL) best.set(e.item.id, { id: e.item.id, score: SKEL, item: e.item }) }
  }
  return [...best.values()].filter((c) => c.score >= 0.55).sort((a, b) => b.score - a.score).slice(0, limit)
}

/**
 * Is the top candidate certain? Not when the gap to the next is small, or when the owner said only a
 * brand word that several different products share ("maggi" = noodles + ketchup): then we ask "Yahi wali?". Variants of one product never block.
 */
export function isSure(phrase: string, cands: Candidate[], idx: MatchIndex): boolean {
  if (cands.length === 0) return false
  const a = cands[0], fam = (c: Candidate) => c.item.family ?? c.item.id
  // a runner-up that is just another flavour/size of the same product is no competition
  const b = cands.find((c) => fam(c) !== fam(a))
  if (a.score < 0.85) return false
  if (b && b.score >= a.score - 0.12) return false
  const p = phrase.toLowerCase().trim()
  // flavours/sizes of ONE product are not a reason to ask (the flavour engine picks one and offers "badlo");
  // only different products sharing the word ("maggi" = noodles + ketchup + masala) are.
  const family = new Set(idx.entries.filter((e) => e.exact === p || e.exact.startsWith(p + ' ')).map((e) => e.item.family ?? e.item.id))
  // ...unless the word IS the product's own name ("maggi" for Maggi Noodles, whose variants the flavour engine handles)
  const ownName = !!a.item.generic?.some((g) => g.toLowerCase().trim() === p)
  if (family.size > 1 && !a.item.loose && !ownName) return false
  return true
}
