// Shop login with PIN lockout. The real password is a server secret (HMAC of code+PIN),
// so nobody can guess PINs against Supabase directly; every try goes through here.
// 5 wrong PINs → shop code locked for 10 minutes.
import { createClient } from "npm:@supabase/supabase-js@2";

const URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const db = createClient(URL, SERVICE, { auth: { persistSession: false } });
const MAX_FAILS = 5, LOCK_MIN = 10;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

// Must match supabase/functions/admin/index.ts
async function storePassword(code: string, pin: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(SERVICE), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${code.toUpperCase()}:${pin}`));
  return "v2-" + [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
const legacyPassword = (code: string, pin: string) => `omni-${code.toUpperCase()}-${pin}`;
const storeEmail = (code: string) => `${code.toLowerCase()}@store.omnidukaan.app`;
const sessionIdOf = (jwt: string) => {
  try { return JSON.parse(atob(jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).session_id as string; } catch { return null; }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ result: "error" }, 405);
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ result: "error" }, 400); }
  const code = String(body.code ?? "").trim().toUpperCase();
  const pin = String(body.pin ?? "");
  const label = String(body.label ?? "Phone").slice(0, 60);
  if (!/^[A-Z0-9]{4,8}$/.test(code) || !/^\d{4}$/.test(pin)) return json({ result: "wrong" });

  const { data: att } = await db.from("login_attempts").select("*").eq("code", code).maybeSingle();
  const now = Date.now();
  if (att?.locked_until && new Date(att.locked_until).getTime() > now) {
    return json({ result: "locked", until: att.locked_until });
  }
  const fails = att?.locked_until ? 0 : (att?.fails ?? 0); // lock expired → fresh count

  const auth = createClient(URL, ANON, { auth: { persistSession: false } });
  const email = storeEmail(code);
  let { data, error } = await auth.auth.signInWithPassword({ email, password: await storePassword(code, pin) });
  if (error) {
    // one-time move from the old guessable password to the secret one
    const old = await auth.auth.signInWithPassword({ email, password: legacyPassword(code, pin) });
    if (!old.error && old.data.user) {
      await db.auth.admin.updateUserById(old.data.user.id, { password: await storePassword(code, pin) });
      ({ data, error } = await auth.auth.signInWithPassword({ email, password: await storePassword(code, pin) }));
    }
  }

  if (error || !data.session) {
    if (error && error.status && error.status >= 500) return json({ result: "offline" });
    const n = fails + 1;
    const locked = n >= MAX_FAILS ? new Date(now + LOCK_MIN * 60_000).toISOString() : null;
    await db.from("login_attempts").upsert({ code, fails: locked ? 0 : n, locked_until: locked, updated_at: new Date().toISOString() });
    return locked ? json({ result: "locked", until: locked }) : json({ result: "wrong", left: MAX_FAILS - n });
  }

  await db.from("login_attempts").delete().eq("code", code);
  const sid = sessionIdOf(data.session.access_token);
  const { data: su } = await db.from("store_users").select("store_id").eq("user_id", data.user!.id).maybeSingle();
  if (sid && su) await db.from("store_devices").upsert({ store_id: su.store_id, session_id: sid, label }, { onConflict: "session_id" });
  return json({ result: "ok", access_token: data.session.access_token, refresh_token: data.session.refresh_token });
});
