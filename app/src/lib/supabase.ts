import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY)

// Store logins are Supabase users with a derived email/password: code + 4-digit PIN.
export const storeEmail = (code: string) => `${code.toLowerCase()}@store.omnios.app`
export const storePassword = (code: string, pin: string) => `omni-${code.toLowerCase()}-${pin}`

export async function logUsage(kind: string) {
  const { data } = await supabase.rpc('my_store_id')
  if (data) await supabase.from('usage_events').insert({ store_id: data, kind })
}
