// Admin-only actions (service role). The caller must be signed in as an admin,
// except "bootstrap", which creates the first admin: only while no admin exists AND with the
// owner-chosen BOOTSTRAP_CODE secret (set in the Supabase dashboard, never in the repo).
import { createClient } from "npm:@supabase/supabase-js@2";

const URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(URL, SERVICE, { auth: { persistSession: false } });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const fail = (msg: string, status = 400) => json({ error: msg }, status);

// Must match supabase/functions/login/index.ts
const storeEmail = (code: string) => `${code.toLowerCase()}@store.omnidukaan.app`;
async function storePassword(code: string, pin: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(SERVICE), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${code.toUpperCase()}:${pin}`));
  return "v2-" + [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
const validCode = (c: unknown): c is string => typeof c === "string" && /^[A-Z0-9]{4,8}$/.test(c);
const validPin = (p: unknown): p is string => typeof p === "string" && /^\d{6}$/.test(p);

async function callerIsAdmin(req: Request): Promise<boolean> {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const { data } = await db.auth.getUser(token);
  if (!data.user) return false;
  const { data: row } = await db.from("admins").select("user_id").eq("user_id", data.user.id).maybeSingle();
  return !!row;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return fail("POST only", 405);
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return fail("Bad JSON"); }
  const action = body.action;

  if (action === "bootstrap") {
    const { count } = await db.from("admins").select("user_id", { count: "exact", head: true });
    if ((count ?? 0) > 0) return fail("Admin already exists", 403);
    const code = Deno.env.get("BOOTSTRAP_CODE") ?? "";
    if (code.length < 6 || body.setup_code !== code) return fail("Wrong setup code", 403);
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || password.length < 10) return fail("Email and a 10+ character password needed");
    const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !data.user) return fail(error?.message ?? "Could not create admin");
    await db.from("admins").insert({ user_id: data.user.id });
    return json({ ok: true });
  }

  if (!(await callerIsAdmin(req))) return fail("Admins only", 403);

  switch (action) {
    case "list_stores": {
      const { data, error } = await db.from("stores").select("*").order("created_at", { ascending: false });
      return error ? fail(error.message) : json({ stores: data });
    }
    case "create_store": {
      const code = String(body.code ?? "").trim().toUpperCase();
      const { pin, name } = body;
      if (!validCode(code)) return fail("Store code: 4-8 letters/numbers");
      if (!validPin(pin)) return fail("PIN: exactly 6 digits");
      if (typeof name !== "string" || name.trim().length < 2) return fail("Store name needed");
      const { data: store, error } = await db.from("stores").insert({
        code, name: name.trim(),
        owner_name: body.owner_name ?? null, phone: body.phone ?? null, area: body.area ?? null,
        language: ["hi", "hinglish", "en"].includes(String(body.language)) ? body.language : "hinglish",
      }).select().single();
      if (error) return fail(error.code === "23505" ? "That store code is taken" : error.message);
      const { data: u, error: uerr } = await db.auth.admin.createUser({
        email: storeEmail(code), password: await storePassword(code, pin), email_confirm: true,
      });
      if (uerr || !u.user) { await db.from("stores").delete().eq("id", store.id); return fail(uerr?.message ?? "Could not create login"); }
      await db.from("store_users").insert({ user_id: u.user.id, store_id: store.id });
      return json({ store });
    }
    case "reset_pin": {
      const { store_id, pin } = body;
      if (!validPin(pin)) return fail("PIN: exactly 6 digits");
      const { data: s } = await db.from("stores").select("code").eq("id", store_id).single();
      const { data: su } = await db.from("store_users").select("user_id").eq("store_id", store_id).maybeSingle();
      if (!s || !su) return fail("Store not found", 404);
      const { error } = await db.auth.admin.updateUserById(su.user_id, { password: await storePassword(s.code, pin) });
      if (error) return fail(error.message);
      // new PIN: clear any lockout and log out every phone
      await db.from("login_attempts").delete().eq("code", s.code);
      await db.from("store_devices").update({ revoked: true }).eq("store_id", store_id);
      return json({ ok: true });
    }
    case "set_status": {
      const status = body.status === "paused" ? "paused" : "active";
      const { error } = await db.from("stores").update({ status }).eq("id", body.store_id);
      return error ? fail(error.message) : json({ ok: true });
    }
    case "delete_store": {
      const { data: su } = await db.from("store_users").select("user_id").eq("store_id", body.store_id);
      for (const r of su ?? []) await db.auth.admin.deleteUser(r.user_id);
      const { error } = await db.from("stores").delete().eq("id", body.store_id);
      return error ? fail(error.message) : json({ ok: true });
    }
    default:
      return fail("Unknown action");
  }
});
