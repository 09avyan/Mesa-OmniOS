// Gemini helper for voice: used ONLY when the on-phone rules are not sure (brief: "Gemini only when the rules
// aren't sure"). Returns structure; the app still matches items itself and the owner still reviews + taps ✓.
import { createClient } from "npm:@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const MODELS = [Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash", "gemini-flash-latest"];
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const SCHEMA = {
  type: "OBJECT",
  properties: {
    intent: { type: "STRING", enum: ["bill", "stock_in", "payment", "query", "galla", "return", "unknown"] },
    customer: { type: "STRING", nullable: true },
    amount: { type: "NUMBER", nullable: true },
    items: { type: "ARRAY", items: { type: "OBJECT", properties: {
      name: { type: "STRING" }, qty: { type: "NUMBER", nullable: true },
      unit: { type: "STRING", enum: ["kg", "g", "l", "ml", "pc", "pack"], nullable: true }, rupees: { type: "NUMBER", nullable: true },
    }, required: ["name"] } },
  },
  required: ["intent", "items"],
};

function prompt(text: string, customers: string[]) {
  return `You help an Indian kirana (grocery) shop owner. They spoke one instruction in Hindi, Hinglish or English (speech-to-text, may have errors).
Instruction: """${text}"""
Known customers of this shop: ${customers.slice(0, 200).join(", ") || "(none yet)"}
Return JSON:
- intent: bill (selling to a customer), stock_in ("maal aaya", goods received from supplier), payment (a customer paid back udhaar, e.g. "X ne 500 diye"), query (asking how much stock is left), galla (cash in drawer amount), return ("wapas"), unknown.
- customer: the PERSON's name if one is said (match the known list spelling if it is one of them), else null. Never put an item or brand here.
- items: each grocery item with name as a shopkeeper says it in simple Hinglish (e.g. "cheeni", "Maggi", "Aashirvaad atta 5kg"), qty as a number (Hindi number words -> digits; aadha=0.5, dedh=1.5, dhai=2.5, pav=0.25), unit, or rupees when said as "50 rupaye ka dhaniya".
- amount: money amount for payment/galla.
Do not invent anything that was not said.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!KEY) return json({ error: "not_configured" }, 503);
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: u } = await db.auth.getUser(token);
  if (!u.user) return json({ error: "login" }, 401);
  const { data: su } = await db.from("store_users").select("store_id").eq("user_id", u.user.id).maybeSingle();
  if (!su) return json({ error: "no_store" }, 403);
  // fair-use limit: 120 AI calls per shop per hour (free tier)
  const { count } = await db.from("usage_events").select("id", { count: "exact", head: true })
    .eq("store_id", su.store_id).eq("kind", "ai").gte("at", new Date(Date.now() - 3600_000).toISOString());
  if ((count ?? 0) >= 120) return json({ error: "limit" }, 429);

  let body: { text?: string; customers?: string[] };
  try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
  const text = String(body.text ?? "").slice(0, 600);
  if (!text.trim()) return json({ error: "empty" }, 400);

  for (const model of MODELS) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt(text, body.customers ?? []) }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: SCHEMA, temperature: 0 } }),
    });
    if (r.status === 404) continue;
    if (!r.ok) return json({ error: "ai_failed", status: r.status }, 502);
    const out = await r.json();
    const raw = out?.candidates?.[0]?.content?.parts?.[0]?.text;
    try {
      const parsed = JSON.parse(raw);
      await db.from("usage_events").insert({ store_id: su.store_id, kind: "ai", meta: { model, intent: parsed.intent } });
      return json(parsed);
    } catch { return json({ error: "ai_bad_output" }, 502); }
  }
  return json({ error: "no_model" }, 502);
});
