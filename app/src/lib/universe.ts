// Universe lookup: one fetch (cached forever by hash), then every spoken word resolves with a single map lookup.
export type UItem = { id: string; hinglish: string; hi: string; en: string; category: string; unit: string; loose: boolean; brand: string | null }
type Packed = { v: number; c: string[]; u: string[]; b: string[]; i: [string, string, string, string, number, number, number, number][]; k: Record<string, number | number[]> }
export const norm = (s: string) => s.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]+/gu, '').replace(/(.)\1+/g, '$1')
let data: Packed | null = null
let loading: Promise<Packed> | null = null
export function loadUniverse(): Promise<Packed> {
  if (data) return Promise.resolve(data)
  return (loading ??= fetch('/universe/u.json', { cache: 'no-cache' }).then((r) => r.json()).then((m) => fetch(m.file, { cache: 'force-cache' })).then((r) => r.json()).then((d: Packed) => (data = d)))
}
const unpack = (d: Packed, n: number): UItem => { const r = d.i[n]; return { id: r[0], hinglish: r[1], hi: r[2], en: r[3], category: d.c[r[4]], unit: d.u[r[5]], loose: r[6] === 1, brand: r[7] < 0 ? null : d.b[r[7]] } }
/** All Universe items matching a spoken/typed name (exact alias, O(1)). Empty if not loaded or unknown. */
export function findInUniverse(word: string): UItem[] {
  if (!data) return []
  const hit = data.k[norm(word)]
  return hit === undefined ? [] : (Array.isArray(hit) ? hit : [hit]).map((n) => unpack(data!, n))
}
