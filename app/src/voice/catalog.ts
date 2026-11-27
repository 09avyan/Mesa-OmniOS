import raw from '../../../supabase/seed/catalog.json'
import { buildIndex, extendIndex, type Matchable } from './match'
import { fold } from './normalize'
import { warmUniverse, universeMatchables } from '../lib/universe'

export const CATALOG = raw as Matchable[]
export const catalogIndex = buildIndex(CATALOG)
// Universe (200+ items, grows each batch) joins the same index once loaded: saved copy first, network refresh after.
// Added in small chunks when the phone is idle, so start-up and typing never stutter.
const idle = (f: () => void) => (typeof requestIdleCallback === 'function' ? requestIdleCallback(f, { timeout: 500 }) : setTimeout(f, 0))
function addInChunks(items: Matchable[]) { let i = 0; const step = () => { extendIndex(catalogIndex, items.slice(i, i + 80)); i += 80; if (i < items.length) idle(step) }; idle(step) }
if (typeof window !== 'undefined' && typeof fetch !== 'undefined') warmUniverse(() => addInChunks(universeMatchables().filter(
  // skip Universe items the shop catalogue already knows by any name (no duplicate "which one?" questions)
  (u) => ![u.hinglish, u.en, u.hi, ...u.aliases].some((a) => catalogIndex.exact.has(fold(a.toLowerCase().trim()))))))
