// Owner-only dashboard. Plain English, desktop or phone.
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Copy, Download, KeyRound, Pause, Play, Plus, Trash2 } from 'lucide-react'

type Row = { code: string; name: string; area: string | null; status: string; created_at: string; bills: number; bills_per_day: number; receipts: number; voice: number; orders: number; udhaar: number; active_days: number; last_active: string | null }

async function call(body: object) {
  const { data, error } = await supabase.functions.invoke('admin', { body })
  if (error) { const j = await (error as any).context?.json?.().catch(() => null); throw new Error(j?.error ?? error.message) }
  return data
}

export default function Admin() {
  const [email, setEmail] = useState(''); const [pw, setPw] = useState('')
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [rows, setRows] = useState<Row[]>([])
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [f, setF] = useState({ code: '', name: '', owner_name: '', phone: '', area: '', pin: '' })

  const load = async () => {
    const { data: a } = await supabase.rpc('is_admin'); setIsAdmin(!!a)
    if (a) { const { data } = await supabase.rpc('admin_usage'); setRows((data ?? []) as Row[]) }
  }
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSignedIn(!!data.session); if (data.session) load() })
  }, [])

  const act = async (body: object, done: string) => {
    setMsg(null)
    try { await call(body); setMsg({ ok: true, text: done }); load() } catch (e) { setMsg({ ok: false, text: (e as Error).message }) }
  }

  const csv = () => {
    const head = ['code', 'name', 'area', 'status', 'created_at', 'bills', 'bills_per_day', 'receipts', 'voice', 'orders', 'udhaar', 'active_days', 'last_active'] as const
    const body = rows.map(r => head.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([[head.join(','), ...body].join('\n')], { type: 'text/csv' }))
    a.download = `omnios-usage-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
  }

  const active = rows.filter(r => r.status === 'active')
  const totalBills = rows.reduce((s, r) => s + Number(r.bills), 0)
  const pitch = `${active.length} kirana store${active.length === 1 ? '' : 's'} in Indore on OmniOS, ${totalBills} bills, ${rows.reduce((s, r) => s + Number(r.receipts), 0)} supplier receipts and ${rows.reduce((s, r) => s + Number(r.voice), 0)} voice entries recorded so far.`

  if (signedIn === null) return <div className="screen"><main className="content">Loading…</main></div>
  if (!signedIn) return (
    <div className="screen"><main className="content">
      <h1>OmniOS Admin</h1>
      {msg && <div className={msg.ok ? 'okmsg' : 'err'}>{msg.text}</div>}
      <label className="field">Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label className="field">Password<input type="password" value={pw} onChange={e => setPw(e.target.value)} /></label>
      <button className="btn primary full" onClick={async () => {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw })
        if (error) setMsg({ ok: false, text: error.message }); else { setSignedIn(true); load() }
      }}>Sign in</button>
    </main></div>
  )
  if (!isAdmin) return (
    <div className="screen"><main className="content">
      <div className="err">This account is not an admin.</div>
      <button className="btn full" onClick={async () => { await supabase.auth.signOut(); setSignedIn(false) }}>Sign out</button>
    </main></div>
  )

  return (
    <div className="screen" style={{ maxWidth: 1100 }}><main className="content">
      <div className="row" style={{ alignItems: 'center' }}><h1>OmniOS Admin</h1>
        <button className="btn small" style={{ flex: 0 }} onClick={async () => { await supabase.auth.signOut(); setSignedIn(false) }}>Sign out</button></div>
      {msg && <div className={msg.ok ? 'okmsg' : 'err'}>{msg.text}</div>}

      <section className="panel"><h2>Pitch line</h2><p className="big">{pitch}</p>
        <button className="btn small" onClick={() => navigator.clipboard.writeText(pitch)}><Copy size={18} />Copy</button></section>

      <section className="panel" style={{ display: 'grid', gap: 10 }}>
        <h2>Create store</h2>
        {(['code', 'name', 'owner_name', 'phone', 'area', 'pin'] as const).map(k =>
          <label key={k} className="field">{{ code: 'Store code (3-12 lowercase letters/numbers, owner types this)', name: 'Store name', owner_name: 'Owner name', phone: 'Owner phone', area: 'Area (e.g. Vijay Nagar)', pin: '4-digit PIN' }[k]}
            <input value={f[k]} inputMode={k === 'pin' || k === 'phone' ? 'numeric' : 'text'} maxLength={k === 'pin' ? 4 : 60}
              onChange={e => setF({ ...f, [k]: k === 'code' ? e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') : e.target.value })} /></label>)}
        <button className="btn primary" onClick={() => act({ action: 'create', ...f }, `Store "${f.code}" created. Owner logs in with code ${f.code} + PIN ${f.pin}.`).then(() => setF({ code: '', name: '', owner_name: '', phone: '', area: '', pin: '' }))}><Plus size={20} />Create store</button>
      </section>

      <section className="panel" style={{ overflowX: 'auto' }}>
        <div className="row" style={{ alignItems: 'center' }}><h2>Stores and usage</h2><button className="btn small" style={{ flex: 0 }} onClick={csv}><Download size={18} />CSV</button></div>
        <table><thead><tr><th>Code</th><th>Name</th><th>Status</th><th>Bills</th><th>/day</th><th>Receipts</th><th>Voice</th><th>Orders</th><th>Udhaar</th><th>Active days</th><th>Actions</th></tr></thead>
          <tbody>{rows.map(r => <tr key={r.code}>
            <td><b>{r.code}</b></td><td>{r.name}<div className="muted">{r.area}</div></td><td>{r.status}</td>
            <td>{r.bills}</td><td>{r.bills_per_day}</td><td>{r.receipts}</td><td>{r.voice}</td><td>{r.orders}</td><td>{r.udhaar}</td><td>{r.active_days}</td>
            <td style={{ whiteSpace: 'nowrap' }}>
              <button className="btn small" onClick={() => { const pin = prompt(`New 4-digit PIN for ${r.code}`); if (pin) act({ action: 'reset_pin', code: r.code, pin }, `PIN for ${r.code} changed.`) }}><KeyRound size={18} />PIN</button>{' '}
              <button className="btn small" onClick={() => act({ action: 'set_status', code: r.code, status: r.status === 'active' ? 'paused' : 'active' }, `${r.code} ${r.status === 'active' ? 'paused' : 'resumed'}.`)}>{r.status === 'active' ? <><Pause size={18} />Pause</> : <><Play size={18} />Resume</>}</button>{' '}
              <button className="btn small" style={{ color: 'var(--bad)' }} onClick={() => { const c = prompt(`This deletes ALL data of ${r.code} forever. Type the store code to confirm.`); if (c) act({ action: 'delete', code: r.code, confirm: c }, `${r.code} deleted.`) }}><Trash2 size={18} />Delete</button>
            </td></tr>)}</tbody></table>
        {rows.length === 0 && <p className="muted">No stores yet. Create one above.</p>}
      </section>
    </main></div>
  )
}
