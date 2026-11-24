// Builds the Universe item list into ONE small, pre-indexed, cache-forever file for the app.
// Source (human-edited): supabase/seed/universe.json  ->  app/public/universe/u.<hash>.json + u.json (tiny pointer)
// Why fast: rows are arrays (no repeated keys), categories/units/brands are numbers into short tables,
// every spoken alias is pre-normalised into a lookup map (no searching at runtime), and the file name
// carries a content hash so phones download it once and keep it (immutable cache).
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const src = JSON.parse(readFileSync(join(here, '../../supabase/seed/universe.json'), 'utf8'))
export const norm = (s) => s.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]+/gu, '').replace(/(.)\1+/g, '$1')

const tab = { c: [], u: [], b: [] }
const ix = (t, v) => { if (v == null) return -1; let i = tab[t].indexOf(v); if (i < 0) { i = tab[t].length; tab[t].push(v) } return i }
const rows = [], keys = {}
src.items.forEach((it, n) => {
  rows.push([it.id, it.hinglish, it.hi, it.en, ix('c', it.category), ix('u', it.unit), it.loose ? 1 : 0, ix('b', it.brand)])
  for (const a of new Set([it.hinglish, it.hi, it.en, it.id.replace(/-/g, ' '), ...(it.aliases || [])])) {
    const k = norm(a); if (!k) continue
    if (keys[k] === undefined) keys[k] = n; else if (keys[k] !== n && !Array.isArray(keys[k])) keys[k] = [keys[k], n]; else if (Array.isArray(keys[k]) && !keys[k].includes(n)) keys[k].push(n)
  }
})
const body = JSON.stringify({ v: src.version, ...tab, i: rows, k: keys })
const hash = createHash('sha256').update(body).digest('hex').slice(0, 10)
const out = join(here, '../public/universe'); mkdirSync(out, { recursive: true })
for (const f of readdirSync(out)) if (/^u\.[0-9a-f]{10}\.json$/.test(f)) unlinkSync(join(out, f))
writeFileSync(join(out, `u.${hash}.json`), body)
writeFileSync(join(out, 'u.json'), JSON.stringify({ v: src.version, file: `/universe/u.${hash}.json`, items: rows.length }))
console.log(`universe: ${rows.length} items, ${Object.keys(keys).length} keys, ${(body.length / 1024).toFixed(1)} KB -> u.${hash}.json`)
