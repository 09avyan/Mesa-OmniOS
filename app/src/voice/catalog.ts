import raw from '../../../supabase/seed/catalog.json'
import { buildIndex, extendIndex, type Matchable } from './match'
import { fold } from './normalize'
import { warmUniverse, universeMatchables } from '../lib/universe'

export const CATALOG = raw as Matchable[]
export const catalogIndex = buildIndex(CATALOG)
// Universe (200+ items, grows each batch) joins the same index once loaded: saved copy first, network refresh after.
if (typeof window !== 'undefined' && typeof fetch !== 'undefined') warmUniverse(() => extendIndex(catalogIndex, universeMatchables().filter(
  // skip Universe items the shop catalogue already knows by any name (no duplicate "which one?" questions)
  (u) => ![u.hinglish, u.en, u.hi, ...u.aliases].some((a) => catalogIndex.exact.has(fold(a.toLowerCase().trim()))))))
