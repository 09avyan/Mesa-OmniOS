import { supabase } from './supabase'

// Login goes through the server "login" function: it checks the PIN, locks the shop code
// for 10 minutes after 5 wrong PINs, and registers this phone in the logged-in phones list.
export type LoginResult = { kind: 'ok' } | { kind: 'wrong'; left?: number } | { kind: 'locked'; until: string } | { kind: 'offline' }

export function deviceLabel() {
  const ua = navigator.userAgent
  const os = /Android/i.test(ua) ? 'Android' : /iPhone|iPad/i.test(ua) ? 'iPhone' : /Windows/i.test(ua) ? 'Windows' : /Mac/i.test(ua) ? 'Mac' : 'Phone'
  const model = ua.match(/Android [\d.]+; ([^;)]+?)(?: Build|\))/)?.[1]?.trim()
  const br = /Edg\//.test(ua) ? 'Edge' : /SamsungBrowser/.test(ua) ? 'Samsung' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : ''
  return [model && model !== 'K' ? model : os, br].filter(Boolean).join(' · ')
}

export async function storeLogin(code: string, pin: string): Promise<LoginResult> {
  if (!navigator.onLine) return { kind: 'offline' }
  const { data, error } = await supabase.functions.invoke('login', { body: { code: code.trim().toUpperCase(), pin, label: deviceLabel() } })
  if (error || !data) return { kind: 'offline' }
  if (data.result === 'ok') {
    const { error: e } = await supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token })
    return e ? { kind: 'offline' } : { kind: 'ok' }
  }
  if (data.result === 'locked') return { kind: 'locked', until: data.until }
  if (data.result === 'wrong') return { kind: 'wrong', left: data.left }
  return { kind: 'offline' }
}
