import { dice, type Matchable } from '../voice/match'
import { fold, soundKey } from '../voice/normalize'
// Universe lookup: one fetch (cached forever by hash), then every spoken word resolves with a single map lookup.
/** A flavour and/or pack size of an item (Maggi -> "Masala 70g"). `en` is always the same as `hinglish`. */
export type UVariant = { id: string; hinglish: string; hi: string; en: string; aliases: string[]; default: boolean; /** old stand-alone item ids this variant replaced (stock/bills made before v6 still land here) */ legacy: string[] }
export type UItem = { id: string; hinglish: string; hi: string; en: string; category: string; unit: string; loose: boolean; brand: string | null; variants: UVariant[]; /** variant that was asked for; the default one when only the item name was said; null if the item has no variants */ variant: UVariant | null }
type PVariant = [string, string, string[]?, string[]?]
type Row = [string, string, string, string, number, number, number, number, string[], number?, PVariant[]?]
/** Unpacked, ready to use: one Row per item (see the file header of scripts/build-universe.mjs for what the file stores). */
export type Packed = { v: number; c: string[]; u: string[]; b: string[]; i: Row[] }
type PName = number[] | [string, string]
/** The file as downloaded (format p2): names are numbers into the word lists e (English) / h (Hindi). */
export type PackedFile = { v: number; p: 2; c: string[]; u: string[]; b: string[]; e: string; h: string; I: string; X: string; t: unknown[][]; i: unknown[][] }
export const norm = (s: string) => s.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]+/gu, '').replace(/(.)\1+/g, '$1')
/** variant id = slug of its hinglish name (not shipped in the file) */
export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '')
// Fields the file leaves out because they can be derived (keeps it small): item id = slug(hinglish), en = hinglish, a size-only variant's Hindi name.
const SZ: Record<string, string> = { g: 'ग्राम', kg: 'किलो', ml: 'मिली', l: 'लीटर', pcs: 'पीस', pc: 'पीस' }
/** "500g" -> "500 ग्राम", "Rs 10" -> "₹10"; null when the name is not only sizes (keep in step with scripts/build-universe.mjs) */
export function autoHi(name: string): string | null {
  const out: string[] = [], t = name.split(' ')
  for (let i = 0; i < t.length; i++) {
    let m
    if (t[i].toLowerCase() === 'rs' && /^\d+$/.test(t[i + 1] ?? '')) { out.push('₹' + t[++i]); continue }
    if ((m = /^(\d+(?:\.\d+)?)(g|kg|ml|l)$/i.exec(t[i]))) { out.push(m[1] + ' ' + SZ[m[2].toLowerCase()]); continue }
    if (/^\d+$/.test(t[i]) && /^(pcs|pc)$/i.test(t[i + 1] ?? '')) { out.push(t[i] + ' ' + SZ.pcs); i++; continue }
    return null
  }
  return out.join(' ')
}
const vhi = (v: PVariant) => v[1] || autoHi(v[0]) || v[0]
/** Aliases of one item: an alias is the name with up to 3 words edited ("2" "4" "1" "e" = word 2 keeps its first 4 and last 1 letters, the middle becomes "e"),
 *  "^" = the name turned one word round, "=text" = written out (keep in step with scripts/build-universe.mjs). */
