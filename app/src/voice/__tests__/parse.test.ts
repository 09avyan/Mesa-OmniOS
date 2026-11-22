import { describe, expect, it } from 'vitest'
import { parse } from '../parse'
import { readNumber } from '../numbers'
import { tokenize } from '../normalize'
import { catalogIndex as idx } from '../catalog'

const num = (s: string) => readNumber(tokenize(s), 0)?.value
const ids = (text: string) => parse(text, idx).items.map((i) => i.candidates[0]?.id)

describe('numbers', () => {
  it.each([
    ['2', 2], ['do', 2], ['दो', 2], ['१०', 10], ['dedh', 1.5], ['dhai', 2.5], ['aadha', 0.5], ['sawa do', 2.25],
    ['saade teen', 3.5], ['paune do', 1.75], ['do sau pachas', 250], ['4,200', 4200], ['ek hazaar', 1000],
    ['paanch sau', 500], ['char hazaar do sau', 4200], ['pav', 0.25], ['bees', 20],
  ])('%s -> %s', (s, v) => expect(num(s)).toBe(v))
})

describe('acceptance phrases', () => {
  it('bill with customer: "Sharma ji, 2 kilo cheeni, 1 Maggi"', () => {
    const p = parse('Sharma ji, 2 kilo cheeni, 1 Maggi', idx)
    expect(p.intent).toBe('bill')
    expect(p.customer).toBe('Sharma ji')
    expect(p.items).toHaveLength(2)
    expect(p.items[0]).toMatchObject({ qty: 2, unit: 'kg', sure: true })
    expect(p.items[0].candidates[0].id).toBe('sugar-loose')
    expect(p.items[1].qty).toBe(1)
    expect(p.items[1].candidates[0].id).toBe('maggi-masala-70g')
    expect(p.items[1].sure).toBe(false) // several Maggi -> "Yahi wali?"
  })
  it('same bill without commas, as speech often comes', () => {
    const p = parse('sharma ji 2 kilo cheeni 1 maggi', idx)
    expect(p.customer).toBe('Sharma ji')
    expect(ids('sharma ji 2 kilo cheeni 1 maggi')).toEqual(['sugar-loose', 'maggi-masala-70g'])
  })
  it('Devanagari speech: "शर्मा जी 2 किलो चीनी 1 मैगी"', () => {
    const p = parse('शर्मा जी 2 किलो चीनी 1 मैगी', idx)
    expect(p.intent).toBe('bill')
    expect(p.customer).toBe('शर्मा जी')
    expect(p.items.map((i) => i.candidates[0]?.id)).toEqual(['sugar-loose', 'maggi-masala-70g'])
  })
  it('walk-in bill, name after number: "cheeni do kilo aur ek maggi"', () => {
    const p = parse('cheeni do kilo aur ek maggi', idx)
    expect(p.customer).toBeNull()
    expect(p.items[0]).toMatchObject({ qty: 2, unit: 'kg' })
    expect(ids('cheeni do kilo aur ek maggi')).toEqual(['sugar-loose', 'maggi-masala-70g'])
  })
  it('stock in: "Maal aaya, 10 Aashirvaad atta"', () => {
    const p = parse('Maal aaya, 10 Aashirvaad atta', idx)
    expect(p.intent).toBe('stock_in')
    expect(p.items[0].qty).toBe(10)
    expect(p.items[0].candidates[0].item.brand).toBe('Aashirvaad')
  })
  it('payment: "Gupta ji ne 500 diye"', () => {
    const p = parse('Gupta ji ne 500 diye', idx)
    expect(p).toMatchObject({ intent: 'payment', customer: 'Gupta ji', amount: 500 })
  })
  it('payment in Hindi: "गुप्ता जी ने पांच सौ दिए"', () => {
    expect(parse('गुप्ता जी ने पांच सौ दिए', idx)).toMatchObject({ intent: 'payment', amount: 500 })
  })
  it('query: "Cheeni kitni bachi?"', () => {
    const p = parse('Cheeni kitni bachi?', idx)
    expect(p.intent).toBe('query')
    expect(p.items[0].candidates[0].id).toBe('sugar-loose')
  })
  it('galla: "Galla mein 4,200 hai"', () => {
    expect(parse('Galla mein 4,200 hai', idx)).toMatchObject({ intent: 'galla', amount: 4200 })
  })
  it('galla in words: "galle mein char hazaar do sau hai"', () => {
    expect(parse('galle mein char hazaar do sau hai', idx)).toMatchObject({ intent: 'galla', amount: 4200 })
  })
  it('synonyms: shakkar = cheeni, "Madhur sugar" -> sugar', () => {
    expect(ids('1 kilo shakkar')).toEqual(['sugar-loose'])
    expect(ids('2 madhur sugar')).toEqual(['sugar-loose'])
  })
  it('misspelling: "maggie", "aashirwad"', () => {
    expect(ids('2 maggie')[0]).toBe('maggi-masala-70g')
    expect(parse('1 aashirwad atta', idx).items[0].candidates[0].item.brand).toBe('Aashirvaad')
  })
  it('money-based item: "50 rupaye ka dhaniya"', () => {
    const it0 = parse('50 rupaye ka dhaniya', idx).items[0]
    expect(it0.rupees).toBe(50)
    expect(it0.qty).toBeNull()
  })
  it('fractions: "dedh kilo chawal, aadha kilo toor dal"', () => {
    const p = parse('dedh kilo chawal, aadha kilo toor dal', idx)
    expect(p.items.map((i) => [i.qty, i.unit])).toEqual([[1.5, 'kg'], [0.5, 'kg']])
  })
  it('"de do" is not the number 2: "2 parle g de do"', () => {
    const p = parse('2 parle g de do', idx)
    expect(p.items).toHaveLength(1)
    expect(p.items[0].qty).toBe(2)
  })
})

