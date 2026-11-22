import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type Store = { id: string; code: string; name: string; upi_id: string | null; owner_name: string | null; language: 'hi' | 'hinglish' | 'en'; status: string }
type State = { session: Session | null; store: Store | null; ready: boolean; storeMissing: boolean; reload: () => void }
const Ctx = createContext<State>({ session: null, store: null, ready: false, storeMissing: false, reload: () => {} })

export function StoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [store, setStore] = useState<Store | null>(null)
  const [ready, setReady] = useState(false)
  const [storeMissing, setMissing] = useState(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); if (!data.session) setReady(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); if (!s) { setStore(null); setReady(true) } })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    let live = true
    setReady(false)
    supabase.from('stores').select('id,code,name,owner_name,language,status,upi_id').maybeSingle().then(({ data }) => {
      if (!live) return
      setStore(data as Store | null); setMissing(!data); setReady(true)
      if (data) logUsage(data.id, 'open')
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
