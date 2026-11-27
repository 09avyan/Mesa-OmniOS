// Gemini helper for voice + receipt photos: used ONLY when the on-phone rules are not sure (brief: "Gemini only when the rules
// aren't sure"). Returns structure; the app still matches items itself and the owner still reviews + taps ✓.
import { createClient } from "npm:@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
// Models change often (old ones get retired), so ask Google which exist and prefer the newest Flash ones.
let MODELS: string[] | null = null;
async function models(): Promise<string[]> {
  if (MODELS) return MODELS;
  const pinned = Deno.env.get("GEMINI_MODEL");
  let found: string[] = [];
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${KEY}`, { signal: AbortSignal.timeout(8_000) });
    const j = await r.json();
    found = (j.models ?? [])
      .filter((m: { name: string; supportedGenerationMethods?: string[] }) => m.supportedGenerationMethods?.includes("generateContent") && /flash/.test(m.name) && !/image|tts|audio|live|embed|thinking|exp/.test(m.name))
      .map((m: { name: string }) => m.name.replace(/^models\//, ""))
      .sort((a: string, b: string) => (parseFloat(b.match(/(\d+(\.\d+)?)/)?.[1] ?? "0") - parseFloat(a.match(/(\d+(\.\d+)?)/)?.[1] ?? "0")) || a.length - b.length);
  } catch { /* fall back below */ }
  MODELS = [...new Set([...(pinned ? [pinned] : []), ...found.slice(0, 4), "gemini-flash-latest", "gemini-flash-lite-latest"])];
  return MODELS;
}
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

// Receipt photo (supplier parchi / bill, printed or handwritten) -> lines for review.
const RECEIPT_SCHEMA = {
  type: "OBJECT",
  properties: {
    supplier: { type: "STRING", nullable: true },
    date: { type: "STRING", nullable: true },
    total: { type: "NUMBER", nullable: true },
    lines: { type: "ARRAY", items: { type: "OBJECT", properties: {
      name: { type: "STRING" }, qty: { type: "NUMBER", nullable: true },
      unit: { type: "STRING", enum: ["kg", "g", "l", "ml", "pc", "pack"], nullable: true },
      rate: { type: "NUMBER", nullable: true }, amount: { type: "NUMBER", nullable: true },
      unclear: { type: "BOOLEAN" },
    }, required: ["name", "unclear"] } },
  },
  required: ["lines"],
};
const RECEIPT_PROMPT = `This is a photo of a supplier bill/receipt (parchi) given to an Indian kirana shop. It may be printed or handwritten, in Hindi, English or mixed.
Return JSON: supplier (shop/firm name or null), date (as written or null), total (bill total in rupees or null), lines: one per item row with
name (as written, transliterated to simple Hinglish/English if in Devanagari, keep brand and pack size e.g. "Aashirvaad atta 10kg"),
qty (number; bags/boxes/cartons -> count with unit pack), unit, rate (per unit, rupees), amount (row total, rupees),
unclear: true if you could not read the name or numbers with confidence. Skip header/footer rows, taxes and totals. Never invent rows.`;

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

  let body: { text?: string; customers?: string[]; image?: string; mime?: string };
  try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
  if (body.image) {
    if (body.image.length > 6_000_000) return json({ error: "too_big" }, 413);
    const mime = ["image/jpeg", "image/png", "image/webp"].includes(String(body.mime)) ? body.mime : "image/jpeg";
    return await ask(su.store_id, "receipt", [{ inline_data: { mime_type: mime, data: body.image } }, { text: RECEIPT_PROMPT }], RECEIPT_SCHEMA);
  }
  const text = String(body.text ?? "").slice(0, 600);
  if (!text.trim()) return json({ error: "empty" }, 400);

  return await ask(su.store_id, "voice", [{ text: prompt(text, body.customers ?? []) }], SCHEMA);
});

// Try each model in turn; a busy/limited/missing/slow model falls through to the next.
async function ask(store: string, what: string, parts: unknown[], schema: unknown) {
  const tried: string[] = [];
  const start = Date.now(), per = what === "receipt" ? 40_000 : 12_000;
  for (const model of await models()) {
    const left = 120_000 - (Date.now() - start);
    if (left < 5_000) { tried.push("out_of_time"); break; }
    let r: Response;
    try { r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(Math.min(per, left)),
      body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: 0 } }),
    }); } catch { tried.push(`${model}:timeout`); continue; }
    if (!r.ok) {
      let msg = ""; try { msg = (await r.json())?.error?.message ?? ""; } catch { /* ignore */ }
      tried.push(`${model}:${r.status}:${msg.slice(0, 80)}`);
      if ([404, 429, 500, 503].includes(r.status)) continue;
      return json({ error: "ai_failed", status: r.status, tried }, 502);
    }
    const out = await r.json();
    const raw = out?.candidates?.[0]?.content?.parts?.[0]?.text;
    try {
      const parsed = JSON.parse(raw);
      await db.from("usage_events").insert({ store_id: store, kind: "ai", meta: { model, what, intent: parsed.intent ?? null } });
      return json(parsed);
    } catch { tried.push(`${model}:bad_output`); }
  }
  MODELS = null; // re-check the list next time
  return json({ error: "ai_busy", tried }, 503);
}
