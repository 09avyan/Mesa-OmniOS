import { useEffect, useState } from 'react'
import { createClient, type Session } from '@supabase/supabase-js'
import { SUPABASE_KEY, SUPABASE_URL } from '../lib/config'
import { Tap } from '../components/ui'
import { successFx, errorFx } from '../lib/feedback'

// Admin lives at /admin with its own login session, separate from any shop logged in on the same phone.
const adb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, storageKey: 'omni-admin' } })

type Store = { id: string; code: string; name: string; owner_name: string | null; phone: string | null; area: string | null; language: string; status: string; created_at: string }

async function call(action: string, body: object = {}) {
  const { data, error } = await adb.functions.invoke('admin', { body: { action, ...body } })
  if (error) {
    let msg = error.message
    try { msg = (await (error as { context?: Response }).context?.json())?.error ?? msg } catch { /* keep msg */ }
    throw new Error(msg)
  }
  return data
}

export function Admin() {
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

  if (!ready) return <main className="screen"><p className="lab">Loading…</p></main>
  return (
    <div className="admin">
      {!session ? <AdminLogin /> : !isAdmin ? <NotAdmin /> : <Dashboard />}
    </div>
  )
}

function NotAdmin() {
  return (
    <main className="screen">
      <h1 className="h1">Admin only</h1><div className="gap16" />
      <p className="lab">This account is not an admin.</p><div className="gap24" />
      <Tap className="btn quiet" onClick={() => adb.auth.signOut()}>Log out</Tap>
    </main>
  )
}

function AdminLogin() {
  const [mode, setMode] = useState<'login' | 'setup'>('login')
  const [email, setEmail] = useState(''), [pw, setPw] = useState(''), [code, setCode] = useState('')
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false), [note, setNote] = useState('')

  async function submit() {
    setErr(''); setBusy(true)
    try {
      if (mode === 'setup') { await call('bootstrap', { email, password: pw, setup_code: code }); setNote('Admin created. Logging in…') }
      const { error } = await adb.auth.signInWithPassword({ email, password: pw })
      if (error) throw new Error('Email or password is wrong.')
      successFx()
    } catch (e) { errorFx(); setErr((e as Error).message) } finally { setBusy(false) }
  }
  return (
    <main className="screen" style={{ maxWidth: 480 }}>
      <div style={{ height: 32 }} />
      <h1 className="h1">OmniOS Admin</h1>
      <p className="lab">{mode === 'login' ? 'Log in with your admin email.' : 'First-time setup: needs the setup code you saved in Supabase.'}</p>
      <div className="gap24" />
      <div className="stack" style={{ gap: 16 }}>
        <div className="field"><label>Email</label><input className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field"><label>Password{mode === 'setup' && ' (10+ characters)'}</label><input className="input" type="password" autoComplete={mode === 'setup' ? 'new-password' : 'current-password'} value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        {mode === 'setup' && <div className="field"><label>Setup code</label><input className="input" value={code} onChange={(e) => setCode(e.target.value)} /></div>}
        {err && <div className="err">{err}</div>}
        {note && <p className="lab">{note}</p>}
        <Tap className="btn primary" disabled={busy || !email || !pw} onClick={submit}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create admin'}</Tap>
        <Tap className="btn quiet small" style={{ width: '100%' }} onClick={() => { setMode(mode === 'login' ? 'setup' : 'login'); setErr('') }}>
          {mode === 'login' ? 'First time? Set up admin' : 'Back to log in'}
        </Tap>
      </div>
    </main>
  )
}

function Dashboard() {
  const [stores, setStores] = useState<Store[] | null>(null)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const load = () => call('list_stores').then((d) => setStores(d.stores)).catch((e) => setErr(e.message))
  useEffect(() => { load() }, [])

  async function act(fn: () => Promise<unknown>, done: string) {
    setErr(''); setMsg('')
    try { await fn(); successFx(); setMsg(done); load() } catch (e) { errorFx(); setErr((e as Error).message) }
  }

  return (
    <main className="screen">
      <div className="top">
        <span className="title">OmniOS Admin</span>
        <Tap className="ghost" onClick={() => adb.auth.signOut()}>Log out</Tap>
      </div>
      {err && <><div className="err">{err}</div><div className="gap16" /></>}
      {msg && <><div className="card" style={{ padding: '12px 16px', background: 'var(--acs)', color: 'var(--ac)', fontWeight: 700 }}>{msg}</div><div className="gap16" /></>}
      <CreateStore onCreate={(b) => act(() => call('create_store', b), `Store ${b.code} created. Give the owner the code and PIN.`)} />
      <div className="gap24" />
      <h2 className="h2">Stores {stores && `(${stores.length})`}</h2>
      <div className="gap8" />
      <div className="card" style={{ padding: '8px 16px', overflowX: 'auto' }}>
        {!stores ? <div className="skel" style={{ margin: '16px 0' }} /> : stores.length === 0 ? <p className="lab" style={{ padding: 16 }}>No stores yet.</p> : (
          <table className="table">
            <thead><tr><th>Code</th><th>Store</th><th>Owner</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{stores.map((s) => <StoreRow key={s.id} s={s} act={act} />)}</tbody>
          </table>
        )}
      </div>
    </main>
  )
}

