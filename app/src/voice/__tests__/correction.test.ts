import { describe, expect, it } from 'vitest'
import { correctionRest, isConfirm } from '../correction'
describe('spoken corrections', () => {
  it('nahi X', () => { expect(correctionRest('nahi cheeni')).toBe('cheeni'); expect(correctionRest('nahi nahi maggi masala')).toBe('maggi masala'); expect(correctionRest('wo nahi atta')).toBe('atta') })
  it('X nahi Y', () => expect(correctionRest('atta nahi maida')).toBe('maida'))
  it('hindi', () => expect(correctionRest('नहीं चीनी')).toBe('chini'.length ? 'चीनी' : ''))
  it('bare negation', () => expect(correctionRest('nahi')).toBe(''))
  it('not a correction', () => { expect(correctionRest('do kilo cheeni')).toBeNull(); expect(correctionRest('cheeni nahi')).toBeNull() })
  it('confirm', () => { expect(isConfirm('haan')).toBe(true); expect(isConfirm('sahi hai')).toBe(true); expect(isConfirm('haan do kilo cheeni')).toBe(false) })
})