function aliasesOf(name: string, s: string): string[] {
  if (!s) return []
  const nt = name.toLowerCase().split(' ')
  return s.split('|').map((a) => {
    if (a === '^') return [...nt.slice(1), nt[0]].join(' ')
    if (a[0] === '=') return a.slice(1)
    const t = nt.slice()
    for (const e of a.split(' ')) { const i = e.charCodeAt(0) - 48, p = e.charCodeAt(1) - 48, q = e.charCodeAt(2) - 48; t[i] = nt[i].slice(0, p) + e.slice(3) + (q ? nt[i].slice(nt[i].length - q) : '') }
    return t.join(' ')
  })
}
/** Turns the downloaded file into rows, a slice at a time (so the phone stays smooth); `next()` gives the next row. */
function unpacker(p: PackedFile): () => Row {
  const E = p.e.split('|'), H = p.h.split('|'), I = p.I.split('|'), X = p.X.split('|'), shared: (PVariant[] | undefined)[] = []
  let n = 0, ii = 0, xi = 0
  const words = (x: number[], L: string[]) => { let s = L[x[0]]; for (let k = 1; k < x.length; k++) s += ' ' + L[x[k]]; return s }
  const nm = (x: PName): [string, string] => (typeof x[0] === 'number' ? [words(x as number[], E), words(x as number[], H)] : (x as [string, string]))
  const auto = new Map<string, string | null>()
  const vrow = (x: PName, a = '', leg: string[] = []): PVariant => {
    const [h, hi] = nm(x), al = aliasesOf(h, a)
    let au = auto.get(h); if (au === undefined) auto.set(h, (au = autoHi(h)))
    const v: PVariant = [h, hi === au ? '' : hi]
    if (al.length || leg.length) v.push(al); if (leg.length) v.push(leg)
    return v
  }
  return () => {
    const r = p.i[n++] as [PName, number, number, string, (number | unknown[])?], [h, hi] = nm(r[0]), f = r[1]
    const row: Row = [f & 256 ? I[ii++] : slug(h), h, hi, f & 512 ? X[xi++] : h, f & 31, (f >> 5) & 3, (f >> 7) & 1, r[2] - 1, r[3] ? aliasesOf(h, r[3]) : []]
    const vl = r[4]
    if (!vl) return row
    if (typeof vl === 'number') {
      // lists of variants that many items share (250g / 500g ...) are unpacked once; rows only read them
      const t = p.t[vl - 1] as unknown[]
      row.push(t[0] as number, (shared[vl] ??= t.slice(1).map((e) => vrow(e as PName))))
    } else row.push(vl[0] as number, vl.slice(1).map((e) => vrow((e as unknown[])[0] as PName, (e as unknown[])[1] as string | undefined, (e as unknown[])[2] as string[] | undefined)))
    return row
  }
}
/** Unpack everything at once (tests, scripts). The app uses unpackUniverseAsync. */
export function unpackUniverse(p: PackedFile): Packed {
  const next = unpacker(p), i: Row[] = []
  while (i.length < p.i.length) i.push(next())
  return { v: p.v, c: p.c, u: p.u, b: p.b, i }
}
const yieldNow = (): Promise<void> => { const s = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler; return s?.yield ? s.yield() : new Promise((r) => setTimeout(r, 0)) }
/** Same, in slices of about 6 ms with a break in between, so opening the app never freezes a cheap phone for one long stretch. */
export async function unpackUniverseAsync(p: PackedFile): Promise<Packed> {
  const next = unpacker(p), i: Row[] = []
  while (i.length < p.i.length) {
    const t0 = performance.now()
    do { for (let k = 0; k < 32 && i.length < p.i.length; k++) i.push(next()) } while (i.length < p.i.length && performance.now() - t0 < 6)
    if (i.length < p.i.length) await yieldNow()
  }
  return { v: p.v, c: p.c, u: p.u, b: p.b, i }
}
let data: Packed | null = null, dataFile: string | null = null
let loading: Promise<Packed> | null = null
let keyMap: Map<string, [number, number][]> | null = null, keyFor: Packed | null = null
const fetchPointer = (): Promise<{ v: number; file: string }> => fetch('/universe/u.json', { cache: 'no-cache' }).then((r) => r.json())
const fetchFile = (file: string): Promise<PackedFile> => fetch(file, { cache: 'force-cache' }).then((r) => r.json())
export function loadUniverse(): Promise<Packed> {
  if (data) return Promise.resolve(data)
  return (loading ??= fetchPointer().then(async (m) => { const d = await unpackUniverseAsync(await fetchFile(m.file)); data = d; dataFile = m.file; return d }))
}
const variantsOf = (r: Row): UVariant[] => (r[10] ?? []).map((v, k) => ({ id: slug(v[0]), hinglish: v[0], hi: vhi(v), en: v[0], aliases: v[2] ?? [], default: k === r[9], legacy: v[3] ?? [] }))
/** One Universe item (with the variant that was asked for, default when vi is -1). */
export const universeItem = (d: Packed, n: number, vi = -1): UItem => {
  const r = d.i[n], variants = variantsOf(r)
  const variant = variants.length ? variants[vi >= 0 ? vi : (r[9] ?? 0)] : null
  return { id: r[0], hinglish: r[1], hi: r[2], en: r[3], category: d.c[r[4]], unit: d.u[r[5]], loose: r[6] === 1, brand: r[7] < 0 ? null : d.b[r[7]], variants, variant }
}

