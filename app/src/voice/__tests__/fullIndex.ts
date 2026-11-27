// Test helper: the same index the app builds in lib/shop.ts (catalogue + Universe items the catalogue lacks), without a database.
import { readFileSync } from 'node:fs'
import { buildIndex, type MatchIndex } from '../match'
import { fold } from '../normalize'
import { CATALOG } from '../catalog'
import { loadUniverse, universeMatchables } from '../../lib/universe'
import type { ShopMatchable } from '../../lib/shop'

export type TestShop = { index: MatchIndex; byMatchId: Map<string, ShopMatchable>; flavour: Record<string, string[]>; customers: never[]; items: never[]; shopKey: string }
let cached: Promise<TestShop> | null = null
export function fullShop(): Promise<TestShop> {
  return (cached ??= (async () => {
    const pub = new URL('../../../public', import.meta.url).pathname
    const real = globalThis.fetch
    globalThis.fetch = (async (u: string) => ({ json: async () => JSON.parse(readFileSync(pub + u, 'utf8')) })) as unknown as typeof fetch
    try { await loadUniverse() } finally { globalThis.fetch = real }
    const list: ShopMatchable[] = CATALOG.map((c) => ({ ...c })) as ShopMatchable[]
    const known = new Set(list.flatMap((m) => [m.hinglish, m.en, m.hi, ...m.aliases].map((a) => fold(a.toLowerCase().trim()))))
    for (const u of universeMatchables()) {
      if ([u.hinglish, u.en, u.hi].some((a) => known.has(fold(a.toLowerCase().trim())))) continue
      list.push({ ...u } as ShopMatchable)
    }
    return { index: buildIndex(list), byMatchId: new Map(list.map((m) => [m.id, m])), flavour: {}, customers: [], items: [], shopKey: 'test' }
  })())
}
