import { describe, expect, it } from 'vitest'
import { parse, rangeOf, plan } from '../assistant'

const NOW = new Date(2026, 10, 27) // Fri 27 Nov 2026
const q = (s: string) => parse(s, NOW)

describe('assistant parse', () => {
  const cases: [string, string, string?][] = [
    ['Aaj kitna bika?', 'sales'],
    ['kal ki bikri', 'sales'],
    ['is mahine ka total', 'sales'],
    ['Sharma ji ka udhaar kitna hai', 'customer_balance', 'sharma'],
    ['sabka udhaar', 'top_debtors'],
    ['kis kis ka udhaar baaki hai', 'top_debtors'],
    ['Kya kya khatam ho raha hai', 'low_stock'],
    ['cheeni kitni bachi', 'item_stock', 'cheeni'],
    ['sabse zyada kya bika is hafte', 'top_items'],
    ['galla mein kitna hona chahiye', 'cash_expected'],
    ['maggi ka last rate', 'last_price', 'maggi'],
    ['kaun sa maal nahi bik raha', 'slow_items'],
    ['kitne bill bane aaj', 'bill_count'],
    ['kab sabse zyada bheed hoti hai', 'busiest_hour'],
    ['udhaar kitna wapas aaya', 'udhaar_collected'],
    ['profit kitna hua', 'profit'],
    ['online order aaye kya', 'online_orders'],
    ['गुप्ता जी का हिसाब', 'customer_history'],
    ['आज कितना बिका', 'sales'],
    ['supplier ko kitna dena hai', 'supplier_due'],
  ]
  for (const [text, intent, name] of cases) {
    it(`${text} -> ${intent}`, () => {
      const r = q(text)
      expect(r?.intent).toBe(intent)
      if (name) expect(r?.name).toContain(name)
    })
  }
  it('unknown -> null', () => expect(q('mausam kaisa hai')).toBeNull())
  it('ranges', () => {
    expect(rangeOf('kal', NOW)).toMatchObject({ from: '2026-11-26', to: '2026-11-26' })
    expect(rangeOf('is hafte', NOW)).toMatchObject({ from: '2026-11-23', to: '2026-11-27' })
    expect(rangeOf('pichle hafte', NOW)).toMatchObject({ from: '2026-11-16', to: '2026-11-22' })
    expect(rangeOf('pichle mahine', NOW)).toMatchObject({ from: '2026-10-01', to: '2026-10-31' })
  })
  it('plan', () => expect(plan(q('Aaj kitna bika')!)).toEqual({ fn: 'ask_sales', args: { p_from: '2026-11-27', p_to: '2026-11-27' } }))
})
