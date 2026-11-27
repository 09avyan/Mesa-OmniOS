import { beforeAll, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'
import { findInUniverse, loadUniverse, norm, slug, universeItem, universeMatchables, unpackUniverse, unpackUniverseAsync, type PackedFile } from '../universe'
import { buildIndex, isSure, matchName } from '../../voice/match'
import { phonKey } from '../../voice/normalize'

const pub = join(__dirname, '../../../public')
type SItem = { id: string; hinglish: string; hi: string; en: string; category: string; unit: string; brand: string | null; loose?: boolean; aliases: string[]; variants?: { id: string; hinglish: string; hi: string; en: string; aliases?: string[]; default?: boolean; legacy?: string[] }[] }
const src = JSON.parse(readFileSync(join(__dirname, '../../../../supabase/seed/universe.json'), 'utf8')) as { items: SItem[] }

beforeAll(async () => {
  // serve the built files from disk instead of the network
  globalThis.fetch = (async (u: string) => ({ json: async () => JSON.parse(readFileSync(join(pub, u), 'utf8')) })) as unknown as typeof fetch
  await loadUniverse()
})

describe('universe data', () => {
  it('has exactly 5750 distinct top-level items; variants are not counted', () => {
    expect(src.items).toHaveLength(5750)
    expect(new Set(src.items.map((i) => i.id)).size).toBe(5750)
    expect(src.items.reduce((n, i) => n + (i.variants?.length ?? 0), 0)).toBeGreaterThan(11000)
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
    const fresh = src.items.slice(1500, 2500)
    expect(fresh).toHaveLength(1000)
    expect(fresh.filter((i) => i.variants).length).toBeGreaterThan(550)
    for (const [id, name] of [['aashirvaad-select-atta', '10kg'], ['sprite-lemon', '2.25L'], ['tata-tea-agni', '1kg'], ['pedigree-chicken-vegetables', '10kg'], ['cycle-pure-agarbatti', 'Rs 50']]) expect(src.items.find((i) => i.id === id)!.variants!.map((v) => v.hinglish), id).toContain(name)
    // v7 items are all still there, first, in the same order (nothing deleted)
    expect(src.items.slice(0, 3).map((i) => i.id)).toEqual(['sugar', 'salt-tata-1kg', 'atta-aashirvaad-5kg'])
    for (const id of ['maida', 'jeera', 'parle-g', 'colgate-100', 'horlicks', 'maggi-70']) expect(src.items.findIndex((i) => i.id === id), id).toBeGreaterThanOrEqual(0)
    expect(src.items.findIndex((i) => i.id === 'maida')).toBeLessThan(1500)
    expect(src.items.slice(1000, 1500).filter((i) => i.variants).length).toBeGreaterThan(400)
  })
  it('the 500 new v9 items (2501-3000) are clean: real products, one default, Devanagari, 2-6 mis-heard spellings, no duplicates', () => {
    const fresh = src.items.slice(2500, 3000)
    expect(fresh).toHaveLength(500)
    expect(fresh.filter((i) => i.variants).length).toBeGreaterThan(400)
    expect(new Set(fresh.map((i) => i.category)).size).toBeGreaterThanOrEqual(25)
    const older = new Set(src.items.slice(0, 2500).flatMap((i) => [i.hinglish, i.en, i.id.replace(/-/g, ' ')].map(norm)))
    const olderAlias = new Set(src.items.slice(0, 2500).flatMap((i) => i.aliases.map(norm)))
    for (const it of fresh) {
      expect(it.hi, it.id).toMatch(/[\u0900-\u097F]/); expect(it.hi, it.id).not.toMatch(/[A-Za-z]/)
      expect(it.aliases.length, it.id).toBeGreaterThanOrEqual(2); expect(it.aliases.length, it.id).toBeLessThanOrEqual(6)
      expect(older.has(norm(it.hinglish)) || older.has(norm(it.en)), `${it.id} duplicates an older item`).toBe(false)
      for (const a of it.aliases) { expect(olderAlias.has(norm(a)) || older.has(norm(a)), `${it.id}: ${a} reuses an older name/alias`).toBe(false) }
      for (const v of it.variants ?? []) { expect(v.hi, `${it.id}/${v.id}`).not.toMatch(/[A-Za-z]/); expect(v.hinglish.length).toBeGreaterThan(0) }
      if (it.variants) expect(it.variants.filter((v) => v.default), it.id).toHaveLength(1)
    }
    // real flavours/sizes
    const names = (id: string) => (src.items.find((i) => i.id === id)?.variants ?? []).map((v) => v.hinglish)
    expect(names('aashirvaad-multigrain-atta')).toEqual(expect.arrayContaining(['1kg', '5kg', '10kg']))
    expect(names('amul-gold-full-cream-milk')).toEqual(expect.arrayContaining(['500ml', '1L']))
    expect(names('everest-chaat-masala')).toEqual(expect.arrayContaining(['50g', '100g']))
  })
  it('the 1500 new v10 items (3001-4500) are clean: real products, one default, Devanagari, 2-6 mis-heard spellings, no duplicates, no clashes', () => {
    const fresh = src.items.slice(3000, 4500)
    expect(fresh).toHaveLength(1500)
    expect(new Set(fresh.map((i) => i.id)).size).toBe(1500)
    expect(fresh.filter((i) => i.variants).length).toBeGreaterThan(1000)
    expect(fresh.filter((i) => i.loose).length).toBeGreaterThan(300)
    expect(new Set(fresh.map((i) => i.category)).size).toBeGreaterThanOrEqual(25)
    const old = src.items.slice(0, 3000)
    const oldNames = new Set(old.flatMap((i) => [i.hinglish, i.en, i.id.replace(/-/g, ' ')].map(norm)))
    const oldAlias = new Set(old.flatMap((i) => i.aliases.map(norm)))
    const oldVariant = new Set(old.flatMap((i) => (i.variants ?? []).map((v) => norm(v.hinglish))))
    // names (and sound keys of names) of every item, to catch an alias that is really another item's name
    const nameOwner = new Map<string, Set<string>>(), phonOwner = new Map<string, Set<string>>()
    for (const it of src.items) for (const n of [it.hinglish, it.en]) { for (const [m, k] of [[nameOwner, norm(n)], [phonOwner, phonKey(n)]] as const) { if (!k) continue; (m.get(k) ?? m.set(k, new Set()).get(k)!).add(it.id) } }
    const seenName = new Map<string, string>()
    for (const it of fresh) {
      expect(it.hi, it.id).toMatch(/[\u0900-\u097F]/); expect(it.hi, it.id).not.toMatch(/[A-Za-z]/)
      expect(it.aliases.length, it.id).toBeGreaterThanOrEqual(2); expect(it.aliases.length, it.id).toBeLessThanOrEqual(6)
      const nk = norm(it.hinglish)
      expect(oldNames.has(nk) || oldNames.has(norm(it.en)), `${it.id} duplicates an older item`).toBe(false)
      expect(oldVariant.has(nk) || oldAlias.has(nk), `${it.id} clashes with an older variant name or alias`).toBe(false)
      expect(seenName.get(nk) ?? it.id, `${it.id} duplicates ${seenName.get(nk)}`).toBe(it.id); seenName.set(nk, it.id)
      const keys = it.aliases.map(norm)
      expect(new Set(keys).size, it.id).toBe(keys.length)
      for (const a of it.aliases) {
        const k = norm(a)
        expect(oldAlias.has(k) || oldNames.has(k), `${it.id}: ${a} reuses an older name/alias`).toBe(false)
        const o = nameOwner.get(k); expect(o && [...o].some((x) => x !== it.id), `${it.id}: ${a} is another item's name`).toBeFalsy()
        const p = phonOwner.get(phonKey(a)); expect(p && [...p].some((x) => x !== it.id), `${it.id}: ${a} sounds like another item's name`).toBeFalsy()
      }
      for (const v of it.variants ?? []) { expect(v.hi.replace(/\b[A-Z]\d{1,3}\b|W\d+|XL\+?|XXL|NB|A4|N95|3D|B22|E27|\d+W|\d+V/g, ''), `${it.id}/${v.id}`).not.toMatch(/[A-Za-z]/); expect(v.hinglish.length).toBeGreaterThan(0) }
      if (it.variants) expect(it.variants.filter((v) => v.default), it.id).toHaveLength(1)
    }
    const names = (id: string) => (src.items.find((i) => i.id === id)?.variants ?? []).map((v) => v.hinglish)
    expect(names('bikaji-lasoon-sev')).toEqual(expect.arrayContaining(['100g', '200g', '400g']))
    expect(names('pampers-premium-care-pants-m')).toEqual(expect.arrayContaining(['20 pcs', '42 pcs', '70 pcs']))
    expect(src.items.find((i) => i.id === 'bikaji-lasoon-sev')!.variants!.find((v) => v.default)!.hinglish).toBe('100g')
  })
  it('v10: 20 mis-heard / mispronounced names of the 1500 new items find the right product', () => {
    const idx = buildIndex(universeMatchables())
    const cases: [string, string][] = [
      ['bikanji lasoon sev', 'bikaji-lasoon-sev'], ['kelloggs chokos moons and stars', 'kelloggs-chocos-moons-and-stars'], ['girner instant chai premix ginger', 'girnar-instant-chai-premix-ginger'],
      ['bross aarti', 'brass-aarti'], ['vicko vajradanti powder', 'vicco-vajradanti-powder'], ['mtr instant vada mex', 'mtr-instant-vada-mix'],
      ['prestige mup spin', 'prestige-mop-spin'], ['sheba fish pooch', 'sheba-fish-pouch'], ['pampers premiyam care pants m', 'pampers-premium-care-pants-m'],
      ['godrage yummiez chicken popcorn', 'godrej-yummiez-chicken-popcorn'], ['bingu mad angles achaari masti', 'bingo-mad-angles-achaari-masti'], ['lakmay kajal smudge proof', 'lakme-kajal-smudge-proof'],
      ['mangaldeep agarbathi sandal', 'mangaldeep-agarbatti-sandal'], ['camlin kolour pencils 12 shades', 'camlin-colour-pencils-12-shades'], ['kurkuray solid masti mast masala', 'kurkure-solid-masti-mast-masala'],
      ['aem langra banarasi', 'aam-langra-banarasi'], ['gode masala maharashtrian', 'goda-masala-maharashtrian'], ['bengali pench phoron', 'bengali-panch-phoron'],
      ['haukins classic pressure cooker 3l', 'hawkins-classic-pressure-cooker-3l'], ['harpic power plas original', 'harpic-power-plus-original'],
    ]
    expect(cases.length).toBe(20)
    for (const [said, id] of cases) {
      expect(findInUniverse(said).map((x) => x.id), said).toContain(id)
      expect(matchName(said, idx)[0].id, said).toBe('u:' + id)
    }
  })
  it('the 500 new v11 items (4501-5000) are clean: real products, one default, Devanagari, 2-6 mis-heard spellings, no duplicates, no clashes', () => {
    const fresh = src.items.slice(4500, 5000)
    expect(fresh).toHaveLength(500)
    expect(new Set(fresh.map((i) => i.id)).size).toBe(500)
    expect(fresh.filter((i) => i.variants).length).toBeGreaterThan(400)
    expect(fresh.filter((i) => i.loose).length).toBeGreaterThan(50)
    expect(new Set(fresh.map((i) => i.category)).size).toBeGreaterThanOrEqual(20)
    const old = src.items.slice(0, 4500)
    const oldNames = new Set(old.flatMap((i) => [i.hinglish, i.en, i.id.replace(/-/g, ' ')].map(norm)))
    const oldAlias = new Set(old.flatMap((i) => i.aliases.map(norm)))
    const oldVariant = new Set(old.flatMap((i) => (i.variants ?? []).map((v) => norm(v.hinglish))))
    const nameOwner = new Map<string, Set<string>>(), phonOwner = new Map<string, Set<string>>()
    for (const it of src.items) for (const n of [it.hinglish, it.en]) { for (const [m, k] of [[nameOwner, norm(n)], [phonOwner, phonKey(n)]] as const) { if (!k) continue; (m.get(k) ?? m.set(k, new Set()).get(k)!).add(it.id) } }
    const seenName = new Map<string, string>()
    for (const it of fresh) {
      expect(it.hi, it.id).toMatch(/[ऀ-ॿ]/); expect(it.hi, it.id).not.toMatch(/[A-Za-z]/)
      expect(it.aliases.length, it.id).toBeGreaterThanOrEqual(2); expect(it.aliases.length, it.id).toBeLessThanOrEqual(6)
      const nk = norm(it.hinglish)
      expect(oldNames.has(nk) || oldNames.has(norm(it.en)), `${it.id} duplicates an older item`).toBe(false)
      expect(oldVariant.has(nk) || oldAlias.has(nk), `${it.id} clashes with an older variant name or alias`).toBe(false)
      expect(seenName.get(nk) ?? it.id, `${it.id} duplicates ${seenName.get(nk)}`).toBe(it.id); seenName.set(nk, it.id)
      const keys = it.aliases.map(norm)
      expect(new Set(keys).size, it.id).toBe(keys.length)
      for (const a of it.aliases) {
        const k = norm(a)
        expect(oldAlias.has(k) || oldNames.has(k), `${it.id}: ${a} reuses an older name/alias`).toBe(false)
        const o = nameOwner.get(k); expect(o && [...o].some((x) => x !== it.id), `${it.id}: ${a} is another item's name`).toBeFalsy()
        const p = phonOwner.get(phonKey(a)); expect(p && [...p].some((x) => x !== it.id), `${it.id}: ${a} sounds like another item's name`).toBeFalsy()
      }
      const vk = (it.variants ?? []).map((v) => norm(v.hinglish)); expect(new Set(vk).size, it.id).toBe(vk.length)
      for (const v of it.variants ?? []) { expect(v.hi.replace(/\b[A-Z]\d{1,3}\b|W\d+|XL\+?|XXL|NB|A4|N95|3D|B22|E27|\d+W|\d+V/g, ''), `${it.id}/${v.id}`).not.toMatch(/[A-Za-z]/); expect(v.hinglish.length).toBeGreaterThan(0) }
      if (it.variants) expect(it.variants.filter((v) => v.default), it.id).toHaveLength(1)
    }
    const names = (id: string) => (src.items.find((i) => i.id === id)?.variants ?? []).map((v) => v.hinglish)
    expect(names('glucon-d-regular')).toEqual(expect.arrayContaining(['200g', '500g']))
    expect(names('pampers-premium-care-pants-l')).toEqual(expect.arrayContaining(['20 pcs', '42 pcs', '70 pcs']))
    expect(src.items.find((i) => i.id === 'glucon-d-regular')!.variants!.find((v) => v.default)!.hinglish).toBe('200g')
  })
  it('v11: 20 mis-heard / mispronounced names of the 500 new items find the right product', () => {
    const idx = buildIndex(universeMatchables())
    const cases: [string, string][] = [
      ['green pepperkorn', 'green-peppercorn'], ['jamun blak', 'jamun-black'], ['whole wheat brown atta', 'atta-whole-wheat-brown'], ['jagdesh farsan khandvi fresh', 'jagdish-farsan-khandvi-fresh'],
      ['ruchy flax seed podi', 'ruchi-flax-seed-podi'], ['samyeng carbonara hot chicken', 'samyang-carbonara-hot-chicken'], ['girner green tea honey lemon', 'girnar-green-tea-honey-lemon'], ['boost cronch', 'boost-crunch'],
      ['pintola pinut butter all natural crunchy', 'pintola-peanut-butter-all-natural-crunchy'], ['brown end polson cornflour', 'brown-and-polson-cornflour'], ['tublerune honey almond nougat', 'toblerone-honey-almond-nougat'],
      ['amul frozan samosa', 'amul-frozen-samosa'], ['glukon d regular', 'glucon-d-regular'], ['santoor sandel and almond milk soap', 'santoor-sandal-and-almond-milk-soap'], ['ural-b toothbrush ultra thin', 'oral-b-toothbrush-ultra-thin'],
      ['domix toilet cleaner lemon', 'domex-toilet-cleaner-lemon'], ['drool puppy chicken and egg', 'drools-puppy-chicken-and-egg'], ['selo technotip pen', 'cello-technotip-pen'], ['ayodex ointment', 'iodex-ointment'], ['steel jog', 'steel-jug'],
    ]
    expect(cases.length).toBe(20)
    for (const [said, id] of cases) {
      expect(findInUniverse(said).map((x) => x.id), said).toContain(id)
      expect(matchName(said, idx)[0].id, said).toBe('u:' + id)
    }
  })
  it('the 750 new v12+v13 items (5001-5750) are clean: real products, one default, Devanagari, 2-4 mis-heard spellings, no duplicates, no clashes', () => {
    const fresh = src.items.slice(5000)
    expect(fresh).toHaveLength(750)
    expect(new Set(fresh.map((i) => i.id)).size).toBe(750)
    expect(fresh.filter((i) => i.variants).length).toBeGreaterThan(450)
    expect(fresh.filter((i) => i.loose).length).toBeGreaterThan(50)
    expect(new Set(fresh.map((i) => i.category)).size).toBeGreaterThanOrEqual(12)
    const old = src.items.slice(0, 5000)
    const oldNames = new Set(old.flatMap((i) => [i.hinglish, i.en, i.id.replace(/-/g, ' ')].map(norm)))
    const oldAlias = new Set(old.flatMap((i) => i.aliases.map(norm)))
    const oldVariant = new Set(old.flatMap((i) => (i.variants ?? []).map((v) => norm(v.hinglish))))
    const nameOwner = new Map<string, Set<string>>(), phonOwner = new Map<string, Set<string>>()
    for (const it of src.items) for (const n of [it.hinglish, it.en]) { for (const [m, k] of [[nameOwner, norm(n)], [phonOwner, phonKey(n)]] as const) { if (!k) continue; (m.get(k) ?? m.set(k, new Set()).get(k)!).add(it.id) } }
    const seenName = new Map<string, string>()
    for (const it of fresh) {
      expect(it.hi, it.id).toMatch(/[ऀ-ॿ]/); expect(it.hi, it.id).not.toMatch(/[A-Za-z]/)
      expect(it.aliases.length, it.id).toBeGreaterThanOrEqual(2); expect(it.aliases.length, it.id).toBeLessThanOrEqual(4)
      const nk = norm(it.hinglish)
      expect(oldNames.has(nk) || oldNames.has(norm(it.en)), `${it.id} duplicates an older item`).toBe(false)
      expect(oldVariant.has(nk) || oldAlias.has(nk), `${it.id} clashes with an older variant name or alias`).toBe(false)
      expect(seenName.get(nk) ?? it.id, `${it.id} duplicates ${seenName.get(nk)}`).toBe(it.id); seenName.set(nk, it.id)
      const keys = it.aliases.map(norm)
      expect(new Set(keys).size, it.id).toBe(keys.length)
      for (const a of it.aliases) {
        const k = norm(a)
        expect(oldAlias.has(k) || oldNames.has(k), `${it.id}: ${a} reuses an older name/alias`).toBe(false)
        const o = nameOwner.get(k); expect(o && [...o].some((x) => x !== it.id), `${it.id}: ${a} is another item's name`).toBeFalsy()
        const p = phonOwner.get(phonKey(a)); expect(p && [...p].some((x) => x !== it.id), `${it.id}: ${a} sounds like another item's name`).toBeFalsy()
      }
      const vk = (it.variants ?? []).map((v) => norm(v.hinglish)); expect(new Set(vk).size, it.id).toBe(vk.length)
      for (const v of it.variants ?? []) { expect(v.hi.replace(/\b[A-Z]\d{1,3}\b|W\d+|XL\+?|XXL|NB|A4|N95|3D|B22|E27|\d+W|\d+V/g, ''), `${it.id}/${v.id}`).not.toMatch(/[A-Za-z]/); expect(v.hinglish.length).toBeGreaterThan(0) }
      if (it.variants) expect(it.variants.filter((v) => v.default), it.id).toHaveLength(1)
    }
    const names = (id: string) => (src.items.find((i) => i.id === id)?.variants ?? []).map((v) => v.hinglish)
    expect(names('crocin-advance-tablet')).toEqual(expect.arrayContaining(['15 tabs', '30 tabs']))
    expect(names('diya-clay-plain-pack')).toEqual(expect.arrayContaining(['12 pcs', '25 pcs', '50 pcs']))
    expect(src.items.find((i) => i.id === 'diya-clay-plain-pack')!.variants!.find((v) => v.default)!.hinglish).toBe('12 pcs')
  })
  it('v12: mis-heard names of the 500 new items find the right product', () => {
    const idx = buildIndex(universeMatchables())
    const cases: [string, string][] = [['tamil tenkuzhal murukku', 'tamil-thenkuzhal-murukku'], ['punjab methri', 'punjab-mathri'], ['heemachal siddu mix', 'himachal-siddu-mix'], ['tirunelveli helwa', 'tirunelveli-halwa'], ['maharashtreean lonche mix', 'maharashtrian-lonche-mix'], ['peenk peppercorn', 'pink-peppercorn'], ['saffron spaneesh', 'saffron-spanish'], ['kuttu etta buckwheat', 'kuttu-atta-buckwheat'], ['urad dal bleck whole sabut', 'urad-dal-black-whole-sabut'], ['filips led tube light 20w', 'philips-led-tube-light-20w'], ['hewkins contura pressure cooker 5l', 'hawkins-contura-pressure-cooker-5l'], ['stil sev maker sancha', 'steel-sev-maker-sancha'], ['toy car pooll back', 'toy-car-pull-back'], ['ganesh chaturthi decoretion set', 'ganesh-chaturthi-decoration-set'], ['christmes tree artificial 3ft', 'christmas-tree-artificial-3ft'], ['volini gel paeen relief', 'volini-gel-pain-relief'], ['cac 1000 plus calcium affervescent', 'cac-1000-plus-calcium-effervescent'], ['shrichand elaichi cup', 'shrikhand-elaichi-cup'], ['meelk a2 gir cow bottle', 'milk-a2-gir-cow-bottle'], ['doms scale 30cm stil', 'doms-scale-30cm-steel'], ['book covar brown paper roll', 'book-cover-brown-paper-roll'], ['calculator besic 8 digit pocket', 'calculator-basic-8-digit-pocket'], ['bakery focaccia harb', 'bakery-focaccia-herb'], ['bakery cake base sponga', 'bakery-cake-base-sponge'], ['pocaree sweat drink', 'pocari-sweat-drink'], ['mothar dairy ice cream matka kulfi', 'mother-dairy-ice-cream-matka-kulfi']]
    expect(cases.length).toBeGreaterThanOrEqual(20)
    for (const [said, id] of cases) {
      expect(findInUniverse(said).map((x) => x.id), said).toContain(id)
      expect(matchName(said, idx)[0].id, said).toBe('u:' + id)
    }
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
  it('v9: mis-heard spellings of the 500 new items find the right product', () => {
    const idx = buildIndex(universeMatchables())
    const cases: [string, string][] = [
      ['britanya treat jim jam', 'britannia-treat-jim-jam'], ['sunfest yippee pasta treat', 'sunfeast-yippee-pasta-treat'], ['kolgate strong teeth', 'colgate-strong-teeth'],
      ['colget total advanced', 'colgate-total-advanced'], ['cothas filter kofi powder', 'cothas-filter-coffee-powder'], ['pampars active baby pants m', 'pampers-active-baby-pants-m'],
      ['wow momos veg', 'wow-momo-veg'], ['neskafe classic coffee', 'nescafe-classic-coffee'], ['pringals sour cream and onion', 'pringles-sour-cream-and-onion'],
    ]
    for (const [said, id] of cases) {
      expect(findInUniverse(said).map((x) => x.id), said).toContain(id)
      expect(matchName(said, idx)[0].id, said).toBe('u:' + id)
    }
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

describe('packed universe file', () => {
  const pointer = JSON.parse(readFileSync(join(pub, 'universe/u.json'), 'utf8')) as { v: number; file: string; items: number; variants: number }
  const raw = readFileSync(join(pub, pointer.file), 'utf8')
  const file = JSON.parse(raw) as PackedFile
  // the file leaves out aliases that read the same as the item's own names (see dedupe in scripts/build-universe.mjs)
  const keep = (names: string[], aliases: string[]) => { const seen = new Set(names.map(norm)); return aliases.filter((a) => { const k = norm(a); if (!k || seen.has(k)) return false; seen.add(k); return true }) }
  it('is the version-12 format, small, and says how many items it holds', () => {
    expect(pointer.v).toBe(13); expect(file.v).toBe(13); expect(file.p).toBe(2)
    expect(pointer.items).toBe(5750); expect(file.i).toHaveLength(5750)
    expect(pointer.variants).toBe(src.items.reduce((n, i) => n + (i.variants?.length ?? 0), 0))
    // phones download it once: stay well under the old format (290 KB gzipped at 5,000 items); budget 220 KB at 5,500
    expect(gzipSync(raw).length).toBeLessThan(220 * 1024)
  })
  it('unpacks to exactly what universe.json says: every item, variant, alias, flag and Hindi name', () => {
    const d = unpackUniverse(file)
    expect(d.i).toHaveLength(src.items.length)
    src.items.forEach((it, n) => {
      const r = d.i[n]
      expect([r[0], r[1], r[2], r[3]], it.id).toEqual([it.id, it.hinglish, it.hi, it.en])
      expect([d.c[r[4]], d.u[r[5]], r[6] === 1, r[7] < 0 ? null : d.b[r[7]]], it.id).toEqual([it.category, it.unit, !!it.loose, it.brand])
      expect(r[8], it.id).toEqual(keep([it.hinglish, it.hi, it.en], it.aliases))
      const u = universeItem(d, n)
      expect(u.variants.length, it.id).toBe(it.variants?.length ?? 0)
      expect(u.variant?.hinglish ?? null, it.id).toBe(it.variants?.find((v) => v.default)?.hinglish ?? null)
      ;(it.variants ?? []).forEach((v, k) => {
        const w = u.variants[k]
        expect([w.id, w.hinglish, w.hi, w.en, w.default, w.legacy], `${it.id}/${v.id}`).toEqual([v.id, v.hinglish, v.hi, v.en, !!v.default, v.legacy ?? []])
        expect(w.aliases, `${it.id}/${v.id}`).toEqual(keep([v.hinglish, v.hi], v.aliases ?? []))
      })
    })
  })
  it('unpacking in slices gives the same rows as unpacking in one go', async () => {
    expect(await unpackUniverseAsync(file)).toEqual(unpackUniverse(file))
  })
  it('the loaded universe is the unpacked file', async () => {
    expect(await loadUniverse()).toEqual(unpackUniverse(file))
  })
})

describe('start-up (warmUniverse)', () => {
  it('first run downloads the file once and saves it; the next run opens from the saved copy and downloads nothing while the file name (its hash) is unchanged', async () => {
    const realFetch = globalThis.fetch
    const store = new Map<string, string>([['omni-universe-v11', 'old copy'], ['other-key', 'kept']])
    globalThis.localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k), get length() { return store.size }, key: (i: number) => [...store.keys()][i] ?? null, clear: () => store.clear() } as Storage
    const calls: string[] = []
    globalThis.fetch = (async (u: string) => { calls.push(u); return { json: async () => JSON.parse(readFileSync(join(pub, u), 'utf8')) } }) as unknown as typeof fetch
    try {
      vi.resetModules()
      const first = await import('../universe')
      await new Promise<void>((done) => first.warmUniverse(done))
      expect(calls).toHaveLength(2); expect(calls[0]).toBe('/universe/u.json')
      expect(store.has('omni-universe-v13')).toBe(true); expect(store.has('omni-universe-v11')).toBe(false); expect(store.get('other-key')).toBe('kept')
      expect(first.findInUniverse('maida').length).toBeGreaterThan(0)
      // phone restarts: fresh module, same saved copy
      calls.length = 0; vi.resetModules()
      const second = await import('../universe')
      await new Promise<void>((done) => second.warmUniverse(done))
      expect(second.findInUniverse('maida').map((x) => x.id)).toContain('maida')
      await new Promise((r) => setTimeout(r, 30))
      expect(calls).toEqual(['/universe/u.json'])
    } finally { globalThis.fetch = realFetch; delete (globalThis as { localStorage?: Storage }).localStorage }
  })
})

describe('lean voice index', () => {
  it('spellings that sound like an existing name add no extra letter-pair postings, yet every spelling still answers and finds its own product', () => {
    const ms = universeMatchables(), idx = buildIndex(ms)
    expect(idx.entries.length).toBeGreaterThan(60000)
    const postings = [...idx.grams.values()].reduce((n, l) => n + l.length, 0)
    expect(postings / idx.entries.length).toBeLessThan(30) // 31.6 before the leaner index (1,978,212 postings for 64,110 entries)
    // a sample of 2,000 spoken forms (every kind: names, spellings, flavour/size phrases) must still land on their own product family
    const qs: [string, string][] = []
    ms.forEach((m) => { for (const a of [m.hinglish, ...m.aliases]) qs.push([a, m.family ?? m.id]) })
    let ok = 0, n = 0
    for (let i = 0; i < qs.length; i += Math.ceil(qs.length / 2000)) { const [q, fam] = qs[i], top = matchName(q, idx)[0]; n++; if (top && (top.item.family ?? top.item.id) === fam) ok++ }
    expect(n).toBeGreaterThan(1500)
    expect(ok / n).toBeGreaterThan(0.97)
    // exact spellings keep their exact-match slot even without postings
    const e = idx.entries.find((x) => x.exact === 'meda')
    if (e) expect(matchName('meda', idx)[0].score).toBe(1)
  }, 60000)
})
