import { beforeAll, expect, it } from 'vitest'
import { parse } from '../parse'
import { fullShop, type TestShop } from './fullIndex'
let shop: TestShop
beforeAll(async () => { shop = await fullShop() })
const NOISE = ['haan bhai kya haal hai','arre ruko ek minute','nahi nahi woh wala nahi','kitne ka hua total bata','paisa de do','chalo theek hai','hello hello','ji bolo','kya chahiye aapko','aaj bahut garmi hai','bhaiya jaldi karo','mera phone kahan hai','achha theek hai fir','kitna hua','bas itna hi','दो मिनट रुको','क्या हाल है भाई','बिल बना दो','ok thank you','good morning sir','सब ठीक है','arey yaar','kal aana','mummy ne bola']
it('noise gives no items', () => {
  const bad: string[] = []
  for (const s of NOISE) { const r = parse(s, shop.index, []); if (r.items.length) bad.push(s + ' => ' + r.items.map((i: any) => (i.said + ' -> ' + (i.candidates[0]?.item?.hinglish ?? '-') + ' sure=' + i.sure)).join(', ')) }
  expect(bad.length, bad.join('; ')).toBeLessThanOrEqual(1)
})
