import { beforeAll, describe, expect, it } from 'vitest'
import { parse } from '../parse'
import { readNumber } from '../numbers'
import { tokenize } from '../normalize'
import { lineFrom } from '../draft'
import { fullShop, type TestShop } from './fullIndex'

let shop: TestShop
beforeAll(async () => { shop = await fullShop() })
const P = (s: string, known: string[] = []) => parse(s, shop.index, known)
const L = (s: string, k = 0) => lineFrom(P(s).items[k], shop as never)

describe('parser bugs found in testing', () => {
  it('"teen parle g" is 3 x Parle-G, not 3 grams of parle', () => {
    const p = P('teen parle g')
    expect(p.items).toHaveLength(1)
    expect(p.items[0]).toMatchObject({ qty: 3, unit: null })
    expect(p.items[0].candidates[0].item.hinglish.toLowerCase()).toContain('parle')
    expect(p.items[0].candidates[0].item.hinglish.toLowerCase()).toContain('g')
  })
  it('a real gram size next to the brand still counts: "parle g 200 gram" = the 200 g pack', () => {
    const it0 = P('parle g 200 gram').items[0]
    expect(it0.said).toContain('200')
    expect(it0.qty).toBe(1)
    expect((it0.candidates[0].item.variant ?? '') + it0.candidates[0].item.en).toMatch(/200/)
  })
  it('compound numbers: dhai sau = 250, dedh sau = 150, sawa sau = 125, saade teen sau = 350', () => {
    const n = (s: string) => readNumber(tokenize(s), 0)
    expect(n('dhai sau')).toEqual({ value: 250, used: 2 })
    expect(n('dedh sau')?.value).toBe(150)
    expect(n('sawa sau')?.value).toBe(125)
    expect(n('saade teen sau')?.value).toBe(350)
    expect(n('dhai hazaar')?.value).toBe(2500)
    expect(n('dhai')?.value).toBe(2.5)
  })
  it('"dhai sau gram jeera" = 250 g jeera', () => {
    const it0 = P('dhai sau gram jeera').items[0]
    expect(it0).toMatchObject({ said: 'jeera', qty: 250, unit: 'g' })
    expect(it0.candidates[0].id).toBe('jeera-loose')
    expect(L('dhai sau gram jeera').qty).toBe(0.25)   // kg item
  })
  it('"dedh kilo aloo" = potato, not Haldiram Aloo Bhujia', () => {
    const c = P('dedh kilo aloo').items[0].candidates[0]
    expect(c.item.loose).toBe(true)
    expect(c.item.en.toLowerCase()).toMatch(/aloo|potato/)
    expect(c.item.en.toLowerCase()).not.toContain('bhujia')
  })
  it('weight prefers loose even when only a packet sounds closer: "ek kilo aloo" vs "1 packet aloo bhujia"', () => {
    expect(P('1 packet aloo bhujia').items[0].candidates[0].item.en.toLowerCase()).toContain('bhujia')
  })
  it('"Verma ji ka 2 kilo chawal udhaar mein": customer, item and pay', () => {
    const p = P('Verma ji ka 2 kilo chawal udhaar mein')
    expect(p.customer).toBe('Verma ji')
    expect(p.pay).toBe('udhaar')
    expect(p.items).toHaveLength(1)
    expect(p.items[0]).toMatchObject({ said: 'chawal', qty: 2, unit: 'kg' })
    expect(p.items[0].candidates[0].id).toBe('chawal-loose')
  })
  it.each([
    ['2 kilo cheeni cash mein', 'cash'], ['2 kilo cheeni upi se', 'upi'], ['2 kilo cheeni online', 'upi'], ['sharma ji ka 1 maggi khate mein', 'udhaar'],
    ['2 kilo cheeni उधार', 'udhaar'],
  ])('pay words: %s -> %s', (s, pay) => {
    const p = P(s)
    expect(p.pay).toBe(pay)
    expect(p.items).toHaveLength(s.includes('maggi') ? 1 : 1)
    expect(p.items[0].said.split(' ').some((w) => ['mein', 'se', 'cash', 'upi', 'udhaar'].includes(w))).toBe(false)
  })
  it('no pay word -> pay null; "cash count" stays the galla', () => {
    expect(P('2 kilo cheeni').pay ?? null).toBeNull()
    expect(P('cash count 3000').intent).toBe('galla')
  })
  it('"ek coke 750 ml" picks the 750 ml bottle', () => {
    const l = L('ek coke 750 ml')
    expect(P('ek coke 750 ml').items).toHaveLength(1)
    expect(l.match?.variant ?? l.match?.en).toMatch(/750/)
    expect(l.qty).toBe(1)
  })
  it('"coke 250 ml" and "do coke 2 litre"', () => {
    expect(L('coke 250 ml').match?.variant ?? '').toMatch(/250/)
    expect(L('ek coke 2 litre').match?.variant ?? '').toMatch(/^2L/i)
  })
  it('"ek litre amul doodh" picks the 1 L pack (or 2 x 500 ml), never one 500 ml', () => {
    const l = L('ek litre amul doodh')
    const ml = /1l|1 l|1000/i.test((l.match?.variant ?? '') + (l.match?.en ?? ''))
    const two = /500/.test((l.match?.variant ?? '') + (l.match?.en ?? '')) && l.qty === 2
    expect(ml || two).toBe(true)
  })
  it('"do litre amul doodh" = 2 x 1 L (or 4 x 500 ml)', () => {
    const l = L('do litre amul doodh')
    expect(((/1l/i.test(l.match?.variant ?? '') && l.qty === 2) || (/500/.test(l.match?.variant ?? l.match?.en ?? '') && l.qty === 4))).toBe(true)
  })
  it('"ek litre doodh" without a brand stays loose milk by the litre', () => {
    const l = L('ek litre doodh')
    expect(l.match?.loose).toBe(true)
    expect(l.qty).toBe(1)
  })
  it('"50 rupaye ka dhaniya": the Rs 50 stays on the line (no shop price -> 1 x Rs 50; with a price -> qty from it)', () => {
    const p = P('50 rupaye ka dhaniya')
    expect(p.items[0]).toMatchObject({ rupees: 50, qty: null })
    const l = lineFrom(p.items[0], shop as never)
    expect(l).toMatchObject({ qty: 1, price: 50, rupees: 50 })
    const priced = { ...shop, byMatchId: new Map(shop.byMatchId) }
    const m = priced.byMatchId.get(l.match!.id)!
    priced.byMatchId.set(m.id, { ...m, shop: { id: 's1', price: 80, learned_price: null } } as never)
    expect(lineFrom(p.items[0], priced as never).qty).toBe(0.625)
  })
  it('"bhaiya 2 kilo cheeni": bhaiya is address, not a customer', () => {
    expect(P('bhaiya 2 kilo cheeni').customer).toBeNull()
  })
})
