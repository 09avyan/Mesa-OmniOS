import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { deviceKey, deviceLabel } from './auth'

export type Store = { id: string; code: string; name: string; upi_id: string | null; owner_name: string | null; language: 'hi' | 'hinglish' | 'en'; status: string }
type State = { session: Session | null; store: Store | null; ready: boolean; storeMissing: boolean; reload: () => void }
const Ctx = createContext<State>({ session: null, store: null, ready: false, storeMissing: false, reload: () => {} })

export function StoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  // Last known shop: Home can paint at once while the fresh copy loads (a paused / removed shop is still caught right after).
  const cached = (() => { try { return JSON.parse(localStorage.getItem('omni-store') ?? 'null') as Store | null } catch { return null } })()
  const [store, setStore] = useState<Store | null>(cached)
  const [ready, setReady] = useState(false)
  const [storeMissing, setMissing] = useState(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); if (!data.session) setReady(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); if (!s) { setStore(null); setReady(true); try { localStorage.removeItem('omni-store') } catch { /* ignore */ } } })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    let live = true
    if (store) setReady(true); else setReady(false)
    supabase.from('stores').select('id,code,name,owner_name,language,status,upi_id').maybeSingle().then(({ data }) => {
      if (!live) return
      setStore(data as Store | null); setMissing(!data); setReady(true)
      try { if (data) localStorage.setItem('omni-store', JSON.stringify(data)); else localStorage.removeItem('omni-store') } catch { /* ignore */ }
      if (data) logUsage(data.id, 'open')
    })
    // removed from "Phones logged in" (or PIN reset) → log this phone out
    supabase.rpc('device_ping', { p_label: deviceLabel(), p_key: deviceKey() }).then(({ data, error }) => {
      if (live && !error && data === false) { try { sessionStorage.setItem('omni-removed', '1') } catch { /* ignore */ } supabase.auth.signOut({ scope: 'local' }) }
    })
    return () => { live = false }
  }, [session, tick])

  return <Ctx.Provider value={{ session, store, ready, storeMissing, reload: () => setTick((n) => n + 1) }}>{children}</Ctx.Provider>
}
export const useStore = () => useContext(Ctx)

// Count real usage for the admin dashboard; never blocks the owner.
export function logUsage(storeId: string, kind: string, meta?: object) {
  supabase.from('usage_events').insert({ store_id: storeId, kind, meta: meta ?? null }).then(() => {})
}
