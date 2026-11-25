import { useEffect, useState } from 'react'
import { createClient, type Session } from '@supabase/supabase-js'
import { SUPABASE_KEY, SUPABASE_URL } from '../lib/config'
import { Tap } from '../components/ui'
import { Icon } from '../components/Icon'
import { theme, setTheme, type Theme } from '../lib/prefs'
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
      <Tap className="btn outline" onClick={() => adb.auth.signOut()}>Log out</Tap>
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
    <main className="screen ad-login">
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
        <Tap className="btn outline small" style={{ width: '100%' }} onClick={() => { setMode(mode === 'login' ? 'setup' : 'login'); setErr('') }}>
          {mode === 'login' ? 'First time? Set up admin' : 'Back to log in'}
        </Tap>
      </div>
    </main>
  )
}

type View = 'stores' | 'create' | 'bags' | 'demand'
type SortKey = 'code' | 'name' | 'owner_name' | 'status' | 'created_at'
function Dashboard() {
  const [stores, setStores] = useState<Store[] | null>(null)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [view, setView] = useState<View>('stores')
  const [q, setQ] = useState('')
  const [flt, setFlt] = useState<'all' | 'active' | 'paused'>('all')
  const [sort, setSort] = useState<{ k: SortKey; asc: boolean }>({ k: 'created_at', asc: false })
  const [th, setTh] = useState<Theme>(theme())
  const load = () => call('list_stores').then((d) => setStores(d.stores)).catch((e) => setErr(e.message))
  useEffect(() => { load() }, [])

  async function act(fn: () => Promise<unknown>, done: string) {
    setErr(''); setMsg('')
    try { await fn(); successFx(); setMsg(done); load() } catch (e) { errorFx(); setErr((e as Error).message) }
  }
  const nextTheme = () => { const n: Theme = th === 'dark' ? 'light' : 'dark'; setTheme(n); setTh(n) }
  const active = (stores ?? []).filter((s) => s.status === 'active').length
  const shown = (stores ?? []).filter((s) => (flt === 'all' || (flt === 'active') === (s.status === 'active')) && (!q || `${s.code} ${s.name} ${s.owner_name ?? ''} ${s.phone ?? ''} ${s.area ?? ''}`.toLowerCase().includes(q.toLowerCase())))
    .sort((x, y) => { const a = String(x[sort.k] ?? ''), b = String(y[sort.k] ?? ''); return (sort.asc ? 1 : -1) * a.localeCompare(b) })
  const th2 = (k: SortKey, label: string) => <th><button className="ad-sort" onClick={() => setSort({ k, asc: sort.k === k ? !sort.asc : true })}>{label}{sort.k === k ? (sort.asc ? ' ↑' : ' ↓') : ''}</button></th>
  const NAV: { id: View; icon: string; label: string }[] = [
    { id: 'stores', icon: 'home', label: 'Stores' }, { id: 'create', icon: 'plus', label: 'New store' },
    { id: 'bags', icon: 'bag', label: 'Bag requests' }, { id: 'demand', icon: 'chart', label: 'Demand' },
  ]
  return (
    <div className="ad-shell">
      <nav className="ad-side" aria-label="admin">
        <div className="ad-brand">OmniOS Admin</div>
        {NAV.map((n) => <Tap key={n.id} className={`ad-nav ${view === n.id ? 'on' : ''}`} onClick={() => setView(n.id)}><Icon name={n.icon} size={22} />{n.label}</Tap>)}
        <Tap className="ad-nav ad-out" onClick={() => adb.auth.signOut()}><Icon name="out" size={22} />Log out</Tap>
      </nav>
      <main className="ad-main">
        <div className="ad-bar">
          <label className="ad-search"><Icon name="search" size={22} /><input placeholder="Search code, store, owner, phone" value={q} onChange={(e) => { setQ(e.target.value); setView('stores') }} /></label>
          <select className="ad-sel" aria-label="status" value={flt} onChange={(e) => { setFlt(e.target.value as typeof flt); setView('stores') }}>
            <option value="all">All stores</option><option value="active">Active</option><option value="paused">Paused</option>
          </select>
          <Tap className="ad-theme" onClick={nextTheme} aria-label="theme">{th === 'dark' ? 'Light' : 'Dark'}</Tap>
        </div>
        <div className="ad-kpi">
          <div><span>Stores</span><b>{stores ? stores.length : '…'}</b></div>
          <div><span>Active</span><b>{stores ? active : '…'}</b></div>
          <div><span>Paused</span><b>{stores ? stores.length - active : '…'}</b></div>
        </div>
        {err && <div className="err" style={{ marginBottom: 16 }}>{err}</div>}
        {msg && <div className="ad-msg" role="status">{msg}</div>}
        {view === 'create' && <CreateStore onCreate={(b) => { act(() => call('create_store', b), `Store ${b.code} created. Give the owner the code and PIN.`); setView('stores') }} />}
        {view === 'stores' && <>
          <h2 className="h2">Stores {stores && `(${shown.length})`}</h2>
          <div className="ad-box">
            {!stores ? <div className="skel" style={{ margin: '16px 0' }} /> : shown.length === 0 ? <p className="lab" style={{ padding: 16 }}>No stores.</p> : (
              <table className="table ad-sticky">
                <thead><tr>{th2('code', 'Code')}{th2('name', 'Store')}{th2('owner_name', 'Owner')}{th2('status', 'Status')}<th>Actions</th></tr></thead>
                <tbody>{shown.map((s) => <StoreRow key={s.id} s={s} act={act} />)}</tbody>
              </table>
            )}
          </div>
        </>}
        {view === 'bags' && stores && <AdminBags stores={stores} act={act} />}
        {view === 'demand' && stores && <AdminInterest />}
      </main>
    </div>
  )
}

