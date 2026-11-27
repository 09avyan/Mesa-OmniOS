import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Icon } from '../components/Icon'
import { successFx, errorFx } from '../lib/feedback'
import { adb, call } from './admin/core'
import { Overview, Shops, ShopDrawer } from './admin/Parts'
import { Analytics } from './admin/Analytics'
import { Bags, Demand, Export, CreateStore } from './admin/More'

const KEY = 'omni-admin-theme'
type Mode = 'light' | 'dark'
const phoneMode = (): Mode => (typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
function savedMode(): Mode | null { try { const v = localStorage.getItem(KEY); return v === 'light' || v === 'dark' ? v : null } catch { return null } }

export function Admin() {
  const [saved, setSaved] = useState<Mode | null>(savedMode)
  const [sys, setSys] = useState<Mode>(phoneMode)
  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const m = matchMedia('(prefers-color-scheme: dark)'), f = () => setSys(m.matches ? 'dark' : 'light')
    m.addEventListener?.('change', f); return () => m.removeEventListener?.('change', f)
  }, [])
  const mode = saved ?? sys
  const toggle = () => { const n: Mode = mode === 'dark' ? 'light' : 'dark'; setSaved(n); try { localStorage.setItem(KEY, n) } catch { /* private mode */ } }

  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    adb.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true) })
    const { data: sub } = adb.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])
  useEffect(() => {
    if (!session) { setIsAdmin(false); return }
    adb.from('admins').select('user_id').maybeSingle().then(({ data }) => setIsAdmin(!!data))
  }, [session])

  return (
    <div className="admin adm" data-theme={mode}>
      {!ready ? <main className="ad-center"><p className="ad-meta">Loading…</p></main>
        : !session ? <AdminLogin mode={mode} toggle={toggle} />
        : !isAdmin ? <main className="ad-center"><h1>Admin only</h1><p className="ad-meta">This account is not an admin.</p><button className="ad-b" onClick={() => adb.auth.signOut()}>Log out</button></main>
        : <Dashboard mode={mode} toggle={toggle} />}
    </div>
  )
}

function AdminLogin({ mode, toggle }: { mode: Mode; toggle: () => void }) {
  const [m, setM] = useState<'login' | 'setup'>('login')
  const [email, setEmail] = useState(''), [pw, setPw] = useState(''), [code, setCode] = useState('')
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false), [note, setNote] = useState('')
  async function submit() {
    setErr(''); setBusy(true)
    try {
      if (m === 'setup') { await call('bootstrap', { email, password: pw, setup_code: code }); setNote('Admin created. Logging in…') }
      const { error } = await adb.auth.signInWithPassword({ email, password: pw })
      if (error) throw new Error('Email or password is wrong.')
      successFx()
    } catch (e) { errorFx(); setErr((e as Error).message) } finally { setBusy(false) }
  }
  return (
    <main className="ad-center">
      <form className="ad-card ad-login" onSubmit={(e) => { e.preventDefault(); if (email && pw && !busy) submit() }}>
        <h1>OmniOS Admin</h1>
        <p className="ad-meta">{m === 'login' ? 'Log in with your admin email.' : 'First-time setup: needs the setup code you saved in Supabase.'}</p>
        <label>Email<input className="ad-in" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Password{m === 'setup' && ' (10+ characters)'}<input className="ad-in" type="password" autoComplete={m === 'setup' ? 'new-password' : 'current-password'} value={pw} onChange={(e) => setPw(e.target.value)} /></label>
        {m === 'setup' && <label>Setup code<input className="ad-in" value={code} onChange={(e) => setCode(e.target.value)} /></label>}
        {err && <div className="ad-fail" role="alert">{err}</div>}
        {note && <p className="ad-meta">{note}</p>}
        <button type="submit" className="ad-b pri" disabled={busy || !email || !pw}>{busy ? 'Please wait…' : m === 'login' ? 'Log in' : 'Create admin'}</button>
        <button type="button" className="ad-b" onClick={() => { setM(m === 'login' ? 'setup' : 'login'); setErr('') }}>{m === 'login' ? 'First time? Set up admin' : 'Back to log in'}</button>
        <button type="button" className="ad-link" onClick={toggle}>{mode === 'dark' ? 'Light mode' : 'Dark mode'}</button>
      </form>
    </main>
  )
}

type View = 'overview' | 'shops' | 'bags' | 'demand' | 'analytics' | 'export' | 'create'
const NAV: { id: View; icon: string; label: string }[] = [
  { id: 'overview', icon: 'chart', label: 'Overview' }, { id: 'shops', icon: 'home', label: 'Shops' }, { id: 'bags', icon: 'bag', label: 'Bags' },
  { id: 'demand', icon: 'cart', label: 'Demand' }, { id: 'analytics', icon: 'box', label: 'Analytics' }, { id: 'export', icon: 'doc', label: 'Export' },
]

function Dashboard({ mode, toggle }: { mode: Mode; toggle: () => void }) {
  const [view, setView] = useState<View>('overview')
  const [open, setOpen] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [msg, setMsg] = useState<{ t: string; bad: boolean } | null>(null)
  const [rev, setRev] = useState(0)
  const act = async (fn: () => Promise<unknown>, done: string) => {
    setMsg(null)
    try { await fn(); successFx(); setMsg({ t: done, bad: false }); setRev((x) => x + 1) } catch (e) { errorFx(); setMsg({ t: (e as Error).message, bad: true }) }
  }
  useEffect(() => { if (msg && !msg.bad) { const t = setTimeout(() => setMsg(null), 6000); return () => clearTimeout(t) } }, [msg])
  const go = (v: string) => { setView(v as View); setOpen(null) }
  const title = view === 'create' ? 'New shop' : NAV.find((n) => n.id === view)?.label
  return (
    <div className="ad-shell">
      <nav className="ad-side" aria-label="Admin sections">
        <div className="ad-brand">OmniOS Admin</div>
        {NAV.map((n) => <button key={n.id} className={`ad-nav ${view === n.id ? 'on' : ''}`} aria-current={view === n.id ? 'page' : undefined} onClick={() => go(n.id)}><Icon name={n.icon} size={20} /><span>{n.label}</span></button>)}
        <button className="ad-nav ad-out" onClick={() => adb.auth.signOut()}><Icon name="out" size={20} /><span>Log out</span></button>
      </nav>
      <main className="ad-main">
        <div className="ad-bar">
          <h1>{title}</h1>
          <button className="ad-b" onClick={toggle} aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>{mode === 'dark' ? 'Light' : 'Dark'}</button>
        </div>
        {msg && <div className={msg.bad ? 'ad-fail' : 'ad-ok'} role="status">{msg.t}</div>}
        <div className="ad-page">
          {view === 'overview' && <Overview key={rev} open={setOpen} go={go} />}
          {view === 'shops' && <Shops key={rev} open={setOpen} q={q} setQ={setQ} create={() => go('create')} />}
          {view === 'create' && <CreateStore act={act} onDone={() => go('shops')} />}
          {view === 'bags' && <Bags act={act} />}
          {view === 'demand' && <Demand act={act} />}
          {view === 'analytics' && <Analytics />}
          {view === 'export' && <Export act={act} />}
        </div>
      </main>
      {open && <ShopDrawer id={open} close={() => setOpen(null)} act={async (f, d) => { await act(f, d) }} />}
    </div>
  )
}