// A variant name is "<flavour> <size>" ("Masala 70g"), "<size>" ("750ml", "Rs 10") or just "<flavour>" ("Chicken").
const SIZE = /\b(\d+(?:\.\d+)?)\s?(kg|g|ml|l)\b|\brs (\d+)\b/i
const SIZE_G = new RegExp(SIZE.source, 'gi')
/** size words as people say them: "70g" -> "70 gram", "1L" -> "1 litre", "Rs 10" -> "10 rupaye" */
function sizeForms(tok: string): string[] {
  const m = SIZE.exec(tok); if (!m) return [tok]
  // one spoken form per unit: the matcher's letter-pair scoring already covers gm/gram, kg/kilo, liter/litre, rupee/rupaye (keeps the index small)
  if (m[3]) return [tok, m[3] + ' rupaye', m[3] + ' wala']
  const n = m[1], u = m[2].toLowerCase()
  return [tok, ...(u === 'g' ? [n + ' gram'] : u === 'kg' ? [n + ' kilo'] : u === 'l' ? [n + ' litre'] : [])]
}
/** Per-variant spoken parts, once per item: the full name, the flavour alone and the size alone (each only on the FIRST variant that has it, so "maggi masala" picks the default masala, not a random size). */
function variantForms(r: Row): string[][] {
  const seenFlavour = new Set<string>(), seenSize = new Set<string>()
  return (r[10] ?? []).map((v) => {
    const forms = [v[0], ...(v[2] ?? [])]
    const sizes = [...v[0].matchAll(SIZE_G)].map((m) => m[0])
    const flavour = v[0].replace(SIZE_G, ' ').replace(/\s+/g, ' ').trim()
    if (flavour && sizes.length && !seenFlavour.has(norm(flavour))) { seenFlavour.add(norm(flavour)); forms.push(flavour) }
    if (sizes.length) { const k = norm(sizes.join('')); if (!seenSize.has(k)) { seenSize.add(k); for (const x of sizes) forms.push(...sizeForms(x)) } }
    return forms
  })
}
/** Aliases worth their own index entry: one per distinct pronunciation. A spelling that sounds the same as the name or an earlier alias
 *  ("meda" next to "maida") already scores 0.9+ through the matcher's sound key, so indexing it again only slows every lookup.
 *  (findInUniverse still keeps every spelling in its exact map.) */
const spokenCache = new WeakMap<Row, string[]>()
function spokenAliases(r: Row): string[] {
  let a = spokenCache.get(r); if (a) return a
  const seen = new Set([r[1], r[2], r[3]].map((x) => soundKey(x)))
  spokenCache.set(r, (a = r[8].filter((x) => { const k = soundKey(x); if (seen.has(k)) return false; seen.add(k); return true })))
  return a
}
/** What the item is called when a flavour/size is added: its names plus the 2 shortest aliases that are really another name (not a respelling of the main one). */
const parentNames = (r: Row) => { const f = fold(r[1]); return [...new Set([r[1], r[3], ...r[8].filter((a) => a.length >= 3 && dice(fold(a), f) < 0.6).sort((a, b) => a.length - b.length).slice(0, 2)])] }
/** Spoken phrases that name one variant: "<item> <form>" and "<form> <item>" for each of the item's own names. */
function variantPhrases(parents: string[], forms: string[], lean = false): string[] {
  // "<item> <form>" for every form; "<form> <item>" ("chicken maggi") only for the item's main name and only for the full variant name and
  // flavour words; short aliases ("coke 250ml") get every "<alias> <form>", the longer second name only the full variant name. Keeps the index small and matching fast.
  const out: string[] = []
  // lean (voice index of the other variants): no reversed order and no spoken size words; the matcher's letter-pair scoring covers "280 gram" vs "280g"
  if (lean) forms = forms.filter((f) => !/\d (gram|kilo|litre|rupaye|wala)$/.test(f))
  parents.forEach((p, k) => { for (const f of k === 0 || p.length <= 8 ? forms : forms.slice(0, 1)) { out.push(p + ' ' + f); if (!lean && k === 0 && (f === forms[0] || !/\d/.test(f))) out.push(f + ' ' + p) } })
  return out
}
const formsCache = new WeakMap<Row, string[][]>()
const formsOf = (r: Row) => { let f = formsCache.get(r); if (!f) formsCache.set(r, (f = variantForms(r))); return f }

/** All Universe items matching a spoken/typed name (exact alias, O(1)). Empty if not loaded or unknown.
 *  The item name alone gives the default variant; "<item> <flavour>", "<item> <size>" give that variant (`variant`). */