function StoreRow({ s, act }: { s: Store; act: (fn: () => Promise<unknown>, done: string) => void }) {
  const [pin, setPin] = useState(''), [confirmDel, setConfirmDel] = useState('')
  const [open, setOpen] = useState<'' | 'pin' | 'del' | 'phones'>('')
  return (
    <>
      <tr>
        <td><b style={{ letterSpacing: 1 }}>{s.code}</b></td>
        <td>{s.name}<div className="lab" style={{ fontSize: 16 }}>{s.area ?? ''}</div></td>
        <td>{s.owner_name ?? '—'}<div className="lab" style={{ fontSize: 16 }}>{s.phone ?? ''}</div></td>
        <td><span className={`pill ${s.status === 'active' ? 'ok' : 'off'}`}>{s.status}</span></td>
        <td style={{ whiteSpace: 'nowrap' }}>
          <Tap className="ghost" onClick={() => { const v = prompt('Public store link name (a-z, 0-9, -), e.g. sharma-kirana-rajwada', '') ?? ''; if (v) act(async () => { const { error } = await adb.rpc('set_store_slug', { p_store: s.id, p_slug: v.trim().toLowerCase() }); if (error) throw new Error(error.message.includes('taken') ? 'That link is taken' : 'Link: 4-40 letters, numbers or -') }, `Link set: /s/${v.trim().toLowerCase()}`) }}>Store link</Tap>
          <Tap className="ghost" onClick={() => setOpen(open === 'phones' ? '' : 'phones')}>Phones</Tap>
          <Tap className="ghost" onClick={() => setOpen(open === 'pin' ? '' : 'pin')}>Reset PIN</Tap>
          <Tap className="ghost" onClick={() => act(() => call('set_status', { store_id: s.id, status: s.status === 'active' ? 'paused' : 'active' }), `${s.code} ${s.status === 'active' ? 'paused' : 'resumed'}.`)}>
            {s.status === 'active' ? 'Pause' : 'Resume'}
          </Tap>
          <Tap className="ghost dng" onClick={() => setOpen(open === 'del' ? '' : 'del')}>Delete</Tap>
        </td>
      </tr>
      {open === 'phones' && <tr><td colSpan={5}><AdminPhones storeId={s.id} act={act} /></td></tr>}
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
            <Tap className="btn small danger" disabled={confirmDel !== s.code} onClick={() => { act(() => call('delete_store', { store_id: s.id }), `${s.code} deleted.`); setOpen('') }}>Delete forever</Tap>
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
    <section className="ad-box">
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

function AdminPhones({ storeId, act }: { storeId: string; act: (fn: () => Promise<unknown>, done: string) => void }) {
  const [list, setList] = useState<{ id: string; label: string; last_seen: string }[] | null>(null)
  const [n, setN] = useState(0)
  useEffect(() => {
    adb.from('store_devices').select('id,label,last_seen').eq('store_id', storeId).eq('revoked', false).order('last_seen', { ascending: false })
      .then(({ data }) => setList(data ?? []))
  }, [storeId, n])
  if (!list) return <span className="lab">Loading…</span>
  if (!list.length) return <span className="lab">No phones logged in.</span>
  return <div className="stack">{list.map((d) => (
    <div key={d.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <span className="grow">{d.label} <span className="lab" style={{ fontSize: 16 }}>· last used {new Date(d.last_seen).toLocaleString('en-IN')}</span></span>
      <Tap className="ghost dng" onClick={() => act(async () => { const { error } = await adb.rpc('device_revoke', { p_id: d.id }); if (error) throw new Error(error.message); setN((x) => x + 1) }, 'Phone removed.')}>Remove</Tap>
    </div>))}</div>
}

function AdminBags({ stores, act }: { stores: Store[]; act: (fn: () => Promise<unknown>, done: string) => void }) {
  const [list, setList] = useState<{ id: string; store_id: string; qty: number; status: string; created_at: string }[] | null>(null)
  const [n, setN] = useState(0)
  useEffect(() => { adb.from('bag_requests').select('id,store_id,qty,status,created_at').order('created_at', { ascending: false }).limit(50).then(({ data }) => setList(data ?? [])) }, [n])
  const code = (id: string) => stores.find((s) => s.id === id)?.code ?? '?'
  const set = (id: string, status: string) => act(async () => { const { error } = await adb.from('bag_requests').update({ status, updated_at: new Date().toISOString() }).eq('id', id); if (error) throw new Error(error.message); setN((x) => x + 1) }, `Bag request marked ${status}.`)
  return <>
    <h2 className="h2">Bag requests {list && `(${list.filter((r) => r.status === 'new').length} new)`}</h2><div className="gap8" />
    <div className="ad-box">
      {!list ? <div className="skel" /> : !list.length ? <p className="lab" style={{ padding: 16 }}>No requests yet.</p> : (
        <table className="table"><thead><tr><th>Store</th><th>Bags</th><th>Asked</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{list.map((r) => <tr key={r.id}><td><b>{code(r.store_id)}</b></td><td>{r.qty}</td><td>{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
            <td><span className={`pill ${r.status === 'done' ? 'ok' : 'off'}`}>{r.status}</span></td>
            <td style={{ whiteSpace: 'nowrap' }}>{r.status === 'new' && <Tap className="ghost" onClick={() => set(r.id, 'sent')}>Sent</Tap>}{r.status !== 'done' && r.status !== 'cancelled' && <><Tap className="ghost" onClick={() => set(r.id, 'done')}>Delivered</Tap><Tap className="ghost dng" onClick={() => set(r.id, 'cancelled')}>Cancel</Tap></>}</td></tr>)}</tbody></table>
      )}
    </div>
  </>
}

function AdminInterest() {
  const [rows, setRows] = useState<[string, number][] | null>(null)
  useEffect(() => { adb.from('feature_interest').select('feature').then(({ data }) => {
    const m = new Map<string, number>(); (data ?? []).forEach((r) => m.set(r.feature, (m.get(r.feature) ?? 0) + 1))
    setRows([...m.entries()].sort((a, b) => b[1] - a[1]))
  }) }, [])
  return <>
    <h2 className="h2">Coming-soon demand ("I want this")</h2><div className="gap8" />
    <div className="ad-box">
      {!rows ? <div className="skel" /> : !rows.length ? <p className="lab">No votes yet.</p> : rows.map(([f, c]) => <div key={f} className="linkrow" style={{ color: 'var(--ink)' }}><span>{f}</span><b>{c} store{c > 1 ? 's' : ''}</b></div>)}
    </div>
  </>
}
