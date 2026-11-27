import { describe, expect, it } from 'vitest'
import { addSegment, combineAlternatives, makeStabiliser, silenceFor, type Segment } from '../../lib/speech'
import { tokenize, extractPay } from '../normalize'

const join = (segs: Segment[]) => segs.map((s) => s[0]).join(' ')
const feed = (...parts: string[][]) => parts.reduce<Segment[]>((acc, p) => addSegment(acc, p), [])

describe('segments across restarts', () => {
  it('an identical phrase re-sent after a restart is dropped (alternatives merged)', () => {
    const s = feed(['2 kilo cheeni', '2 kilo chini'], ['2 kilo cheeni'])
    expect(join(s)).toBe('2 kilo cheeni')
  })
  it('a phrase that extends the previous one replaces it', () => {
    expect(join(feed(['2 kilo'], ['2 kilo cheeni']))).toBe('2 kilo cheeni')
  })
  it('overlapping words at the join are trimmed, new words are kept', () => {
    expect(join(feed(['2 kilo cheeni'], ['kilo cheeni 1 maggi']))).toBe('2 kilo cheeni 1 maggi')
  })
  it('different phrases are all kept (never lose words)', () => {
    expect(join(feed(['2 kilo cheeni'], ['1 maggi'], ['3 parle g']))).toBe('2 kilo cheeni 1 maggi 3 parle g')
  })
  it('empty phrases are ignored', () => { expect(feed(['2 kilo'], ['  '], [])).toHaveLength(1) })
})

describe('full-sentence alternatives', () => {
  it('best first, then one phrase swapped at a time, capped', () => {
    const alts = combineAlternatives([['2 kilo cheeni', '2 kilo chini'], ['1 maggi', '1 magi', '1 megi']])
    expect(alts[0]).toBe('2 kilo cheeni 1 maggi')
    expect(alts).toContain('2 kilo cheeni 1 magi')
    expect(alts).toContain('2 kilo chini 1 maggi')
    expect(new Set(alts).size).toBe(alts.length)
    expect(combineAlternatives([['a', 'b', 'c'], ['d', 'e', 'f'], ['g', 'h', 'i'], ['j', 'k', 'l', 'm', 'n']], 8).length).toBeLessThanOrEqual(8)
    expect(combineAlternatives([['x', 'y', 'z']], 1)).toEqual(['x'])
  })
  it('nothing heard -> no alternatives', () => { expect(combineAlternatives([])).toEqual([]) })
})

describe('silence', () => {
  it('waits longer when the sentence sounds unfinished', () => {
    expect(silenceFor('2 kilo cheeni', 4000)).toBe(4000)
    expect(silenceFor('2 kilo cheeni aur', 4000)).toBe(6000)
    expect(silenceFor('2 kilo', 4000)).toBe(6000)
    expect(silenceFor('sharma ji ka', 4000)).toBe(6000)
    expect(silenceFor('२ किलो चीनी और', 4000)).toBe(6000)
    expect(silenceFor('2 kilo cheeni de do', 4000)).toBe(4000)
  })
})

describe('transcript correction (normalize)', () => {
  it.each([
    ['मैगी', ['maggi']], ['सर्फ एक्सेल', ['surf', 'एक्सेल']], ['mag gi', ['maggi']], ['parley g', ['parle', 'g']], ['parle ji', ['parle', 'g']],
    ['coca-cola', ['coca', 'cola']], ['२ किलो', ['2', 'किलो']], ['to kilo cheeni', ['do', 'kilo', 'cheeni']], ['for kilo atta', ['char', 'kilo', 'atta']],
    ['chini', ['cheeni']], ['ata', ['atta']], ['के जी', ['केजी']],
  ])('%s', (s, want) => expect(tokenize(s)).toEqual(want))
  it('filler words are dropped, numbers and names kept', () => {
    expect(tokenize('ji haan 2 kilo cheeni dena aur 1 maggi chahiye')).toEqual(['2', 'kilo', 'cheeni', 'aur', '1', 'maggi'])
    expect(tokenize('2 kilo cheeni de do')).toEqual(['2', 'kilo', 'cheeni'])
    expect(tokenize('aur 2 kilo cheeni aur')).toEqual(['2', 'kilo', 'cheeni'])
    expect(tokenize('2 kilo cheeni likh do')).toEqual(['2', 'kilo', 'cheeni'])
    expect(tokenize('do kilo cheeni')).toEqual(['do', 'kilo', 'cheeni'])   // "do" stays the number 2
  })
  it('a homophone is only a number before a unit: "to" elsewhere is untouched', () => {
    expect(tokenize('to maggi')).toEqual(['to', 'maggi'])
  })
  it('extractPay strips the payment words and their postposition', () => {
    expect(extractPay(['2', 'kilo', 'cheeni', 'udhaar', 'mein'])).toEqual({ pay: 'udhaar', toks: ['2', 'kilo', 'cheeni'] })
    expect(extractPay(['cash', 'count', '500']).pay).toBeNull()
  })
})

describe('steady live words (interim stabiliser)', () => {
  const run = (...texts: string[]) => { const st = makeStabiliser(); return texts.map((t) => st.push(t)) }
  it('growing speech passes straight through, the last word may still change', () => {
    expect(run('2', '2 ki', '2 kilo', '2 kilo chee', '2 kilo cheeni')).toEqual(['2', '2 ki', '2 kilo', '2 kilo chee', '2 kilo cheeni'])
    expect(run('2 kilo sheen', '2 kilo cheeni')).toEqual(['2 kilo sheen', '2 kilo cheeni'])
  })
  it('an earlier word the phone changes its mind about does not flicker: it waits until the next update repeats it', () => {
    const out = run('to kilo cheeni', '2 kilo cheeni', '2 kilo cheeni 1')
    expect(out[0]).toBe('to kilo cheeni')
    expect(out[1]).toBe('to kilo cheeni')       // revision held back
    expect(out[2]).toBe('2 kilo cheeni 1')      // repeated -> accepted
  })
  it('a one-off wobble that is not repeated never shows', () => {
    expect(run('2 kilo cheeni 1', '2 kilo chini 1 maggi', '2 kilo cheeni 1 maggi')).toEqual(['2 kilo cheeni 1', '2 kilo cheeni 1', '2 kilo cheeni 1 maggi'])
  })
  it('a shorter update never makes shown words disappear', () => {
    expect(run('2 kilo cheeni 1 maggi', '2 kilo cheeni', '2 kilo cheeni 1 maggi 3')).toEqual(['2 kilo cheeni 1 maggi', '2 kilo cheeni 1 maggi', '2 kilo cheeni 1 maggi 3'])
  })
  it('the final reading always wins, and reset starts clean', () => {
    const st = makeStabiliser()
    st.push('to kilo cheeni'); expect(st.push('2 kilo cheeni', true)).toBe('2 kilo cheeni')
    st.reset(); expect(st.push('1 maggi')).toBe('1 maggi')
  })
  it('case and punctuation are not revisions', () => { expect(run('2 kilo Cheeni', '2 Kilo cheeni,', '2 kilo cheeni 1')).toEqual(['2 kilo Cheeni', '2 Kilo cheeni,', '2 kilo cheeni 1']) })
})
