import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { invalidateShop } from './shop'

// Bills made while the net is down wait here (this phone's localStorage) and go to save_bill later.
// Each carries a client_key, so a retry can never save the same bill twice (the server dedupes on it).
const KEY = 'omni-bill-queue'
type Queued = { key: string; payload: Record<string, unknown>; at: number }

const read = (): Queued[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] } }
const write = (q: Queued[]) => { try { localStorage.setItem(KEY, JSON.stringify(q)) } catch { /* storage full or blocked: nothing more we can do */ } window.dispatchEvent(new Event('omni-queue')) }

export const newClientKey = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`)
export const queuedCount = () => read().length
export function enqueueBill(payload: Record<string, unknown> & { client_key: string }) {
  const q = read()
  if (!q.some((x) => x.key === payload.client_key)) q.push({ key: payload.client_key, payload, at: Date.now() })
  write(q)
}
/** true when a failed call looks like "no internet" rather than a server refusal */
export const isOffline = (e: { message?: string } | null | undefined) =>
  !!e && (typeof navigator !== 'undefined' && navigator.onLine === false || /failed to fetch|networkerror|network request|load failed|fetch/i.test(e.message ?? ''))

let flushing = false
/** Try every waiting bill once, oldest first. Stops at the first failure. Returns how many were saved. */
export async function flushQueue(): Promise<number> {
  if (flushing) return 0
  flushing = true
  let saved = 0
  try {
    for (const item of read()) {
      const { error } = await supabase.rpc('save_bill', { p: item.payload })
      if (error) break // offline, or not signed in yet: keep the bill (never throw one away) and try again later
      write(read().filter((x) => x.key !== item.key))
      saved++
    }
  } finally { flushing = false }
  if (saved) invalidateShop()
  return saved
}

/** Count of waiting bills; retries when the app opens and when the net comes back. */
export function useQueued() {
  const [n, setN] = useState(queuedCount())
  useEffect(() => {
    const sync = () => setN(queuedCount())
    const go = () => { if (queuedCount()) flushQueue().then(sync) }
    window.addEventListener('omni-queue', sync); window.addEventListener('online', go)
    go()
    return () => { window.removeEventListener('omni-queue', sync); window.removeEventListener('online', go) }
  }, [])
  return n
}

/** Call once at start-up: retry when the app opens (after sign-in is restored) and whenever the net returns. */
export function startQueueSync() {
  const go = () => { if (queuedCount()) flushQueue() }
  window.addEventListener('online', go)
  setTimeout(go, 3000)
}