export function findInUniverse(word: string): UItem[] {
  if (!data) return []
  if (!keyMap || keyFor !== data) {
    keyFor = data; const km = keyMap = new Map()
    const add = (a: string, n: number, vi: number) => { const k = norm(a); if (!k) return; const l = km.get(k); if (!l) km.set(k, [[n, vi]]); else if (!l.some((x: [number, number]) => x[0] === n && x[1] === vi)) l.push([n, vi]) }
    data.i.forEach((r, n) => {
      for (const a of [r[1], r[2], r[3], r[0].replace(/-/g, ' '), ...r[8]]) add(a, n, -1)
      if (!r[10]) return
      const parents = parentNames(r), forms = formsOf(r)
      r[10].forEach((v, k) => { for (const a of variantPhrases(parents, forms[k])) add(a, n, k); add(r[2] + ' ' + vhi(v), n, k) })
    })
  }
  const hit = keyMap.get(norm(word))
  if (!hit) return []
  const seen = new Set<number>(), out: UItem[] = []
  for (const [n, vi] of hit) { if (seen.has(n)) continue; seen.add(n); out.push(universeItem(data, n, vi)) }
  return out
}

/** One thing the voice matcher can match: an item, or one variant of it (see Matchable in voice/match.ts). */
export type UMatchable = Matchable
/** Universe items in the voice matcher's shape (with aliases), to grow the catalogue index.
 *  An item with variants is a FAMILY: the default variant keeps the parent id (u:<item>) and also answers to the bare parent name
 *  ("Maggi" = Maggi Masala 70g); every other variant is its own entry u:<item>:<variant-id> named "<item> <variant>". */
const mm = new WeakMap<Packed, UMatchable[]>()
function build(d: Packed): UMatchable[] {
  const out: UMatchable[] = []
  for (const r of d.i) {
    const base = { unit: d.u[r[5]], loose: r[6] === 1, brand: r[7] < 0 ? null : d.b[r[7]] }
    const vs = r[10]
    if (!vs) { out.push({ id: 'u:' + r[0], hinglish: r[1], hi: r[2], en: r[3], ...base, aliases: spokenAliases(r) }); continue }
    const parents = parentNames(r), forms = formsOf(r), pid = 'u:' + r[0], dflt = r[9] ?? 0
    vs.forEach((v, k) => {
      const names = { hinglish: r[1] + ' ' + v[0], hi: r[2] + ' ' + vhi(v), en: r[3] + ' ' + v[0] }
      const aka = (v[3] ?? []).map((x) => 'u:' + x)
      if (k === dflt) out.push({ id: pid, ...names, ...base, aliases: [r[1], r[2], r[3], ...spokenAliases(r), ...variantPhrases(parents, forms[k])], family: pid, variant: v[0], variantHi: vhi(v), generic: [r[1], r[2], r[3], ...r[8]], ...(aka.length ? { aka } : {}) })
      else out.push({ id: pid + ':' + slug(v[0]), ...names, ...base, aliases: variantPhrases(parents.slice(0, 2), forms[k], true), family: pid, variant: v[0], variantHi: vhi(v), ...(aka.length ? { aka } : {}) })
    })
  }
  return out
}
export function universeMatchables(): UMatchable[] {
  if (!data) return []
  let m = mm.get(data); if (!m) mm.set(data, (m = build(data)))
  return m
}
const LS = 'omni-universe-v11'
/** Start-up: use the copy saved on this phone instantly (works offline), refresh in the background. The saved copy is the downloaded file itself
 *  (about a third the size of the unpacked rows), and when its name (= content hash) matches the server's nothing is downloaded or unpacked again. */
export function warmUniverse(onReady: () => void) {
  let cachedFile: string | null = null
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k?.startsWith('omni-universe-') && k !== LS) localStorage.removeItem(k) } // older versions took 1-2 MB each
    const c = localStorage.getItem(LS)
    if (c && !data) {
      const o = JSON.parse(c) as { f: string; p: PackedFile }
      if (o.p?.p === 2) { cachedFile = o.f; unpackUniverseAsync(o.p).then((d) => { if (!data) { data = d; dataFile = o.f; onReady() } }).catch(() => {}) }
    }
  } catch { /* storage blocked */ }
  fetchPointer().then(async (m) => {
    if (m.file === (dataFile ?? cachedFile)) return
    const p = await fetchFile(m.file), d = await unpackUniverseAsync(p)
    data = d; dataFile = m.file
    try { localStorage.setItem(LS, JSON.stringify({ f: m.file, p })) } catch { /* full */ }
    onReady()
  }).catch(() => {})
}
