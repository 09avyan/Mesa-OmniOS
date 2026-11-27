import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_KEY, SUPABASE_URL } from '../../lib/config'

// Admin has its own login session, separate from any shop logged in on the same phone.
export const adb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, storageKey: 'omni-admin' } })

export async function call(action: string, body: object = {}) {
  const { data, error } = await adb.functions.invoke('admin', { body: { action, ...body } })
  if (error) {
    let msg = error.message
    try { msg = (await (error as { context?: Response }).context?.json())?.error ?? msg } catch { /* keep msg */ }
    throw new Error(msg)
  }
  return data
}

export const inr = (n: number | string | null | undefined) => '₹' + Math.round(Number(n ?? 0)).toLocaleString('en-IN')
export const inrShort = (n: number) => { const a = Math.abs(n); return a >= 1e7 ? `₹${(n / 1e7).toFixed(2)}Cr` : a >= 1e5 ? `₹${(n / 1e5).toFixed(2)}L` : inr(n) }
export const dt = (s?: string | null) => s ? new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—'
export const dd = (s?: string | null) => s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
export function ago(s?: string | null) {
  if (!s) return 'never'
  const m = Math.max(0, (Date.now() - new Date(s).getTime()) / 60000)
  if (m < 2) return 'just now'
  if (m < 60) return `${Math.floor(m)} min ago`
  if (m < 1440) return `${Math.floor(m / 60)} hr ago`
  return `${Math.floor(m / 1440)} d ago`
}

export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [err, setErr] = useState('')
  const [n, setN] = useState(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps)
  useEffect(() => {
    let live = true
    setErr('')
    run().then((d) => { if (live) setData(d) }).catch((e) => { if (live) setErr((e as Error).message || 'Could not load') })
    return () => { live = false }
  }, [run, n])
  const reload = () => { setData(null); setN((x) => x + 1) }
  return { data, err, reload, silent: () => setN((x) => x + 1) }
}

// Skeleton while loading, message + retry when it fails, children once data exists.
export function Load<T>({ s, rows = 4, children }: { s: { data: T | null; err: string; reload: () => void }; rows?: number; children: (d: T) => ReactNode }) {
  if (s.err) return <div className="ad-fail" role="alert"><span>{s.err}</span><button className="ad-b" onClick={s.reload}>Try again</button></div>
  if (!s.data) return <div className="ad-skel" aria-busy="true">{Array.from({ length: rows }, (_, i) => <i key={i} />)}</div>
  return <>{children(s.data)}</>
}

export type Act = (fn: () => Promise<unknown>, done: string) => Promise<void>
