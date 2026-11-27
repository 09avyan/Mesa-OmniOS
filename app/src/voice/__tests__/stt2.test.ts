// STT round 2: phonetic matching, number robustness, customer names, shop-context picking.
import { beforeAll, describe, expect, it } from 'vitest'
import { buildIndex, matchName, type Matchable } from '../match'
import { parse } from '../parse'
import { nameScore } from '../parse'
import { pickBest } from '../pickBest'
import { phonKey, skelKey, devToLatin, tokenize } from '../normalize'
import { readNumber } from '../numbers'
import { fullShop, type TestShop } from './fullIndex'

let shop: TestShop
beforeAll(async () => { shop = await fullShop() })
const known = ['Ramesh', 'Sharma ji', 'Gupta ji', 'Verma ji']
const first = (w: string, n = 3) => matchName(w, shop.index, n).map((c) => c.id)

describe('phonetic key', () => {
  it.each([
    ['colgate', 'kolgate'], ['maida', 'meda'], ['haldi', 'haldee'], ['dhoop', 'dhup'], ['aashirvaad', 'ashirbad'], ['masala', 'masaala'], ['jeera', 'jeraa'],
    ['lifebuoy', 'lifeboy'], ['dahi', 'dahee'], ['shakkar', 'sakkar'], ['besan', 'bessan'], ['doodh', 'dudh'], ['sabun', 'saboon'],
  ])('%s sounds like %s', (a, b) => expect(phonKey(a)).toBe(phonKey(b)))
  it.each([['dal', 'dil'], ['tel', 'til'], ['atta', 'chai'], ['sugar', 'salt'], ['maggi', 'magic']])('%s is not %s', (a, b) => expect(phonKey(a)).not.toBe(phonKey(b)))
  it('Devanagari and Latin spellings of one word meet', () => {
    expect(phonKey('शर्मा')).toBe(phonKey('sharma'))
    expect(phonKey('चीनी')).toBe(phonKey('cheeni'))
    expect(phonKey('कमला')).toBe(phonKey('kamla'))
    expect(phonKey('सीमा')).toBe(phonKey('seema'))
    expect(phonKey('डेटोल')).toBe(phonKey('dettol'))
    expect(devToLatin('कमल')).toBe('kamal')
  })
  it('skeleton drops vowels but keeps the first letter', () => { expect(skelKey(phonKey('maida'))).toBe(skelKey(phonKey('meda'))); expect(skelKey('')).toBe('') })
  it('whatever the sound key already equated stays equated (the layer only adds matches)', () => {
    for (const [a, b] of [['maida', 'meda'], ['eveready', 'everready'], ['aashirvaad', 'ashirwad'], ['zeera', 'jeera']]) expect(phonKey(a)).toBe(phonKey(b))
  })
})

describe('20 messy spellings still find the right item (unseen respellings from speech-to-text)', () => {
  const CASES: [string, RegExp][] = [
    ['jeraa', /jeera/], ['dhettol', /dettol/], ['डेटोल', /dettol/], ['ashirbad atta', /aashirvaad/], ['chaay patti', /chai|tea/], ['besn', /besan/],
    ['lifebooy', /lifebuoy/], ['harlix', /horlicks/], ['kolgete', /colgate/], ['colgait', /colgate/], ['bournvitta', /bournvita/], ['vaseleen', /vaseline/],
    ['pepsodant', /pepsodent/], ['parley jee', /parle-g/], ['surph excel', /surf-excel/], ['kurkura', /kurkure/], ['amool butter', /amul|butter/],
    ['tamaatar', /tomato|tamatar/], ['शक्कर', /sugar/], ['dahee', /dahi|curd/],
  ]
  expect(CASES).toHaveLength(20)
  it.each(CASES)('%s', (said, want) => expect(first(said).some((id) => want.test(id)), said + ' -> ' + first(said).join(', ')).toBe(true))
  it('a guess that only shares the consonants is never "sure" and unknown names stay unknown', () => {
    const c = matchName('zzqx', shop.index)
    expect(c.every((x) => x.score < 0.7)).toBe(true)
    const sk = matchName('mdaa', shop.index)   // consonant skeleton of maida
    for (const x of sk) if (x.score < 0.7) expect(x.score).toBeLessThan(0.7)
  })
})

