// Universe lookup: one fetch (cached forever by hash), then every spoken word resolves with a single map lookup.
export type UItem = { id: string; hinglish: string; hi: string; en: string; category: string; unit: string; loose: boolean; brand: string | null }
type Packed = { v: number; c: string[]; u: string[]; b: string[]; i: [string, string, string, string, number, number, number, number, string[]][] }
export const norm = (s: string) => s.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]+/gu, '').replace(/(.)\1+/g, '$1')
let data: Packed | null = null
let loading: Promise<Packed> | null = null
let keyMap: Map<string, number[]> | null = null, keyFor: Packed | null = null
export function loadUniverse(): Promise<Packed> {
  if (data) return Promise.resolve(data)
  return (loading ??= fetch('/universe/u.json', { cache: 'no-cache' }).then((r) => r.json()).then((m) => fetch(m.file, { cache: 'force-cache' })).then((r) => r.json()).then((d: Packed) => (data = d)))
}
const unpack = (d: Packed, n: number): UItem => { const r = d.i[n]; return { id: r[0], hinglish: r[1], hi: r[2], en: r[3], category: d.c[r[4]], unit: d.u[r[5]], loose: r[6] === 1, brand: r[7] < 0 ? null : d.b[r[7]] } }
/** All Universe items matching a spoken/typed name (exact alias, O(1)). Empty if not loaded or unknown. */
export function findInUniverse(word: string): UItem[] {
  if (!data) return []
  if (!keyMap || keyFor !== data) { keyFor = data; keyMap = new Map(); data.i.forEach((r, n) => { for (const a of [r[1], r[2], r[3], r[0].replace(/-/g, ' '), ...r[8]]) { const k = norm(a); const l = keyMap!.get(k); if (!l) keyMap!.set(k, [n]); else if (!l.includes(n)) l.push(n) } }) }
  const hit = keyMap.get(norm(word))
  return hit === undefined ? [] : (Array.isArray(hit) ? hit : [hit]).map((n) => unpack(data!, n))
}

/** Universe items in the voice matcher's shape (with aliases), to grow the catalogue index. */
export function universeMatchables() {
  if (!data) return []
  return data.i.map((r) => ({ id: 'u:' + r[0], hinglish: r[1], hi: r[2], en: r[3], unit: data!.u[r[5]], loose: r[6] === 1, brand: r[7] < 0 ? null : data!.b[r[7]], aliases: r[8] }))
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
