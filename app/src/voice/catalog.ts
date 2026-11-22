import raw from '../../../supabase/seed/catalog.json'
import { buildIndex, type Matchable } from './match'

export const CATALOG = raw as Matchable[]
export const catalogIndex = buildIndex(CATALOG)
