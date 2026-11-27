// 60 realistic shop sentences (Hinglish + Hindi script + messy speech-to-text) -> what the owner should see. Runs on the full index (catalogue + Universe) like the app.
import { beforeAll, describe, expect, it } from 'vitest'
import { parse } from '../parse'
import { fullShop, type TestShop } from './fullIndex'

let shop: TestShop
beforeAll(async () => { shop = await fullShop() })
const known = ['Ramesh', 'Sharma ji', 'Gupta ji', 'Verma ji']

type Want = { intent?: string; customer?: string | null; pay?: string | null; amount?: number; items?: { qty?: number | null; unit?: string | null; rupees?: number; id?: RegExp }[] }
const CASES: [string, Want][] = [
  ['2 kilo cheeni', { items: [{ qty: 2, unit: 'kg', id: /sugar/ }] }],
  ['do kilo chini aur ek maggi', { items: [{ qty: 2, unit: 'kg', id: /sugar/ }, { qty: 1, id: /maggi/ }] }],
  ['to kilo cheeni', { items: [{ qty: 2, unit: 'kg', id: /sugar/ }] }],
  ['dedh kilo aloo', { items: [{ qty: 1.5, unit: 'kg', id: /potato/ }] }],
  ['dhai sau gram jeera', { items: [{ qty: 250, unit: 'g', id: /jeera/ }] }],
  ['aadha kilo chawal dena', { items: [{ qty: 0.5, unit: 'kg', id: /chawal|rice/ }] }],
  ['sawa kilo atta chahiye', { items: [{ qty: 1.25, unit: 'kg', id: /atta/ }] }],
  ['pav kilo toor dal', { items: [{ qty: 0.25, unit: 'kg' }] }],
  ['teen parle g', { items: [{ qty: 3, unit: null, id: /parle-g/ }] }],
  ['पांच पारले जी', { items: [{ qty: 5, unit: null, id: /parle-g/ }] }],
  ['चार मैगी', { items: [{ qty: 4, id: /maggi/ }] }],
  ['दो किलो चीनी', { items: [{ qty: 2, unit: 'kg', id: /sugar/ }] }],
  ['२ किलो चीनी और १ सर्फ', { items: [{ qty: 2, unit: 'kg', id: /sugar/ }, { qty: 1, id: /surf/ }] }],
  ['ढाई सौ ग्राम जीरा', { items: [{ qty: 250, unit: 'g', id: /jeera/ }] }],
  ['sharma ji ke liye 2 kilo cheeni', { customer: 'Sharma ji', items: [{ qty: 2, unit: 'kg', id: /sugar/ }] }],
  ['Sharma ji, 1 kilo aata, 2 maggi', { customer: 'Sharma ji', items: [{ qty: 1, unit: 'kg', id: /atta/ }, { qty: 2, id: /maggi/ }] }],
  ['bhaiya 2 kilo cheeni dena', { customer: null, items: [{ qty: 2, unit: 'kg', id: /sugar/ }] }],
  ['Verma ji ka 2 kilo chawal udhaar mein', { customer: 'Verma ji', pay: 'udhaar', items: [{ qty: 2, unit: 'kg', id: /chawal|rice/ }] }],
  ['ramesh 1 kilo cheeni cash mein', { customer: 'Ramesh', pay: 'cash', items: [{ qty: 1, unit: 'kg' }] }],
  ['2 kilo cheeni upi se', { pay: 'upi', items: [{ qty: 2, unit: 'kg' }] }],
  ['ek coke 750 ml', { items: [{ qty: 1, id: /coca-cola/ }] }],
  ['ek litre amul doodh', { items: [{ id: /amul|milk/ }] }],
  ['50 rupaye ka dhaniya', { items: [{ rupees: 50, qty: null, id: /dhaniya|coriander/ }] }],
  ['₹20 ka haldi', { items: [{ rupees: 20 }] }],
  ['maal aaya 10 aashirvaad atta', { intent: 'stock_in', items: [{ qty: 10 }] }],
  ['gupta ji ne 500 diye', { intent: 'payment', customer: 'Gupta ji', amount: 500 }],
  ['गुप्ता जी ने पांच सौ रुपये दिए', { intent: 'payment', amount: 500 }],
  ['galla mein char hazaar do sau hai', { intent: 'galla', amount: 4200 }],
  ['cheeni kitni bachi', { intent: 'query', items: [{ id: /sugar/ }] }],
  ['haan ji haan 1 kilo namak dena', { items: [{ qty: 1, unit: 'kg' }] }],
  // ---- 31-60: Devanagari, mixed number words, fractions, glued units, names with honorifics, messy STT
  ['ढाई किलो आलू', { items: [{ qty: 2.5, unit: 'kg', id: /potato|aloo/ }] }],
  ['साढ़े तीन किलो आटा', { items: [{ qty: 3.5, unit: 'kg', id: /atta/ }] }],
  ['एक किलो नमक', { items: [{ qty: 1, unit: 'kg', id: /namak|salt/ }] }],
  ['आधा किलो पनीर', { items: [{ qty: 0.5, unit: 'kg', id: /paneer/ }] }],
  ['दो पैकेट मैगी', { items: [{ qty: 2, unit: 'pack', id: /maggi/ }] }],
  ['शर्मा जी के लिए 2 किलो चीनी', { customer: 'Sharma ji', items: [{ qty: 2, unit: 'kg', id: /sugar/ }] }],
  ['चीनी दो किलो और चाय पत्ती आधा किलो', { items: [{ qty: 2, unit: 'kg', id: /sugar/ }, { qty: 0.5, unit: 'kg', id: /chai|tea/ }] }],
  ['2 kilo cheeni sharma ji wala', { customer: 'Sharma ji', items: [{ qty: 2, unit: 'kg', id: /sugar/ }] }],
  ['2 kilo cheeni ramesh ke liye', { customer: 'Ramesh', items: [{ qty: 2, unit: 'kg', id: /sugar/ }] }],
  ['sarma ji ke liye 1 kilo atta', { customer: 'Sharma ji', items: [{ qty: 1, unit: 'kg', id: /atta/ }] }],
  ['to kilo chini aur ek maggie', { items: [{ qty: 2, unit: 'kg', id: /sugar/ }, { qty: 1, id: /maggi/ }] }],
  ['tin kilo aloo do kilo pyaz', { items: [{ qty: 3, unit: 'kg', id: /potato|aloo/ }, { qty: 2, unit: 'kg', id: /onion|pyaz/ }] }],
  ['1.5 kilo aloo', { items: [{ qty: 1.5, unit: 'kg', id: /potato|aloo/ }] }],
  ['1/2 kilo cheeni', { items: [{ qty: 0.5, unit: 'kg', id: /sugar/ }] }],
  ['half kilo chawal aur quarter kilo jeera', { items: [{ qty: 0.5, unit: 'kg', id: /chawal|rice/ }, { qty: 0.25, unit: 'kg', id: /jeera/ }] }],
  ['do kilo paanch sau gram aloo', { items: [{ qty: 2.5, unit: 'kg', id: /potato|aloo/ }] }],
  ['500gm jeera', { items: [{ qty: 500, unit: 'g', id: /jeera/ }] }],
  ['2kg cheeni 1ltr amul doodh', { items: [{ qty: 2, unit: 'kg', id: /sugar/ }, { id: /milk|amul|doodh/ }] }],
  ['paune do kilo cheeni', { items: [{ qty: 1.75, unit: 'kg', id: /sugar/ }] }],
  ['teen sau gram haldi', { items: [{ qty: 300, unit: 'g', id: /haldi/ }] }],
  ['ek do kilo cheeni', { items: [{ qty: 2, unit: 'kg', id: /sugar/ }] }],
  ['ek maggi do parle g', { items: [{ qty: 1, id: /maggi/ }, { qty: 2, id: /parle-g/ }] }],
  ['gupta ji ne dedh sau diye', { intent: 'payment', customer: 'Gupta ji', amount: 150 }],
  ['verma ji ne paanch sau jama kiye', { intent: 'payment', customer: 'Verma ji', amount: 500 }],
  ['galla mein teen hazaar paanch sau hai', { intent: 'galla', amount: 3500 }],
  ['cheeni kitni bachi hai', { intent: 'query', items: [{ id: /sugar/ }] }],
  ['maal aaya 20 kilo atta', { intent: 'stock_in', items: [{ qty: 20 }] }],
  ['दो डेटोल साबुन', { items: [{ qty: 2, id: /dettol/ }] }],
  ['bhaiya do kilo cheeni upi se', { customer: null, pay: 'upi', items: [{ qty: 2, unit: 'kg', id: /sugar/ }] }],
  ['ramesh bhai 1 kilo aata 2 maggi udhaar mein', { customer: 'Ramesh', pay: 'udhaar', items: [{ qty: 1, unit: 'kg', id: /atta/ }, { qty: 2, id: /maggi/ }] }],
]

describe('60 shop sentences', () => {
  it.each(CASES)('%s', (text, w) => {
    const p = parse(text, shop.index, known)
    if (w.intent) expect(p.intent).toBe(w.intent)
    else expect(p.intent).toBe('bill')
    if (w.customer !== undefined) expect(p.customer).toBe(w.customer)
    if (w.pay !== undefined) expect(p.pay ?? null).toBe(w.pay)
    if (w.amount !== undefined) expect(p.amount).toBe(w.amount)
    for (const [k, x] of (w.items ?? []).entries()) {
      const i = p.items[k]
      expect(i, 'item ' + k).toBeDefined()
      if (x.qty !== undefined) expect(i.qty).toBe(x.qty)
      if (x.unit !== undefined) expect(i.unit).toBe(x.unit)
      if (x.rupees !== undefined) expect(i.rupees).toBe(x.rupees)
      if (x.id) expect(i.candidates[0]?.id ?? '').toMatch(x.id)
    }
    if (w.items) expect(p.items.length).toBe(w.items.length)
  })
})