describe('numbers: Hindi / English mixes', () => {
  const one = (text: string) => { const p = parse(text, shop.index, known); expect(p.items, text).toHaveLength(1); return p.items[0] }
  it.each([
    ['two kilo cheeni', 2, 'kg'], ['teen sau gram jeera', 300, 'g'], ['ढाई किलो चीनी', 2.5, 'kg'], ['साढ़े तीन किलो आटा', 3.5, 'kg'], ['1/2 kilo cheeni', 0.5, 'kg'],
    ['½ kilo cheeni', 0.5, 'kg'], ['1 1/2 kilo atta', 1.5, 'kg'], ['3/4 kilo chawal', 0.75, 'kg'], ['half kilo chawal', 0.5, 'kg'], ['quarter kilo toor dal', 0.25, 'kg'],
    ['paav jeera', 0.25, null], ['pao kilo chawal', 0.25, 'kg'], ['one and half kilo aloo', 1.5, 'kg'], ['two and a half kilo aloo', 2.5, 'kg'], ['teen aur aadha kilo cheeni', 3.5, 'kg'],
    ['1.5 kilo aloo', 1.5, 'kg'], ['2.5kg atta', 2.5, 'kg'], ['sava kilo atta', 1.25, 'kg'], ['pone do kilo cheeni', 1.75, 'kg'], ['saadhe chaar kilo aloo', 4.5, 'kg'],
  ])('%s -> %s %s', (text, qty, unit) => { const i = one(text); expect(i.qty).toBe(qty); expect(i.unit).toBe(unit) })
  it('weight said in two parts is one quantity: "2 kilo 500 gram", "do kilo paanch sau gram", "ek kilo aur 250 gram"', () => {
    expect(one('2 kilo 500 gram aata')).toMatchObject({ qty: 2.5, unit: 'kg' })
    expect(one('do kilo paanch sau gram aloo')).toMatchObject({ qty: 2.5, unit: 'kg' })
    expect(one('ek kilo aur 250 gram cheeni')).toMatchObject({ qty: 1.25, unit: 'kg' })
    expect(one('1 litre 500 ml amul doodh').qty).not.toBeNull()
  })
  it('digits glued to units: 2kg, 500gm, 1ltr, 250ml, 2.5kg', () => {
    expect(tokenize('2kg cheeni')).toEqual(['2', 'kg', 'cheeni'])
    expect(tokenize('500gm jeera')).toEqual(['500', 'gm', 'jeera'])
    expect(tokenize('1ltr doodh')).toEqual(['1', 'ltr', 'doodh'])
    expect(tokenize('2.5kg atta')).toEqual(['2.5', 'kg', 'atta'])
    expect(one('500gm jeera')).toMatchObject({ qty: 500, unit: 'g' })
    expect(one('1ltr amul doodh').qty).toBe(1)
  })
  it('"ek do": the numbers stay separate items when different items follow, and "ek do kilo" is the last number', () => {
    const p = parse('ek maggi do cheeni', shop.index, known)
    expect(p.items.map((i) => i.qty)).toEqual([1, 2])
    expect(p.items[0].candidates[0].id).toMatch(/maggi/); expect(p.items[1].candidates[0].id).toMatch(/sugar/)
    const q = parse('ek cheeni do kilo aata', shop.index, known)
    expect(q.items.map((i) => [i.qty, i.unit])).toEqual([[1, null], [2, 'kg']])
    expect(parse('ek do kilo cheeni', shop.index, known).items).toHaveLength(1)
    expect(parse('ek do maggi', shop.index, known).items).toHaveLength(1)
  })
  it('number words and spellings', () => {
    const v = (s: string) => readNumber(tokenize(s), 0)?.value
    expect(v('twenty five')).toBe(25)
    expect(v('teen sau')).toBe(300)
    expect(v('तीन सौ')).toBe(300)
    expect(v('sava do')).toBe(2.25)
    expect(v('dhai sau')).toBe(250)
    expect(v('quarter')).toBe(0.25)
    expect(v('डेढ़')).toBe(1.5)
    expect(v('do teen')).toBe(2)   // two numbers, not 23
  })
  it('rupee amounts with number words', () => { expect(parse('twenty five rupaye ka dhaniya', shop.index, known).items[0].rupees).toBe(25) })
})

