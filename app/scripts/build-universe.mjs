// Builds the Universe item list into ONE small, cache-forever file for the app.
// Source (human-edited): supabase/seed/universe.json  ->  app/public/universe/u.<hash>.json + u.json (tiny pointer)
// Packed format "p2" (the phone unpacks it once, see unpackUniverse in src/lib/universe.ts; keep the two in step):
//  - names are lists of numbers into a shared word table (e = English words, h = their Hindi words, same order), most-used first;
//    "Rs 10" and "70g" are single table entries, so a Hindi name is never shipped twice
//  - an alias is an edit of the item's own name ("2" "4" "1" "e" = word 2 keeps its first 4 and last 1 letters, middle becomes "e"),
//    "^" = the name rotated by one word, "=text" = anything else, as is
//  - lists of variants that several items share (250g / 500g ...) are stored once (t) and rows point at them
//  - id, English name, brand and flags only cost bytes when they differ from what the phone derives
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { gzipSync, brotliCompressSync } from 'node:zlib'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const src = JSON.parse(readFileSync(join(here, '../../supabase/seed/universe.json'), 'utf8'))
export const norm = (s) => s.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]+/gu, '').replace(/(.)\1+/g, '$1')
export const slug = (s) => s.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '')

const tab = { c: [], u: [], b: [] }
const ix = (t, v) => { if (v == null) return -1; let i = tab[t].indexOf(v); if (i < 0) { i = tab[t].length; tab[t].push(v) } return i }
// A variant's Hindi name that is just a size ("500g" -> "500 ग्राम", "Rs 10" -> "₹10") is not shipped. Keep autoHi identical to src/lib/universe.ts.
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
const dedupeV = (v) => { const seen = new Set([norm(v.hinglish), norm(v.hi)]); return (v.aliases || []).filter((a) => { const k = norm(a); if (!k || seen.has(k)) return false; seen.add(k); return true }) }
for (const it of src.items) for (const s of [it.id, it.hinglish, it.hi, it.en, ...(it.aliases || []), ...(it.variants || []).flatMap((v) => [v.hinglish, v.hi, ...(v.aliases || [])])]) if (s.includes('|')) throw new Error(`${it.id}: "|" is the list separator and cannot be inside a name`)

// ---- word table: a name is cut into words (a size like "70g" and "Rs 10" stay whole) and each word is paired with its Hindi word
const SZH = { g: 'ग्राम', kg: 'किलो', ml: 'मिली', l: 'लीटर' }
function unitize(name) { const t = name.split(' '), out = []; for (let i = 0; i < t.length; i++) { if (t[i].toLowerCase() === 'rs' && /^\d+$/.test(t[i + 1] ?? '')) { out.push(t[i] + ' ' + t[++i]); continue } out.push(t[i]) } return out }
function align(en, hi) {
  const u = unitize(en), h = hi.split(' '); let j = 0; const out = []
  for (const x of u) {
    let m
    if (/^rs \d+$/i.test(x)) { if (h[j] !== '₹' + x.split(' ')[1]) return null; out.push([x, h[j++]]); continue }
    if ((m = /^(\d+(?:\.\d+)?)(g|kg|ml|l)$/i.exec(x)) && h[j] === m[1] && h[j + 1] === SZH[m[2].toLowerCase()]) { out.push([x, h[j] + ' ' + h[j + 1]]); j += 2; continue }
    if (j >= h.length) return null
    out.push([x, h[j++]])
  }
  return j === h.length ? out : null
}
const lex = new Map()
const use = (e, h) => { const k = e + '\t' + h; let o = lex.get(k); if (!o) lex.set(k, (o = { e, h, n: 0, i: -1 })); o.n++; return o }
const nameOf = (en, hi) => { const a = align(en, hi); return a ? { p: a.map(([e, h]) => use(e, h)) } : { lit: [en, hi] } }
const items = src.items.map((it) => ({ it, name: nameOf(it.hinglish, it.hi), vs: (it.variants || []).map((v) => ({ v, name: nameOf(v.hinglish, v.hi) })) }))
const words = [...lex.values()].sort((a, b) => b.n - a.n || (a.e < b.e ? -1 : a.e > b.e ? 1 : 0)); words.forEach((o, i) => (o.i = i))
const enc = (n) => (n.lit ? n.lit : n.p.map((o) => o.i))

