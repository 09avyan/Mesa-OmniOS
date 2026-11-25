import { describe, expect, it } from 'vitest'
import { pickBest, scoreParsed } from '../pickBest'
import { parse } from '../parse'
import { catalogIndex as idx } from '../catalog'

const known = ['Sharma ji', 'Ramesh']

describe('pickBest', () => {
  it('prefers the reading where every word is a known item', () => {
    const b = pickBest(['2 kilo sheeni 1 magi', '2 kilo cheeni 1 maggi'], idx, known)!
    expect(b.text).toBe('2 kilo cheeni 1 maggi')
  })
  it('prefers a known customer over a mis-heard name', () => {
    const b = pickBest(['sharmaji 2 kilo cheeni', 'karma ji 2 kilo cheeni'], idx, known)!
    expect(b.parsed.customer).toBe('Sharma ji')
  })
  it('a clear payment beats garbage', () => {
    const b = pickBest(['gupta ji ne', 'gupta ji ne 500 diye'], idx, known)!
    expect(b.parsed.intent).toBe('payment')
    expect(b.parsed.amount).toBe(500)
  })
  it('picks the reading with a quantity ("2 kilo" vs "to kilo" style splits)', () => {
    const b = pickBest(['cheeni kilo', 'cheeni 2 kilo'], idx, known)!
    expect(b.parsed.items[0].qty).toBe(2)
  })
  it('keeps the phone\'s first choice when readings score the same', () => {
    expect(pickBest(['2 kilo cheeni', '2 kilo chini'], idx, known)!.index).toBe(0)
  })
  it('skips empty/duplicate alternatives and returns null for none', () => {
    expect(pickBest(['', '  '], idx)).toBeNull()
    expect(pickBest(['1 maggi', '1 maggi'], idx)!.text).toBe('1 maggi')
  })
  it('scores: unknown words hurt, sure items and known customers help', () => {
    const good = scoreParsed(parse('sharma ji 2 kilo cheeni', idx, known), known)
    const bad = scoreParsed(parse('sharma ji 2 kilo zzqx', idx, known), known)
    expect(good).toBeGreaterThan(bad)
    expect(scoreParsed(parse('hmm', idx), [])).toBeLessThan(0)
  })
})
