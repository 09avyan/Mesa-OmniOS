// Builds the Universe item list into ONE small, pre-indexed, cache-forever file for the app.
// Source (human-edited): supabase/seed/universe.json  ->  app/public/universe/u.<hash>.json + u.json (tiny pointer)
// Why fast: rows are arrays (no repeated keys), categories/units/brands are numbers into short tables,
// every spoken alias is pre-normalised into a lookup map (no searching at runtime), and the file name
// carries a content hash so phones download it once and keep it (immutable cache).
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const src = JSON.parse(readFileSync(join(here, '../../supabase/seed/universe.json'), 'utf8'))
export const norm = (s) => s.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]+/gu, '').replace(/(.)\1+/g, '$1')

const tab = { c: [], u: [], b: [] }
const ix = (t, v) => { if (v == null) return -1; let i = tab[t].indexOf(v); if (i < 0) { i = tab[t].length; tab[t].push(v) } return i }
const rows = [], keys = {}
// Derivable fields are not shipped (the phone refills them): id when it is the slug of the hinglish name, en when it equals hinglish,
// and a variant's Hindi name when it is just a size ("500g" -> "500 ग्राम", "Rs 10" -> "₹10"). Keep autoHi identical to src/lib/universe.ts.
const SZ = { g: 'ग्राम', kg: 'किलो', ml: 'मिली', l: 'लीटर', pcs: 'पीस', pc: 'पीस' }
export const autoHi = (name) => {
  const out = [], t = name.split(' ')
  for (let i = 0; i < t.length; i++) {
    let m
    if (t[i].toLowerCase() === 'rs' && /^\d+$/.test(t[i + 1] ?? '')) { out.push('₹' + t[++i]); continue }
    if ((m = /^(\d+(?:\.\d+)?)(g|kg|ml|l)$/i.exec(t[i]))) { out.push(m[1] + ' ' + SZ[m[2].toLowerCase()]); continue }
    if (/^\d+$/.test(t[i]) && /^(pcs|pc)$/i.test(t[i + 1] ?? '')) { out.push(t[i] + ' ' + SZ.pcs); i++; continue }
    return null
  }
  return out.join(' ')
}
// drop aliases that read the same as the item's own names (after lower-casing/folding): smaller file, fewer index entries
const dedupe = (it) => { const seen = new Set([it.hinglish, it.hi, it.en].map(norm)); return (it.aliases || []).filter((a) => { const k = norm(a); if (!k || seen.has(k)) return false; seen.add(k); return true }) }
// Variants (flavour + pack size) ride inside the parent row: r[9] = index of the default variant, r[10] = [[hinglish, hi, aliases?, legacyIds?], ...].
// The variant id is the slug of its hinglish name (computed on the phone, not shipped); en is always the hinglish name; trailing empty fields are cut.
// Rows without variants stay 9 long. Spoken forms ("<item> <flavour>", "<item> <size>") are built on the phone; the parent name alone means the default.
export const slug = (s) => s.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '')
const vRow = (v) => {
  if (slug(v.hinglish) !== v.id) throw new Error(`variant id ${v.id} must be slug(hinglish) = ${slug(v.hinglish)}`)
  if (v.en && v.en !== v.hinglish) throw new Error(`variant ${v.id}: en must equal hinglish`)
  const seen = new Set([norm(v.hinglish), norm(v.hi)])
  const al = (v.aliases || []).filter((a) => { const k = norm(a); if (!k || seen.has(k)) return false; seen.add(k); return true })
  const r = [v.hinglish, v.hi === autoHi(v.hinglish) ? '' : v.hi, al, v.legacy || []]
  while (r.length > 2 && Array.isArray(r[r.length - 1]) && r[r.length - 1].length === 0) r.pop()
  return r
}
let nVariants = 0
src.items.forEach((it, n) => {
  const row = [it.id === slug(it.hinglish) ? '' : it.id, it.hinglish, it.hi, it.en === it.hinglish ? '' : it.en, ix('c', it.category), ix('u', it.unit), it.loose ? 1 : 0, ix('b', it.brand), dedupe(it)]
  if (it.variants?.length) {
    const d = it.variants.filter((v) => v.default)
    if (d.length !== 1) throw new Error(`${it.id}: needs exactly one default variant (has ${d.length})`)
    const ids = new Set(); for (const v of it.variants) { if (ids.has(v.id)) throw new Error(`${it.id}: duplicate variant id ${v.id}`); ids.add(v.id) }
    row.push(it.variants.indexOf(d[0]), it.variants.map(vRow)); nVariants += it.variants.length
  }
  rows.push(row)
  for (const a of new Set([it.hinglish, it.hi, it.en, it.id.replace(/-/g, ' '), ...(it.aliases || [])])) {
    const k = norm(a); if (!k) continue
    if (keys[k] === undefined) keys[k] = n; else if (keys[k] !== n && !Array.isArray(keys[k])) keys[k] = [keys[k], n]; else if (Array.isArray(keys[k]) && !keys[k].includes(n)) keys[k].push(n)
  }
})
// aliases ride inside each row; the phone builds its own lookup map once, so no separate key table is sent
const body = JSON.stringify({ v: src.version, ...tab, i: rows })
const hash = createHash('sha256').update(body).digest('hex').slice(0, 10)
const out = join(here, '../public/universe'); mkdirSync(out, { recursive: true })
for (const f of readdirSync(out)) if (/^u\.[0-9a-f]{10}\.json$/.test(f)) unlinkSync(join(out, f))
writeFileSync(join(out, `u.${hash}.json`), body)
writeFileSync(join(out, 'u.json'), JSON.stringify({ v: src.version, file: `/universe/u.${hash}.json`, items: rows.length, variants: nVariants }))
const gz = gzipSync(body).length
console.log(`universe: ${rows.length} items, ${nVariants} variants, ${Object.keys(keys).length} keys, ${(Buffer.byteLength(body) / 1024).toFixed(1)} KB raw, ${(gz / 1024).toFixed(1)} KB gzip -> u.${hash}.json`)
// phones download this once; keep it under 320 KB gzipped (compact the row format before letting it grow past that)
if (gz > 320 * 1024) console.warn(`WARNING: universe is ${(gz / 1024).toFixed(1)} KB gzipped (> 320 KB budget)`)
