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
  it('has exactly 2500 distinct top-level items; variants are not counted', () => {
    expect(src.items).toHaveLength(2500)
    expect(new Set(src.items.map((i) => i.id)).size).toBe(2500)
    expect(src.items.reduce((n, i) => n + (i.variants?.length ?? 0), 0)).toBeGreaterThan(6000)
  })
  it('no two variants of one item share a name', () => {
    for (const it of src.items) { const k = (it.variants ?? []).map((v) => v.hinglish.toLowerCase()); expect(new Set(k).size, it.id).toBe(k.length) }
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
  it('keeps every flavour: v5 flavours that v6 had dropped are back, defaults unchanged', () => {
    // [item id, variant name] sample of the ~600 restored from universe v5
    const back: [string, string][] = [['sugar', 'Large Grain'], ['toor-dal', 'Mysore'], ['kabuli-chana', 'Desi Kabuli'], ['haldi', 'Lakadong'], ['tea-tata-500g', 'Tetley'], ['paneer', 'Malai Paneer'], ['good-day', 'Fruit & Nut'], ['maggi-70', 'Oats Masala'], ['haldiram-bhujia', 'Moong Dal Bhujia'], ['bisleri-1l', 'Soda'], ['tide', 'Plus Extra Power'], ['harpic', 'Power Plus Lemon'], ['dettol-soap', '3 pack'], ['parachute-100', 'Rs 10 pack'], ['whisper', 'Ultra Soft'], ['good-knight', 'Gold Flash'], ['garlic', 'Paste'], ['kala-chana', 'Dhuli'], ['kasuri-methi', 'Loose'], ['amul-cheese', 'Cheese Slices'], ['glucon-d', 'Rs 10 pack'], ['dabur-red', 'Red Toothpaste 200g'], ['stayfree', 'Secure Regular'], ['coil', 'Maxo'], ['kishmish', 'Yellow'], ['achar-mix', 'Gobhi Gajar Shalgam'], ['oreo', 'Peanut Butter'], ['oreo', 'Mango']]
    expect(back.length).toBeGreaterThanOrEqual(20)
    for (const [id, name] of back) expect((src.items.find((i) => i.id === id)?.variants ?? []).map((v) => norm(v.hinglish)), `${id}/${name}`).toContain(norm(name))
    // restoring never changes which variant is the default
    expect(src.items.find((i) => i.id === 'maggi-70')!.variants!.find((v) => v.default)!.hinglish).toBe('Masala 70g')
    expect(src.items.find((i) => i.id === 'sugar')!.variants!.find((v) => v.default)!.hinglish).toBe('Medium Grain')
    // old pack-size items are still merged into variants (legacy ids kept)
    const ids = new Set(src.items.map((i) => i.id))
    for (const merged of ['maggi-280', 'fortune-soy-5l', 'parle-g-pack-rs5', 'surf-pack-2kg', 'tata-salt-500g', 'amul-ghee-200ml']) expect(ids.has(merged), merged).toBe(false)
    const legacy = src.items.flatMap((i) => (i.variants ?? []).flatMap((x) => x.legacy ?? []))
    expect(legacy).toEqual(expect.arrayContaining(['maggi-280', 'fortune-soy-5l', 'tata-salt-500g']))
  })
  it('the 1000 new v8 items are real products with full variants', () => {
    const fresh = src.items.slice(1500)
    expect(fresh).toHaveLength(1000)
    expect(fresh.filter((i) => i.variants).length).toBeGreaterThan(550)
    for (const [id, name] of [['aashirvaad-select-atta', '10kg'], ['sprite-lemon', '2.25L'], ['tata-tea-agni', '1kg'], ['pedigree-chicken-vegetables', '10kg'], ['cycle-pure-agarbatti', 'Rs 50']]) expect(src.items.find((i) => i.id === id)!.variants!.map((v) => v.hinglish), id).toContain(name)
    // v7 items are all still there, first, in the same order (nothing deleted)
    expect(src.items.slice(0, 3).map((i) => i.id)).toEqual(['sugar', 'salt-tata-1kg', 'atta-aashirvaad-5kg'])
    for (const id of ['maida', 'jeera', 'parle-g', 'colgate-100', 'horlicks', 'maggi-70']) expect(src.items.findIndex((i) => i.id === id), id).toBeGreaterThanOrEqual(0)
    expect(src.items.findIndex((i) => i.id === 'maida')).toBeLessThan(1500)
    expect(src.items.slice(1000, 1500).filter((i) => i.variants).length).toBeGreaterThan(400)
  })
  it('keeps the shopkeeper-spelling index unambiguous: new spellings never reuse another item\'s name or alias', () => {
    // keys that already pointed at several items in v7 (generic words like "chai", "chawal" on purpose); v8 may not add to them
    const owners = new Map<string, Set<string>>(), names = new Map<string, Set<string>>()
    for (const it of src.items) {
      for (const a of [it.hinglish, it.en, it.id.replace(/-/g, ' ')]) { const k = norm(a); (names.get(k) ?? names.set(k, new Set()).get(k)!).add(it.id) }
      for (const a of [it.hinglish, it.hi, it.en, it.id.replace(/-/g, ' '), ...it.aliases]) { const k = norm(a); (owners.get(k) ?? owners.set(k, new Set()).get(k)!).add(it.id) }
    }
    expect([...owners.values()].filter((v) => v.size > 1).length).toBeLessThanOrEqual(170)
    let aliasOnName = 0
    for (const it of src.items) for (const a of it.aliases) { const o = names.get(norm(a)); if (o && [...o].some((x) => x !== it.id)) aliasOnName++ }
    expect(aliasOnName).toBeLessThanOrEqual(94)
    // every item added in v8 is fully clean: no alias of a new item equals another item's name, and none of its names equals an older alias
    for (const it of src.items.slice(1500)) for (const a of it.aliases) { const o = names.get(norm(a)); expect(o && [...o].some((x) => x !== it.id), `${it.id}: ${a}`).toBeFalsy() }
  })
  it('every item has spoken / mis-heard spellings, with no repeats inside one item', () => {
    let total = 0
    for (const it of src.items) {
      total += it.aliases.length
      const keys = it.aliases.map(norm)
      expect(keys.every(Boolean), it.id).toBe(true)
      if (src.items.indexOf(it) >= 1500) expect(new Set(keys).size, it.id).toBe(keys.length)
    }
    expect(total).toBeGreaterThan(10000)
    expect(src.items.filter((i) => i.aliases.length >= 2).length).toBeGreaterThan(2450)
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
  it('new v7 items resolve by voice: brand + flavour + size', () => {
    expect(findInUniverse('daawat rozana 10 kilo')[0].variant?.hinglish).toBe('10kg')
    expect(findInUniverse('epigamia yogurt blueberry')[0].id).toBe('dairy-epigamia-greek')
  })
  it('mis-heard / mispronounced names still find the item (shopkeeper and speech-to-text spellings)', () => {
    const first = (w: string) => findInUniverse(w).map((x) => x.id)
    const cases: [string, string][] = [
      ['meda', 'maida'], ['mayda', 'maida'], ['besun', 'besan'], ['beson', 'besan'], ['zeera', 'jeera'], ['jira', 'jeera'], ['haldee', 'haldi'],
      ['sarf excel', 'surf-excel-1kg'], ['colget', 'colgate-100'], ['kolgate', 'colgate-100'], ['lifeboy', 'lifebuoy'], ['detol', 'dettol-soap'],
      ['horlix', 'horlicks'], ['bornvita', 'bournvita'], ['parle ji', 'parle-g'], ['parley', 'parle-g'], ['sooji', 'suji'], ['rawa', 'suji'],
      ['ashirwad select atta', 'aashirvaad-select-atta'], ['spright lemon', 'sprite-lemon'], ['pedigri chicken vegetables', 'pedigree-chicken-vegetables'],
    ]
    expect(cases.length).toBeGreaterThanOrEqual(15)
    for (const [said, id] of cases) expect(first(said), said).toContain(id)
    // a mis-heard name plus a size still lands on the right variant
    expect(findInUniverse('ashirwad select atta')[0].variant?.hinglish).toBe('1kg')
  })
  it('the voice matcher also resolves the spoken forms to the right entry', () => {
    const idx = buildIndex(universeMatchables())
    for (const [said, id] of [['meda', 'u:maida'], ['zeera', 'u:jeera'], ['colget', 'u:colgate-100'], ['horlix', 'u:horlicks'], ['bornvita', 'u:bournvita'], ['parle ji', 'u:parle-g'], ['sarf excel', 'u:surf-excel-1kg']]) expect(matchName(said, idx)[0].id, said).toBe(id)
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
