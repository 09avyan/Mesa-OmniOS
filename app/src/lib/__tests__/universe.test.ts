import { beforeAll, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { findInUniverse, loadUniverse, universeMatchables } from '../universe'
import { buildIndex, matchName } from '../../voice/match'

const pub = join(__dirname, '../../../public')
const src = JSON.parse(readFileSync(join(__dirname, '../../../../supabase/seed/universe.json'), 'utf8')) as { items: { id: string; variants?: { id: string; default?: boolean }[] }[] }

beforeAll(async () => {
  // serve the built files from disk instead of the network
  globalThis.fetch = (async (u: string) => ({ json: async () => JSON.parse(readFileSync(join(pub, u), 'utf8')) })) as unknown as typeof fetch
  await loadUniverse()
})

describe('universe data', () => {
  it('has 750 distinct top-level items; variants are not counted', () => {
    expect(src.items).toHaveLength(750)
    expect(new Set(src.items.map((i) => i.id)).size).toBe(750)
    expect(src.items.reduce((n, i) => n + (i.variants?.length ?? 0), 0)).toBeGreaterThan(1000)
  })
  it('every item with variants has exactly one default and unique variant ids', () => {
    for (const it of src.items.filter((i) => i.variants)) {
      expect(it.variants!.filter((v) => v.default), it.id).toHaveLength(1)
      expect(new Set(it.variants!.map((v) => v.id)).size, it.id).toBe(it.variants!.length)
    }
  })
})

describe('universe variants', () => {
  it('saying only the item name gives the default variant', () => {
    const [m] = findInUniverse('maggi chhota')
    expect(m.variant?.hinglish).toBe('Masala')
    expect(m.variants.length).toBeGreaterThan(5)
  })
  it('"<item> <flavour>" and "<flavour> <item>" find that flavour, by name or alias', () => {
    expect(findInUniverse('maggi atta masala')[0].variant?.hinglish).toBe('Atta Masala')
    expect(findInUniverse('maggi atta noodles')[0].variant?.hinglish).toBe('Atta Masala')
    expect(findInUniverse('chicken maggi')[0].variant?.hinglish).toBe('Chicken')
    expect(findInUniverse('lays magic masala')[0].variant?.hinglish).toBe('Magic Masala')
  })
  it('items without variants have none', () => {
    const [s] = findInUniverse('sattu')
    expect(s.variants).toEqual([]); expect(s.variant).toBeNull()
  })
  it('voice matcher: parent name -> default entry, flavour phrase -> that flavour entry', () => {
    const idx = buildIndex(universeMatchables())
    expect(matchName('maggi chhota', idx)[0].id).toBe('u:maggi-70')
    const chicken = matchName('maggi chhota chicken', idx)[0]
    expect(chicken.id).toBe('u:maggi-70:chicken')
    expect(chicken.item.hinglish).toBe('Maggi chhota Chicken')
    expect(matchName('maggi masala', idx)[0].id).toBe('u:maggi-70') // default variant = the item entry itself
    expect(matchName('coca cola zero sugar', idx)[0].id).toBe('u:coca-cola:zero-sugar')
  })
})
