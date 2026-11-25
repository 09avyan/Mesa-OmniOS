import { dice, type Matchable } from '../voice/match'
import { fold, soundKey } from '../voice/normalize'
// Universe lookup: one fetch (cached forever by hash), then every spoken word resolves with a single map lookup.
/** A flavour and/or pack size of an item (Maggi -> "Masala 70g"). `en` is always the same as `hinglish`. */
export type UVariant = { id: string; hinglish: string; hi: string; en: string; aliases: string[]; default: boolean; /** old stand-alone item ids this variant replaced (stock/bills made before v6 still land here) */ legacy: string[] }
export type UItem = { id: string; hinglish: string; hi: string; en: string; category: string; unit: string; loose: boolean; brand: string | null; variants: UVariant[]; /** variant that was asked for; the default one when only the item name was said; null if the item has no variants */ variant: UVariant | null }
type PVariant = [string, string, string[]?, string[]?]
type Row = [string, string, string, string, number, number, number, number, string[], number?, PVariant[]?]
type Packed = { v: number; c: string[]; u: string[]; b: string[]; i: Row[] }
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
const fill = (d: Packed): Packed => { for (const r of d.i) { if (!r[0]) r[0] = slug(r[1]); if (!r[3]) r[3] = r[1] } return d }
let data: Packed | null = null
let loading: Promise<Packed> | null = null
let keyMap: Map<string, [number, number][]> | null = null, keyFor: Packed | null = null
export function loadUniverse(): Promise<Packed> {
  if (data) return Promise.resolve(data)
  return (loading ??= fetch('/universe/u.json', { cache: 'no-cache' }).then((r) => r.json()).then((m) => fetch(m.file, { cache: 'force-cache' })).then((r) => r.json()).then((d: Packed) => (data = fill(d))))
}
const variantsOf = (r: Row): UVariant[] => (r[10] ?? []).map((v, k) => ({ id: slug(v[0]), hinglish: v[0], hi: vhi(v), en: v[0], aliases: v[2] ?? [], default: k === r[9], legacy: v[3] ?? [] }))
const unpack = (d: Packed, n: number, vi = -1): UItem => {
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
  for (const [n, vi] of hit) { if (seen.has(n)) continue; seen.add(n); out.push(unpack(data, n, vi)) }
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
const LS = 'omni-universe-v8'
/** Start-up: use the copy saved on this phone instantly (works offline), refresh in the background. */
export function warmUniverse(onReady: () => void) {
  try { const c = localStorage.getItem(LS); if (c && !data) { data = JSON.parse(c); onReady() } } catch { /* storage blocked */ }
  loadUniverseFresh().then((d) => { if (d) { try { localStorage.setItem(LS, JSON.stringify(d)) } catch { /* full */ } onReady() } }).catch(() => {})
}
async function loadUniverseFresh(): Promise<Packed | null> {
  const m = await (await fetch('/universe/u.json', { cache: 'no-cache' })).json()
  if (data && data.v === m.v && (data as Packed & { h?: string }).h === m.file) return null
  const d = await (await fetch(m.file, { cache: 'force-cache' })).json() as Packed & { h?: string }
  d.h = m.file; data = fill(d); return d
}
