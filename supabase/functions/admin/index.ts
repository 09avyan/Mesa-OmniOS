// Admin-only actions that need the service role: create store logins, reset PINs, pause, delete.
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Content-Type': 'application/json' }
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: cors })
const email = (code: string) => `${code}@store.omnios.app`
const password = (code: string, pin: string) => `omni-${code}-${pin}`

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const url = Deno.env.get('SUPABASE_URL')!
  const svc = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
  const { data: u } = await svc.auth.getUser(token)
  const callerEmail = u.user?.email?.toLowerCase()
  if (!callerEmail || !u.user?.email_confirmed_at) return json({ error: 'not signed in' }, 401)
  const { data: adm } = await svc.from('admins').select('email').eq('email', callerEmail).maybeSingle()
  if (!adm) return json({ error: 'not admin' }, 403)

  const b = await req.json()
  const code = String(b.code ?? '').toLowerCase()
  const pinOk = /^\d{4}$/.test(String(b.pin ?? ''))

  if (b.action === 'create') {
    if (!/^[a-z0-9]{3,12}$/.test(code) || !pinOk || !b.name) return json({ error: 'code 3-12 letters/numbers, 4-digit PIN, name needed' }, 400)
    const { data: c, error } = await svc.auth.admin.createUser({ email: email(code), password: password(code, b.pin), email_confirm: true })
    if (error) return json({ error: error.message.includes('already') ? 'code already used' : error.message }, 400)
    const { error: e2 } = await svc.from('stores').insert({ code, name: b.name, owner_name: b.owner_name || null, phone: b.phone || null, area: b.area || null, user_id: c.user.id })
    if (e2) { await svc.auth.admin.deleteUser(c.user.id); return json({ error: e2.message }, 400) }
    return json({ ok: true })
  }

  const { data: store } = await svc.from('stores').select('id,user_id').eq('code', code).maybeSingle()
  if (!store) return json({ error: 'store not found' }, 404)

  if (b.action === 'reset_pin') {
    if (!pinOk) return json({ error: '4-digit PIN needed' }, 400)
    const { error } = await svc.auth.admin.updateUserById(store.user_id, { password: password(code, b.pin) })
    return error ? json({ error: error.message }, 400) : json({ ok: true })
  }
  if (b.action === 'set_status') {
    if (!['active', 'paused'].includes(b.status)) return json({ error: 'bad status' }, 400)
    await svc.from('stores').update({ status: b.status }).eq('id', store.id)
    return json({ ok: true })
  }
  if (b.action === 'delete') {
    if (b.confirm !== code) return json({ error: 'type the store code to confirm' }, 400)
    await svc.from('stores').delete().eq('id', store.id)
    if (store.user_id) await svc.auth.admin.deleteUser(store.user_id)
    return json({ ok: true })
  }
  return json({ error: 'unknown action' }, 400)
})
