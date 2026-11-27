import { beforeAll, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadUniverse, universeMatchables } from '../../lib/universe'
import { buildIndex, matchName } from '../match'
import { chooseFlavour, familyMembers, isMixed, loadHistory, mergeHistory, recordSales, seedFromCounts, WINDOW, type FlavourHistory } from '../flavour'
import { billLinePayload, buildDraft, lineFrom, linesReady, withVariant } from '../draft'
import { parse } from '../parse'
import { billMessage, itemName } from '../../components/BillCard'
import type { Shop, ShopMatchable } from '../../lib/shop'

const pub = join(__dirname, '../../../public')
let shop: Shop
const M = 'u:maggi-70', CHICKEN = 'u:maggi-70:chicken-70g', ATTA = 'u:maggi-70:atta-masala-75g', BIG = 'u:maggi-70:masala-280g'
const hist = (...parts: [string, number][]): FlavourHistory => ({ [M]: parts.flatMap(([id, n]) => Array<string>(n).fill(id)) })
const mem = new Map<string, string>()

beforeAll(async () => {
  globalThis.fetch = (async (u: string) => ({ json: async () => JSON.parse(readFileSync(join(pub, u), 'utf8')) })) as unknown as typeof fetch
  ;(globalThis as { localStorage?: unknown }).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) }
  await loadUniverse()
  const list = universeMatchables() as ShopMatchable[]
  shop = { items: [], customers: [], index: buildIndex(list), byMatchId: new Map(list.map((m) => [m.id, m])), flavour: {}, shopKey: 'test', uniReady: Promise.resolve() }
})
const top = (said: string) => matchName(said, shop.index)[0].item as ShopMatchable

describe('flavour engine: default pick', () => {
  it('parent name only -> the Universe default, no question, with every other variant one tap away', () => {
    const c = chooseFlavour(top('maggi'), 'maggi', shop, {})!
    expect(c.match.id).toBe(M); expect(c.match.variant).toBe('Masala 70g')
    expect(c.explicit).toBe(false); expect(c.learned).toBe(false); expect(c.ask).toBeNull()
    expect(c.options[0].id).toBe(M)
    expect(c.options.map((o) => o.variant)).toEqual(expect.arrayContaining(['Masala 280g', 'Chicken 70g', 'Atta Masala 75g']))
    expect(c.options).toHaveLength(familyMembers(shop, M).length)
  })
  it('a product without variants has no flavour choice', () => {
    expect(chooseFlavour(top('sattu'), 'sattu', shop, {})).toBeNull()
  })
  it('said clearly ("maggi chicken", "maggi 280g") -> exactly that, even if the shop usually sells another', () => {
    for (const [said, id] of [['maggi chicken', CHICKEN], ['maggi 280g', BIG]]) {
      const c = chooseFlavour(top(said), said, shop, hist([ATTA, 20]))!
      expect(c.match.id).toBe(id); expect(c.explicit).toBe(true); expect(c.ask).toBeNull()
    }
  })
})

describe('flavour engine: learned pick', () => {
  it("this shop's favourite beats the Universe default, with no question when one flavour clearly dominates", () => {
    const c = chooseFlavour(top('maggi'), 'maggi', shop, hist([CHICKEN, 9], [M, 1], [ATTA, 1]))!
    expect(c.match.id).toBe(CHICKEN); expect(c.learned).toBe(true); expect(c.ask).toBeNull()
    expect(c.options[0].id).toBe(CHICKEN)
  })
  it('only the last 30 sales count (a shop that changed its habit)', () => {
    const c = chooseFlavour(top('maggi'), 'maggi', shop, hist([M, 50], [CHICKEN, 30]))!
    expect(c.match.id).toBe(CHICKEN)
  })
  it('after a sale the engine learns it (kept on the phone, trimmed to the window)', () => {
    let h: FlavourHistory = {}
    for (let i = 0; i < 40; i++) h = recordSales(h, [{ family: M, id: CHICKEN }, { id: 'u:sattu' }], 'shopA')
    expect(h[M]).toHaveLength(WINDOW); expect(Object.keys(h)).toEqual([M]) // no family -> not tracked
    expect(loadHistory('shopA')[M]).toHaveLength(WINDOW)
    expect(loadHistory('another shop')).toEqual({})
    expect(chooseFlavour(top('maggi'), 'maggi', shop, loadHistory('shopA'))!.match.id).toBe(CHICKEN)
  })
  it('server counts seed a fresh phone; the phone\'s own recent sales win', () => {
    const seed = seedFromCounts([{ family: M, match_id: CHICKEN, n: 90 }, { family: M, match_id: M, n: 10 }])
    expect(seed[M]).toHaveLength(WINDOW)
    expect(chooseFlavour(top('maggi'), 'maggi', shop, seed)!.match.id).toBe(CHICKEN)
    expect(mergeHistory({ [M]: [BIG] }, seed)[M]).toEqual([BIG])
  })
})