describe('names vs items', () => {
  const known = ['Ramesh', 'Sharma ji', 'Gupta ji']
  it('known customer without "ji" or comma: "Ramesh 2 kilo cheeni"', () => {
    const p = parse('Ramesh 2 kilo cheeni', idx, known)
    expect(p).toMatchObject({ intent: 'bill', customer: 'Ramesh', customerSure: true })
    expect(p.items[0].candidates[0].id).toBe('sugar-loose')
  })
  it('known customer with a small spelling change: "sharmaji 1 maggi"', () => {
    expect(parse('sharmaji 1 maggi', idx, known)).toMatchObject({ customer: 'Sharma ji', customerSure: true })
  })
  it('name at the end: "2 kilo cheeni Sharma ji ke liye"', () => {
    const p = parse('2 kilo cheeni Sharma ji ke liye', idx, known)
    expect(p).toMatchObject({ customer: 'Sharma ji', customerSure: true })
    expect(p.items).toHaveLength(1)
    expect(p.items[0].candidates[0].id).toBe('sugar-loose')
  })
  it('name at the end, new person: "ek maggi verma ji ka"', () => {
    const p = parse('ek maggi verma ji ka', idx)
    expect(p.customer).toBe('Verma ji')
    expect(p.items).toHaveLength(1)
  })
  it('unknown bare word before items is a guessed name (owner confirms): "Pappu 2 kilo cheeni"', () => {
    expect(parse('Pappu 2 kilo cheeni', idx)).toMatchObject({ customer: 'Pappu', customerSure: false })
  })
  it('item first is not a name: "cheeni 2 kilo"', () => {
    expect(parse('cheeni 2 kilo', idx).customer).toBeNull()
  })
  it('brand first is not a name: "maggi 2, parle g 1"', () => {
    expect(parse('maggi 2, parle g 1', idx).customer).toBeNull()
  })
  it('walk-in, no name: "2 kilo cheeni 1 maggi"', () => {
    expect(parse('2 kilo cheeni 1 maggi', idx)).toMatchObject({ customer: null, customerSure: true })
  })
  it('payment from a known customer without ji: "ramesh ne 200 diye"', () => {
    expect(parse('ramesh ne 200 diye', idx, known)).toMatchObject({ intent: 'payment', customer: 'Ramesh', amount: 200 })
  })
})
