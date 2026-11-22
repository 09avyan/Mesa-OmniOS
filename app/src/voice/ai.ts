import { supabase } from '../lib/supabase'
import { isSure, matchName, type MatchIndex } from './match'
import type { Parsed } from './parse'
import type { Unit } from './normalize'

type AiOut = { intent: Parsed['intent'] | 'return'; customer: string | null; amount: number | null; items: { name: string; qty: number | null; unit: Unit | null; rupees: number | null }[] }

/** Rules weren't sure: ask Gemini (server side) for structure, then match items locally. Null if unavailable. */
export async function askAi(text: string, idx: MatchIndex, customers: string[]): Promise<Parsed | null> {
  try {
    const { data, error } = await supabase.functions.invoke('understand', { body: { text, customers } })
    if (error || !data || (data as { error?: string }).error) return null
    const a = data as AiOut
    const items = (a.items ?? []).map((i) => {
      const said = i.name.toLowerCase().trim()
      const candidates = matchName(said, idx)
      return { said, qty: i.qty, unit: i.unit, rupees: i.rupees, candidates, sure: isSure(said, candidates, idx) }
    })
    const known = a.customer ? customers.find((c) => c.toLowerCase() === a.customer!.toLowerCase()) : undefined
    return {
      intent: a.intent === 'return' ? 'unknown' : a.intent, text, customer: known ?? a.customer, customerSure: !a.customer || !!known,
      items, amount: a.amount, sure: false,
    }
  } catch { return null }
}

/** Should we ask the AI? Only when the rules clearly struggled. */
export const needsAi = (p: Parsed) =>
  p.intent === 'unknown' || p.items.some((i) => i.candidates.length === 0) || (p.intent === 'bill' && !p.customerSure)