describe('flavour engine: ask only when the shop sells a mix', () => {
  it('needs at least 10 recent sales before it believes there is a mix', () => {
    expect(isMixed(hist([M, 5], [CHICKEN, 4])[M])).toBe(false)   // 9 sales
    expect(chooseFlavour(top('maggi'), 'maggi', shop, hist([M, 5], [CHICKEN, 4]))!.ask).toBeNull()
  })
  it('one flavour at 70% or more = a regular, not a mix', () => {
    expect(isMixed(hist([M, 7], [CHICKEN, 3])[M])).toBe(false)
    expect(isMixed(hist([M, 8], [CHICKEN, 2])[M])).toBe(false)
  })
  it('under 70%: offers the top 2-3 as one-tap choices, the auto-pick first and preselected', () => {
    const c = chooseFlavour(top('maggi'), 'maggi', shop, hist([M, 5], [CHICKEN, 4], [ATTA, 2], [BIG, 1]))!
    expect(isMixed(hist([M, 5], [CHICKEN, 4], [ATTA, 2], [BIG, 1])[M])).toBe(true)
    expect(c.ask!.map((a) => a.id)).toEqual([M, CHICKEN, ATTA]); expect(c.ask![0].id).toBe(c.match.id)
    const two = chooseFlavour(top('maggi'), 'maggi', shop, hist([CHICKEN, 6], [M, 4]))!
    expect(two.ask!.map((a) => a.id)).toEqual([CHICKEN, M]); expect(two.match.id).toBe(CHICKEN)
  })
  it('never asks when the flavour was said', () => {
    expect(chooseFlavour(top('maggi chicken'), 'maggi chicken', shop, hist([M, 5], [CHICKEN, 5]))!.ask).toBeNull()
  })
})

describe('flavour engine: never blocks billing', () => {
  it('the line is sure even when the "Kaunsa?" choices are shown, and the bill can be completed untouched', () => {
    shop.flavour = hist([M, 5], [CHICKEN, 5])
    const p = parse('2 maggi', shop.index)
    expect(p.items[0].sure).toBe(true) // variants never trigger "Yahi wali?"
    const l = lineFrom(p.items[0], shop)
    expect(l.sure).toBe(true); expect(l.flavour!.ask).not.toBeNull(); expect(l.qty).toBe(2)
    expect(linesReady({ ...buildDraft(p, shop), lines: [{ ...l, price: 14 }] })).toBe(true)
    shop.flavour = {}
  })
  it('one tap on another flavour swaps the item, clears the question and keeps the line sure', () => {
    shop.flavour = hist([M, 5], [CHICKEN, 5])
    const l = lineFrom(parse('maggi', shop.index).items[0], shop)
    const chicken = l.flavour!.ask!.find((a) => a.id === CHICKEN)!
    const patch = withVariant(l, chicken)
    expect(patch.match!.variant).toBe('Chicken 70g'); expect(patch.sure).toBe(true); expect(patch.flavour!.ask).toBeNull(); expect(patch.flavour!.explicit).toBe(true)
    shop.flavour = {}
  })
})

describe('variant on the bill line', () => {
  const line = (said: string) => ({ ...lineFrom(parse(said, shop.index).items[0], shop), price: 14, qty: 2 })
  it('the save payload carries the variant label, its Hindi form and the product family', () => {
    const p = billLinePayload(line('maggi chicken'))
    expect(p).toMatchObject({ catalog_id: CHICKEN, name: 'Maggi Chicken 70g', variant: 'Chicken 70g', family: M, qty: 2, price: 14 })
    expect(p.variant_hi).toMatch(/चिकन/)
    expect(billLinePayload(line('maggi'))).toMatchObject({ catalog_id: M, name: 'Maggi Masala 70g', variant: 'Masala 70g' })
    expect(billLinePayload(line('sattu'))).toMatchObject({ variant: null, family: null })
  })
  it('bill name shows the variant once; old rows that only have the item name get it appended', () => {
    expect(itemName({ name: 'Maggi', variant: 'Masala 70g', qty: 1, unit: 'pc', price: 14, amount: 14 }, 'hinglish')).toBe('Maggi Masala 70g')
    expect(itemName({ name: 'Maggi Masala 70g', variant: 'Masala 70g', qty: 1, unit: 'pc', price: 14, amount: 14 }, 'en')).toBe('Maggi Masala 70g')
    expect(itemName({ name: 'Maggi', name_hi: 'मैगी', variant: 'Masala 70g', variant_hi: 'मसाला 70 ग्राम', qty: 1, unit: 'pc', price: 14, amount: 14 }, 'hi')).toBe('मैगी मसाला 70 ग्राम')
    expect(itemName({ name: 'Sattu', qty: 1, unit: 'kg', price: 80, amount: 80 }, 'hinglish')).toBe('Sattu')
  })
  it('WhatsApp / receipt text lists each line with its flavour and size', () => {
    const m = line('maggi chicken'), big = chooseFlavour(top('maggi 280g'), 'maggi 280g', shop, {})!.match
    const txt = billMessage('Sharma Kirana', 'hinglish', 70, [m.match!, big].map((x) => ({ name: x.hinglish, qty: 2, amount: 28 })), 'https://x/b/1')
    expect(txt).toContain('Sharma Kirana: Aapka bill ₹70'); expect(txt).toContain('• Maggi Chicken 70g × 2 = ₹28'); expect(txt).toContain('• Maggi Masala 280g × 2 = ₹28'); expect(txt).toContain('https://x/b/1')
  })
})
