import { supabase } from './supabase'

// Must match supabase/functions/admin/index.ts
export const storeEmail = (code: string) => `${code.trim().toLowerCase()}@store.omnidukaan.app`
export const storePassword = (code: string, pin: string) => `omni-${code.trim().toUpperCase()}-${pin}`

export type LoginResult = 'ok' | 'wrong' | 'offline'

export async function storeLogin(code: string, pin: string): Promise<LoginResult> {
  if (!navigator.onLine) return 'offline'
  const { error } = await supabase.auth.signInWithPassword({ email: storeEmail(code), password: storePassword(code, pin) })
  if (!error) return 'ok'
  return error.status === 400 || error.status === 401 ? 'wrong' : 'offline'
}