function StoreRow({ s, act }: { s: Store; act: (fn: () => Promise<unknown>, done: string) => void }) {
  const [pin, setPin] = useState(''), [confirmDel, setConfirmDel] = useState('')
  const [open, setOpen] = useState<'' | 'pin' | 'del'>('')
  return (
    <>
      <tr>
        <td><b style={{ letterSpacing: 1 }}>{s.code}</b></td>
        <td>{s.name}<div className="lab" style={{ fontSize: 16 }}>{s.area ?? ''}</div></td>
        <td>{s.owner_name ?? '—'}<div className="lab" style={{ fontSize: 16 }}>{s.phone ?? ''}</div></td>
        <td><span className={`pill ${s.status === 'active' ? 'ok' : 'off'}`}>{s.status}</span></td>
        <td style={{ whiteSpace: 'nowrap' }}>
          <Tap className="ghost" onClick={() => { const v = prompt('Public store link name (a-z, 0-9, -), e.g. sharma-kirana-rajwada', '') ?? ''; if (v) act(() => call('set_slug', { store_id: s.id, slug: v.trim().toLowerCase() }), `Link set: /s/${v.trim().toLowerCase()}`) }}>Store link</Tap>
          <Tap className="ghost" onClick={() => setOpen(open === 'pin' ? '' : 'pin')}>Reset PIN</Tap>
          <Tap className="ghost" onClick={() => act(() => call('set_status', { store_id: s.id, status: s.status === 'active' ? 'paused' : 'active' }), `${s.code} ${s.status === 'active' ? 'paused' : 'resumed'}.`)}>
            {s.status === 'active' ? 'Pause' : 'Resume'}
          </Tap>
          <Tap className="ghost" style={{ color: 'var(--danger)' }} onClick={() => setOpen(open === 'del' ? '' : 'del')}>Delete</Tap>
        </td>
      </tr>
      {open === 'pin' && (
        <tr><td colSpan={5}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <input className="input" style={{ maxWidth: 160 }} inputMode="numeric" maxLength={4} placeholder="New PIN" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} />
            <Tap className="btn primary small" disabled={pin.length !== 4} onClick={() => { act(() => call('reset_pin', { store_id: s.id, pin }), `PIN for ${s.code} changed.`); setPin(''); setOpen('') }}>Save PIN</Tap>
          </div>
        </td></tr>
      )}
      {open === 'del' && (
        <tr><td colSpan={5}>
          <p style={{ color: 'var(--danger)', fontWeight: 600 }}>Deletes this store and all its data. Cannot be undone. Type {s.code} to confirm.</p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
            <input className="input" style={{ maxWidth: 200 }} value={confirmDel} onChange={(e) => setConfirmDel(e.target.value.toUpperCase())} />
            <Tap className="btn small" style={{ background: 'var(--danger)', color: '#fff' }} disabled={confirmDel !== s.code} onClick={() => { act(() => call('delete_store', { store_id: s.id }), `${s.code} deleted.`); setOpen('') }}>Delete forever</Tap>
          </div>
        </td></tr>
      )}
    </>
  )
}

function CreateStore({ onCreate }: { onCreate: (b: { code: string; pin: string; name: string; owner_name: string; phone: string; area: string; language: string }) => void }) {
  const [f, setF] = useState({ code: '', pin: '', name: '', owner_name: '', phone: '', area: 'Indore', language: 'hinglish' })
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  const ok = /^[A-Z0-9]{4,8}$/.test(f.code) && /^\d{4}$/.test(f.pin) && f.name.trim().length >= 2
  return (
    <section className="card">
      <h2 className="h2">Create a store</h2><div className="gap16" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
        <div className="field"><label>Store code (4-8)</label><input className="input" value={f.code} maxLength={8} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} /></div>
        <div className="field"><label>4-digit PIN</label><input className="input" inputMode="numeric" maxLength={4} value={f.pin} onChange={(e) => setF({ ...f, pin: e.target.value.replace(/\D/g, '') })} /></div>
        <div className="field"><label>Store name</label><input className="input" value={f.name} onChange={set('name')} /></div>
        <div className="field"><label>Owner name</label><input className="input" value={f.owner_name} onChange={set('owner_name')} /></div>
        <div className="field"><label>Phone</label><input className="input" inputMode="tel" value={f.phone} onChange={set('phone')} /></div>
        <div className="field"><label>Area</label><input className="input" value={f.area} onChange={set('area')} /></div>
        <div className="field"><label>Language</label>
          <select className="input" value={f.language} onChange={set('language')}><option value="hinglish">Hinglish</option><option value="hi">Hindi</option><option value="en">English</option></select>
        </div>
      </div>
      <div className="gap16" />
      <Tap className="btn primary" disabled={!ok} onClick={() => { onCreate(f); setF({ ...f, code: '', pin: '', name: '', owner_name: '', phone: '' }) }}>Create store</Tap>
    </section>
  )
}