// ---- aliases as edits of the name (see header)
const CH = (n) => { if (n < 0 || n > 70) throw new RangeError('edit out of range'); return String.fromCharCode(48 + n) }
function aliasEnc(hinglish, aliases) {
  const nt = hinglish.toLowerCase().split(' ')
  return aliases.map((a) => {
    let best = '=' + a
    const at = a.split(' ')
    if (at.length === nt.length && nt.length <= 12) {
      if (nt.length > 2 && a === [...nt.slice(1), nt[0]].join(' ')) return '^'
      const edits = []
      for (let i = 0; i < at.length; i++) {
        const w = at[i], o = nt[i]; if (w === o) continue
        let p = 0; while (p < o.length && p < w.length && o[p] === w[p]) p++
        let q = 0; while (q < o.length - p && q < w.length - p && o[o.length - 1 - q] === w[w.length - 1 - q]) q++
        try { edits.push(CH(i) + CH(p) + CH(q) + w.slice(p, w.length - q)) } catch { edits.length = 99 }
      }
      if (edits.length && edits.length <= 3) { const s = edits.join(' '); if (s.length < best.length) best = s }
    }
    return best
  })
}

// ---- rows: [name, flags, brand+1, aliases ("|"-joined), variants (0 none | template number+1 | [default, [name, aliases?, legacy?], ...])]
const ids = [], ens = [], templates = [], tIndex = new Map(), rows = []
let nVariants = 0
for (const { it, name, vs } of items) {
  const hasId = it.id !== slug(it.hinglish) ? 1 : 0, hasEn = it.en !== it.hinglish ? 1 : 0
  if (hasId) ids.push(it.id)
  if (hasEn) ens.push(it.en)
  const row = [enc(name), ix('c', it.category) | (ix('u', it.unit) << 5) | ((it.loose ? 1 : 0) << 7) | (hasId << 8) | (hasEn << 9), ix('b', it.brand) + 1, aliasEnc(it.hinglish, dedupe(it)).join('|')]
  if (it.variants?.length) {
    const d = it.variants.filter((v) => v.default)
    if (d.length !== 1) throw new Error(`${it.id}: needs exactly one default variant (has ${d.length})`)
    const seen = new Set(); for (const v of it.variants) { if (seen.has(v.id)) throw new Error(`${it.id}: duplicate variant id ${v.id}`); seen.add(v.id) }
    for (const v of it.variants) {
      if (slug(v.hinglish) !== v.id) throw new Error(`variant id ${v.id} must be slug(hinglish) = ${slug(v.hinglish)}`)
      if (v.en && v.en !== v.hinglish) throw new Error(`variant ${v.id}: en must equal hinglish`)
    }
    nVariants += it.variants.length
    const di = it.variants.indexOf(d[0])
    if (vs.every(({ v }) => !dedupeV(v).length && !(v.legacy || []).length)) {
      const t = JSON.stringify([di, ...vs.map((x) => enc(x.name))]); let k = tIndex.get(t)
      if (k === undefined) { k = templates.length; tIndex.set(t, k); templates.push(JSON.parse(t)) }
      row.push(k + 1)
    } else row.push([di, ...vs.map(({ v, name }) => { const a = aliasEnc(v.hinglish, dedupeV(v)).join('|'), e = [enc(name)]; if (a || v.legacy?.length) e.push(a); if (v.legacy?.length) e.push(v.legacy); return e })])
  } else row.push(0)
  rows.push(row)
}
const body = JSON.stringify({ v: src.version, p: 2, ...tab, e: words.map((o) => o.e).join('|'), h: words.map((o) => o.h).join('|'), I: ids.join('|'), X: ens.join('|'), t: templates, i: rows })

