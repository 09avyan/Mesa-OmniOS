import { beforeAll, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { findInUniverse, loadUniverse, norm, slug, universeMatchables } from '../universe'
import { buildIndex, isSure, matchName } from '../../voice/match'

const pub = join(__dirname, '../../../public')
type SItem = { id: string; hinglish: string; hi: string; en: string; category: string; aliases: string[]; variants?: { id: string; hinglish: string; hi: string; en: string; default?: boolean; legacy?: string[] }[] }
const src = JSON.parse(readFileSync(join(__dirname, '../../../../supabase/seed/universe.json'), 'utf8')) as { items: SItem[] }

beforeAll(async () => {
  // serve the built files from disk instead of the network
  globalThis.fetch = (async (u: string) => ({ json: async () => JSON.parse(readFileSync(join(pub, u), 'utf8')) })) as unknown as typeof fetch
  await loadUniverse()
})

describe('universe data', () => {
  it('has exactly 1000 distinct top-level items; variants are not counted', () => {
    expect(src.items).toHaveLength(1000)
    expect(new Set(src.items.map((i) => i.id)).size).toBe(1000)
    expect(src.items.reduce((n, i) => n + (i.variants?.length ?? 0), 0)).toBeGreaterThan(3000)
  })
  it('every item with variants has exactly one default, unique variant ids = slug(hinglish)', () => {
    for (const it of src.items.filter((i) => i.variants)) {
      expect(it.variants!.filter((v) => v.default), it.id).toHaveLength(1)
      expect(new Set(it.variants!.map((v) => v.id)).size, it.id).toBe(it.variants!.length)
      for (const v of it.variants!) { expect(v.id, it.id).toBe(slug(v.hinglish)); expect(v.en, it.id).toBe(v.hinglish) }
    }
  })
  it('no two items share a name (no duplicates) and every Hindi name is real Devanagari', () => {
    const seen = new Map<string, string>()
    for (const it of src.items) {
      for (const n of [it.hinglish, it.en]) { const k = norm(n); expect(seen.get(k) ?? it.id, `${n} (${it.id}) clashes with ${seen.get(k)}`).toBe(it.id); seen.set(k, it.id) }
      expect(it.hi, it.id).toMatch(/[\u0900-\u097F]/); expect(it.hi, it.id).not.toMatch(/[A-Za-z]/)
      for (const v of it.variants ?? []) { expect(v.hi.replace(/\b[A-Z]\d{1,3}\b|W\d+|XL\+?|XXL|NB|A4|N95|3D|B22|E27|\d+W|\d+V/g, ''), `${it.id}/${v.id}`).not.toMatch(/[A-Za-z]/) }
    }
  })
  it('keeps what sizes the owner asked for as real variants, and the common one is the default', () => {
    const v = (id: string) => src.items.find((i) => i.id === id)!.variants!
    const names = (id: string) => v(id).map((x) => x.hinglish)
    expect(names('maggi-70')).toEqual(expect.arrayContaining(['Masala 70g', 'Masala 280g']))
    expect(v('maggi-70').find((x) => x.default)!.hinglish).toBe('Masala 70g')
    expect(names('coca-cola')).toEqual(expect.arrayContaining(['250ml', '750ml', '1.25L', '2.25L']))
    expect(names('salt-tata-1kg')).toContain('1kg')
    expect(names('atta-aashirvaad-5kg')).toEqual(expect.arrayContaining(['1kg', '5kg', '10kg']))
    expect(v('atta-aashirvaad-5kg').find((x) => x.default)!.hinglish).toBe('5kg')
  })
  it('flavours not sold in India are gone; old pack-size items are merged into variants', () => {
    const all = src.items.flatMap((i) => (i.variants ?? []).map((x) => `${i.id}/${x.hinglish}`)).join('|').toLowerCase()
    for (const bad of ['tetley', 'oreo/peanut butter', 'oreo-mango', 'cheetos/cheese puffs-']) expect(all).not.toContain(bad)
    const ids = new Set(src.items.map((i) => i.id))
    for (const merged of ['maggi-280', 'fortune-soy-5l', 'parle-g-pack-rs5', 'surf-pack-2kg', 'tata-salt-500g', 'amul-ghee-200ml']) expect(ids.has(merged), merged).toBe(false)
    const legacy = src.items.flatMap((i) => (i.variants ?? []).flatMap((x) => x.legacy ?? []))
    expect(legacy).toEqual(expect.arrayContaining(['maggi-280', 'fortune-soy-5l', 'tata-salt-500g']))
  })
})

describe('universe variants', () => {
  it('saying only the item name gives the default variant', () => {
    const [m] = findInUniverse('maggi')
    expect(m.variant?.hinglish).toBe('Masala 70g')
    expect(m.variants.length).toBeGreaterThan(8)
  })
  it('"<item> <flavour>", "<item> <size>" and "<flavour> <item>" find that variant', () => {
    expect(findInUniverse('maggi atta masala')[0].variant?.hinglish).toBe('Atta Masala 75g')
    expect(findInUniverse('maggi chicken')[0].variant?.hinglish).toBe('Chicken 70g')
    expect(findInUniverse('chicken maggi')[0].variant?.hinglish).toBe('Chicken 70g')
    expect(findInUniverse('maggi 280g')[0].variant?.hinglish).toBe('Masala 280g')
    expect(findInUniverse('maggi 280 gram')[0].variant?.hinglish).toBe('Masala 280g')
    expect(findInUniverse('coca cola 250ml')[0].variant?.hinglish).toBe('250ml')
    expect(findInUniverse('coke 2.25 litre')[0].variant?.hinglish).toBe('2.25L')
    expect(findInUniverse('tata namak 500 gram')[0].variant?.hinglish).toBe('500g')
    expect(findInUniverse('aashirvaad atta 10 kilo')[0].variant?.hinglish).toBe('10kg')
    expect(findInUniverse('parle g 10 rupaye')[0].variant?.hinglish).toBe('Rs 10')
  })
  it('items without variants have none', () => {
    const [s] = findInUniverse('sattu')
    expect(s.variants).toEqual([]); expect(s.variant).toBeNull()
  })
  it('voice matcher: parent name -> default entry, other variants are family members with full names', () => {
    const idx = buildIndex(universeMatchables())
    const m = matchName('maggi', idx)[0]
    expect(m.id).toBe('u:maggi-70'); expect(m.item.family).toBe('u:maggi-70'); expect(m.item.hinglish).toBe('Maggi Masala 70g')
    const chicken = matchName('maggi chicken', idx)[0]
    expect(chicken.id).toBe('u:maggi-70:chicken-70g'); expect(chicken.item.family).toBe('u:maggi-70')
    expect(chicken.item.hinglish).toBe('Maggi Chicken 70g'); expect(chicken.item.variant).toBe('Chicken 70g')
    const big = matchName('maggi 280g', idx)[0]
    expect(big.id).toBe('u:maggi-70:masala-280g'); expect(big.item.aka).toEqual(['u:maggi-280'])
    expect(matchName('maggi masala', idx)[0].id).toBe('u:maggi-70')
    expect(matchName('coca cola zero sugar', idx)[0].item.family).toBe('u:coca-cola')
  })
  it('variants of one product never trigger the blocking "Yahi wali?"; different products sharing a word still do', () => {
    const idx = buildIndex(universeMatchables())
    for (const said of ['maggi', 'coca cola', 'thums up', 'aashirvaad atta', 'tata namak']) expect(isSure(said, matchName(said, idx), idx), said).toBe(true)
    const mk = (id: string, hinglish: string, family?: string) => ({ id, hinglish, hi: hinglish, en: hinglish, brand: null, unit: 'pc', loose: false, aliases: [hinglish.toLowerCase()], family })
    const same = buildIndex([mk('a', 'Zed', 'a'), mk('a:1', 'Zed Chicken', 'a'), mk('a:2', 'Zed Atta', 'a')])
    expect(isSure('zed', matchName('zed', same), same)).toBe(true)
    const diff = buildIndex([mk('a', 'Zed'), mk('b', 'Zed Ketchup'), mk('c', 'Zed Soup')])
    expect(isSure('zed', matchName('zed', diff), diff)).toBe(false)
  })
})