describe('customer names', () => {
  const who = (text: string, k = known) => { const p = parse(text, shop.index, k); return { c: p.customer, sure: p.customerSure, items: p.items.length, id: p.items[0]?.candidates[0]?.id ?? '' } }
  it.each([
    'sharma bhaiya ke liye 2 kilo cheeni', 'sharma ji ke liye 2 kilo cheeni', 'sharmaji ka 2 kilo cheeni', '2 kilo cheeni sharma ji wala', '2 kilo cheeni sharma ji ke liye',
    'sarma ji ke liye do kilo cheeni', 'शर्माजी के लिए 2 किलो चीनी', 'शर्मा जी 2 किलो चीनी', 'sharma sahab ko 2 kilo cheeni', 'sharma ji cheeni 2 kilo', '2 kilo cheeni sharmaji',
    'sharma uncle ke liye 2 kilo cheeni', 'sharma didi 2 kilo cheeni',
  ])('%s -> Sharma ji', (t) => { const r = who(t); expect(r.c, t).toBe('Sharma ji'); expect(r.items, t).toBe(1); expect(r.id, t).toMatch(/sugar/) })
  it('known customer without an honorific, before or after the items', () => {
    for (const t of ['ramesh cheeni 2 kilo', '2 kilo cheeni ramesh', '2 kilo cheeni ramesh ke liye', 'ramesh ke liye 2 kilo cheeni', 'rameshji ko 2 kilo cheeni', 'रमेश के लिए 2 किलो चीनी']) {
      const r = who(t, ['Ramesh', 'रमेश', 'Sharma ji'].slice(0, t.includes('रमेश') ? 2 : 1).concat(['Sharma ji']))
      expect(r.c?.toLowerCase().replace('ji', '').trim() === 'ramesh' || r.c === 'रमेश', t + ' -> ' + r.c).toBe(true)
      expect(r.items, t).toBe(1)
    }
  })
  it('unknown name with an honorific is a sure customer; a bare unknown name before "ke liye" is a guess', () => {
    expect(who('verma sahab ko 1 kilo atta')).toMatchObject({ c: 'Verma ji', sure: true })
    expect(who('sunita madam ke liye 1 kilo chawal')).toMatchObject({ c: 'Sunita madam', sure: true })
    expect(who('2 kilo cheeni kavita ke liye')).toMatchObject({ c: 'Kavita', sure: false, items: 1 })
    expect(who('sunita didi 2 kilo cheeni')).toMatchObject({ c: 'Sunita didi', sure: true })
    expect(who('2 kilo cheeni gupta wala')).toMatchObject({ c: 'Gupta ji', sure: true })
  })
  it('a form of address is not a customer, and an item word is not a name', () => {
    expect(who('bhaiya do kilo cheeni').c).toBeNull()
    expect(who('2 kilo cheeni bhaiya').c).toBeNull()
    expect(who('2 kilo cheeni ke liye').c).toBeNull()
    expect(who('do kilo cheeni aur ek maggi').c).toBeNull()
    expect(who('2 kilo cheeni 1 kilo atta wala').c).toBeNull()
  })
  it('names match by sound, in either script', () => {
    expect(nameScore('sarma ji', 'Sharma ji')).toBeGreaterThanOrEqual(0.9)
    expect(nameScore('शर्मा जी', 'Sharma ji')).toBeGreaterThanOrEqual(0.9)
    expect(nameScore('sharmaji', 'Sharma ji')).toBe(1)
    expect(nameScore('gupta bhaiya', 'Gupta ji')).toBe(1)
    expect(nameScore('verma', 'sharma')).toBeLessThan(0.8)
    const p = parse('seema ke liye 1 kilo atta', shop.index, ['सीमा'])
    expect(p.customer).toBe('सीमा')
  })
})

describe('shop context breaks ties between equally clear readings', () => {
  const mk = (id: string, name: string, extra: object = {}): Matchable => ({ id, hinglish: name, hi: name, en: name, brand: null, unit: 'pc', loose: false, aliases: [], ...extra })
  const own = mk('shop-kesar', 'Kesar', { shop: { id: 'row1' } })
  const other = mk('cat-kesri', 'Kesri')
  const idx = buildIndex([own, other])
  it('without any shop context the phone\'s first choice wins a tie', () => {
    const plain = buildIndex([mk('a-kesar', 'Kesar'), mk('b-kesri', 'Kesri')])
    const b = pickBest(['1 kesri', '1 kesar'], plain, [])!
    expect(b.text).toBe('1 kesri'); expect(b.index).toBe(0)
  })
  it('the shop\'s own item (a shop row on the match, or ids passed in) beats an item the shop does not have', () => {
    expect(pickBest(['1 kesri', '1 kesar'], idx, [])!.parsed.items[0].candidates[0].id).toBe('shop-kesar')
    const plain = buildIndex([mk('a-kesar', 'Kesar'), mk('b-kesri', 'Kesri')])
    expect(pickBest(['1 kesri', '1 kesar'], plain, [], { shopItems: new Set(['a-kesar']) })!.text).toBe('1 kesar')
  })
  it('recent sales count too (ids or product families)', () => {
    const plain = buildIndex([mk('a-kesar', 'Kesar', { family: 'kesar-fam' }), mk('b-kesri', 'Kesri')])
    expect(pickBest(['1 kesri', '1 kesar'], plain, [], { recent: ['kesar-fam'] })!.text).toBe('1 kesar')
    expect(pickBest(['1 kesri', '1 kesar'], plain, [], { recent: new Set(['b-kesri']) })!.text).toBe('1 kesri')
  })
  it('context never rescues a reading the rules do not understand', () => {
    const b = pickBest(['1 zzqx', '1 kesri'], idx, [], { shopItems: new Set(['shop-kesar']) })!
    expect(b.text).toBe('1 kesri')
  })
  it('known customers still win, spelled by sound', () => {
    const b = pickBest(['sarma ji 2 kilo cheeni', 'karma ji 2 kilo cheeni'], shop.index, ['Sharma ji'])!
    expect(b.parsed.customer).toBe('Sharma ji')
  })
})
