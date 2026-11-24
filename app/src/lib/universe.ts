// Universe lookup: one fetch (cached forever by hash), then every spoken word resolves with a single map lookup.
/** A flavour/size of an item (Maggi -> Masala). `en` falls back to `hinglish` when the packed file leaves it out. */
export type UVariant = { id: string; hinglish: string; hi: string; en: string; aliases: string[]; default: boolean }
export type UItem = { id: string; hinglish: string; hi: string; en: string; category: string; unit: string; loose: boolean; brand: string | null; variants: UVariant[]; /** variant that was asked for; the default one when only the item name was said; null if the item has no variants */ variant: UVariant | null }
type PVariant = [string, string, string, string, string[]]
type Row = [string, string, string, string, number, number, number, number, string[], number?, PVariant[]?]
type Packed = { v: number; c: string[]; u: string[]; b: string[]; i: Row[] }
export const norm = (s: string) => s.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]+/gu, '').replace(/(.)\1+/g, '$1')
let data: Packed | null = null
let loading: Promise<Packed> | null = null
let keyMap: Map<string, [number, number][]> | null = null, keyFor: Packed | null = null
export function loadUniverse(): Promise<Packed> {
  if (data) return Promise.resolve(data)
  return (loading ??= fetch('/universe/u.json', { cache: 'no-cache' }).then((r) => r.json()).then((m) => fetch(m.file, { cache: 'force-cache' })).then((r) => r.json()).then((d: Packed) => (data = d)))
}
const variantsOf = (r: Row): UVariant[] => (r[10] ?? []).map((v, k) => ({ id: v[0], hinglish: v[1], hi: v[2], en: v[3] || v[1], aliases: v[4], default: k === r[9] }))
const unpack = (d: Packed, n: number, vi = -1): UItem => {
  const r = d.i[n], variants = variantsOf(r)
  const variant = variants.length ? variants[vi >= 0 ? vi : (r[9] ?? 0)] : null
  return { id: r[0], hinglish: r[1], hi: r[2], en: r[3], category: d.c[r[4]], unit: d.u[r[5]], loose: r[6] === 1, brand: r[7] < 0 ? null : d.b[r[7]], variants, variant }
}
/** Spoken phrases that name one variant of an item: "<item> <variant>" and "<variant> <item>" in each of the item's own names. */
function variantPhrases(r: Row, v: PVariant, full: boolean): string[] {
  // the item's own names plus its two shortest aliases, so "maggi masala" works as well as "maggi chhota masala"
  const parents = [...new Set([r[1], r[3], ...[...r[8]].filter((a) => a.length >= 3).sort((a, b) => a.length - b.length).slice(0, 2)])], vn = [v[1], v[3] || v[1], ...v[4]], out: string[] = []
  for (const p of parents) for (const a of vn) { out.push(p + ' ' + a); if (full || a === v[1]) out.push(a + ' ' + p) }
  return out
}
const variantNames = (r: Row, v: PVariant) => ({ hinglish: r[1] + ' ' + v[1], hi: r[2] + ' ' + v[2], en: r[3] + ' ' + (v[3] || v[1]) })
/** All Universe items matching a spoken/typed name (exact alias, O(1)). Empty if not loaded or unknown.
 *  The item name alone gives the default variant; "<item> <flavour>" gives that flavour (`variant`). */
export function findInUniverse(word: string): UItem[] {
  if (!data) return []
  if (!keyMap || keyFor !== data) {
    keyFor = data; const km = keyMap = new Map()
    const add = (a: string, n: number, vi: number) => { const k = norm(a); if (!k) return; const l = km.get(k); if (!l) km.set(k, [[n, vi]]); else if (!l.some((x) => x[0] === n && x[1] === vi)) l.push([n, vi]) }
    data.i.forEach((r, n) => {
      for (const a of [r[1], r[2], r[3], r[0].replace(/-/g, ' '), ...r[8]]) add(a, n, -1)
      r[10]?.forEach((v, k) => { for (const a of variantPhrases(r, v, true)) add(a, n, k); add(r[2] + ' ' + v[2], n, k) })
    })
  }
  const hit = keyMap.get(norm(word))
  if (!hit) return []
  const seen = new Set<number>(), out: UItem[] = []
  for (const [n, vi] of hit) { if (seen.has(n)) continue; seen.add(n); out.push(unpack(data, n, vi)) }
  return out
}

/** Universe items in the voice matcher's shape (with aliases), to grow the catalogue index.
 *  An item with variants is ONE entry that means its default variant (saying "Maggi" gives Maggi Masala) and also answers to
 *  the default's phrases; every other variant is its own entry (id u:<item>:<variant>) named "<item> <variant>". */
const mm = new WeakMap<Packed, ReturnType<typeof build>>()
function build(d: Packed) {
  const out: { id: string; hinglish: string; hi: string; en: string; unit: string; loose: boolean; brand: string | null; aliases: string[]; parentId?: string; variant?: string }[] = []
  for (const r of d.i) {
    const base = { unit: d.u[r[5]], loose: r[6] === 1, brand: r[7] < 0 ? null : d.b[r[7]] }
    const dv = r[10]?.[r[9] ?? 0]
    out.push({ id: 'u:' + r[0], hinglish: r[1], hi: r[2], en: r[3], ...base, aliases: dv ? [...r[8], ...variantPhrases(r, dv, true)] : r[8], ...(dv ? { variant: dv[3] || dv[1] } : {}) })
    r[10]?.forEach((v, k) => { if (k === r[9]) return; out.push({ id: 'u:' + r[0] + ':' + v[0], ...variantNames(r, v), ...base, aliases: variantPhrases(r, v, false), parentId: 'u:' + r[0], variant: v[3] || v[1] }) })
  }
  return out
}
export function universeMatchables() {
  if (!data) return []
  let m = mm.get(data); if (!m) mm.set(data, (m = build(data)))
  return m
}
const LS = 'omni-universe'
/** Start-up: use the copy saved on this phone instantly (works offline), refresh in the background. */
export function warmUniverse(onReady: () => void) {
  try { const c = localStorage.getItem(LS); if (c && !data) { data = JSON.parse(c); onReady() } } catch { /* storage blocked */ }
  loadUniverseFresh().then((d) => { if (d) { try { localStorage.setItem(LS, JSON.stringify(d)) } catch { /* full */ } onReady() } }).catch(() => {})
}
async function loadUniverseFresh(): Promise<Packed | null> {
  const m = await (await fetch('/universe/u.json', { cache: 'no-cache' })).json()
  if (data && data.v === m.v && (data as Packed & { h?: string }).h === m.file) return null
  const d = await (await fetch(m.file, { cache: 'force-cache' })).json() as Packed & { h?: string }
  d.h = m.file; data = d; return d
}
