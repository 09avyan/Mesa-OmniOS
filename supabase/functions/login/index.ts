// Shop login with PIN lockout. The real password is a server secret (HMAC of code+PIN),
// so nobody can guess PINs against Supabase directly; every try goes through here.
// PIN is 6 digits (owner, 25 Nov). 5 wrong PINs from one DEVICE (ip hash + label) → that device is locked for 10 minutes.
// The SHOP code is locked (10 min) only after 20 wrong PINs from all devices within 10 minutes. Each lock leaves a
// "someone tried your PIN" row in login_alerts (read by the shop with recent_login_alerts()). Needs migration 0016.
// Move from 4-digit PINs: a shop still on its old 4-digit PIN signs in once with "old PIN + 00" (TEST: 000000),
// which re-keys it to the 6-digit PIN. Only shops created before 25 Nov can be on a 4-digit PIN.
import { createClient } from "npm:@supabase/supabase-js@2";

const URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const db = createClient(URL, SERVICE, { auth: { persistSession: false } });
const MAX_FAILS = 5, SHOP_MAX_FAILS = 20, LOCK_MIN = 10;

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
async function deviceHash(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
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
  if (!/^[A-Z0-9]{4,8}$/.test(code) || !/^\d{6}$/.test(pin)) return json({ result: "wrong" });

  const now = Date.now();
  const since = new Date(now - LOCK_MIN * 60_000).toISOString();
  const ip = (req.headers.get("x-forwarded-for") ?? req.headers.get("cf-connecting-ip") ?? "").split(",")[0].trim();
  const device = await deviceHash(`${ip}|${label}`);
  const { data: att } = await db.from("login_attempts").select("*").eq("code", code).maybeSingle();
  if (att?.locked_until && new Date(att.locked_until).getTime() > now) {
    return json({ result: "locked", until: att.locked_until, scope: "shop" });
  }
  const { data: devFails } = await db.from("login_fails").select("at").eq("code", code).eq("device", device).gt("at", since).order("at", { ascending: false });
  if ((devFails?.length ?? 0) >= MAX_FAILS) {
    return json({ result: "locked", until: new Date(new Date(devFails![0].at).getTime() + LOCK_MIN * 60_000).toISOString(), scope: "device" });
  }

  const auth = createClient(URL, ANON, { auth: { persistSession: false } });
  const email = storeEmail(code);
  let { data, error } = await auth.auth.signInWithPassword({ email, password: await storePassword(code, pin) });
  if (error && pin.endsWith("00")) {
    // one-time move from a 4-digit PIN (secret or the older guessable password) to this 6-digit PIN
    const p4 = pin.slice(0, 4);
    let old = await auth.auth.signInWithPassword({ email, password: await storePassword(code, p4) });
    if (old.error) old = await auth.auth.signInWithPassword({ email, password: legacyPassword(code, p4) });
    if (!old.error && old.data.user) {
      await db.auth.admin.updateUserById(old.data.user.id, { password: await storePassword(code, pin) });
      ({ data, error } = await auth.auth.signInWithPassword({ email, password: await storePassword(code, pin) }));
    }
  }

  if (error || !data.session) {
    if (error && error.status && error.status >= 500) return json({ result: "offline" });
    await db.from("login_fails").insert({ code, device });
    const n = (devFails?.length ?? 0) + 1;
    const { data: store } = await db.from("stores").select("id").eq("code", code).maybeSingle();
    const alert = async (kind: string, fails: number) => { if (store) await db.from("login_alerts").insert({ store_id: store.id, kind, device_label: label, fails }); };
    // shop-wide: too many fails across all devices
    const { count: total } = await db.from("login_fails").select("id", { count: "exact", head: true }).eq("code", code).gt("at", since);
    if ((total ?? 0) >= SHOP_MAX_FAILS) {
      const until = new Date(now + LOCK_MIN * 60_000).toISOString();
      await db.from("login_attempts").upsert({ code, fails: 0, locked_until: until, updated_at: new Date().toISOString() });
      await alert("shop_locked", total ?? 0);
      return json({ result: "locked", until, scope: "shop" });
    }
    if (n >= MAX_FAILS) {
      await alert("device_locked", n);
      return json({ result: "locked", until: new Date(now + LOCK_MIN * 60_000).toISOString(), scope: "device" });
    }
    return json({ result: "wrong", left: MAX_FAILS - n });
  }

  await db.from("login_fails").delete().eq("code", code).eq("device", device);
  await db.from("login_attempts").delete().eq("code", code);
  if (Math.random() < 0.02) await db.from("login_fails").delete().lt("at", new Date(now - 86_400_000).toISOString());
  const sid = sessionIdOf(data.session.access_token);
  const { data: su } = await db.from("store_users").select("store_id").eq("user_id", data.user!.id).maybeSingle();
  if (sid && su) await db.from("store_devices").upsert({ store_id: su.store_id, session_id: sid, label }, { onConflict: "session_id" });
  return json({ result: "ok", access_token: data.session.access_token, refresh_token: data.session.refresh_token });
});