// ---- prove the file says exactly what the source says before writing it (same steps as unpackUniverse on the phone)
{
  const P = JSON.parse(body), E = P.e.split('|'), H = P.h.split('|'), I = P.I.split('|'), X = P.X.split('|')
  let ii = 0, xi = 0
  const nm = (n) => (typeof n[0] === 'number' ? [n.map((k) => E[k]).join(' '), n.map((k) => H[k]).join(' ')] : n)
  const al = (name, s) => !s ? [] : s.split('|').map((a) => { const nt = name.toLowerCase().split(' '); if (a === '^') return [...nt.slice(1), nt[0]].join(' '); if (a[0] === '=') return a.slice(1); const t = nt.slice(); for (const e of a.split(' ')) { const i = e.charCodeAt(0) - 48, p = e.charCodeAt(1) - 48, q = e.charCodeAt(2) - 48; t[i] = nt[i].slice(0, p) + e.slice(3) + (q ? nt[i].slice(nt[i].length - q) : '') } return t.join(' ') })
  const fail = (m) => { throw new Error('universe pack check failed: ' + m) }
  src.items.forEach((it, n) => {
    const r = P.i[n], [h, hi] = nm(r[0]), fl = r[1]
    const id = fl & 256 ? I[ii++] : slug(h), en = fl & 512 ? X[xi++] : h
    if (id !== it.id || h !== it.hinglish || hi !== it.hi || en !== it.en) fail(it.id)
    if (P.c[fl & 31] !== it.category || P.u[(fl >> 5) & 3] !== it.unit || !!(fl & 128) !== !!it.loose || (r[2] ? P.b[r[2] - 1] : null) !== it.brand) fail(it.id + ' meta')
    if (JSON.stringify(al(h, r[3])) !== JSON.stringify(dedupe(it))) fail(it.id + ' aliases')
    const vl = r[4] === 0 ? null : typeof r[4] === 'number' ? P.t[r[4] - 1] : r[4]
    if (!vl !== !it.variants?.length) fail(it.id + ' variants')
    if (!vl) return
    if (vl.length - 1 !== it.variants.length || !it.variants[vl[0]].default) fail(it.id + ' default')
    const inline = typeof r[4] !== 'number'
    it.variants.forEach((v, k) => {
      const e = vl[k + 1], [vh, vhi] = nm(inline ? e[0] : e)
      if (vh !== v.hinglish || vhi !== v.hi) fail(it.id + '/' + v.id)
      if (inline && (JSON.stringify(al(vh, e[1])) !== JSON.stringify(dedupeV(v)) || JSON.stringify(e[2] ?? []) !== JSON.stringify(v.legacy ?? []))) fail(it.id + '/' + v.id + ' extras')
    })
  })
}

const hash = createHash('sha256').update(body).digest('hex').slice(0, 10)
const out = join(here, '../public/universe'); mkdirSync(out, { recursive: true })
for (const f of readdirSync(out)) if (/^u\.[0-9a-f]{10}\.json$/.test(f)) unlinkSync(join(out, f))
writeFileSync(join(out, `u.${hash}.json`), body)
writeFileSync(join(out, 'u.json'), JSON.stringify({ v: src.version, file: `/universe/u.${hash}.json`, items: rows.length, variants: nVariants }))
const gz = gzipSync(body, { level: 9 }).length
console.log(`universe: ${rows.length} items, ${nVariants} variants, ${words.length} words, ${templates.length} shared variant lists, ${(Buffer.byteLength(body) / 1024).toFixed(1)} KB raw, ${(gz / 1024).toFixed(1)} KB gzip, ${(brotliCompressSync(body).length / 1024).toFixed(1)} KB brotli -> u.${hash}.json`)
// phones download this once; keep it under 220 KB gzipped
if (gz > 220 * 1024) console.warn(`WARNING: universe is ${(gz / 1024).toFixed(1)} KB gzipped (> 220 KB budget)`)
