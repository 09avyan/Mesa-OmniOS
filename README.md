# OmniOS Dukaan

A voice-first app that runs a kirana (neighbourhood grocery) store. The owner speaks or taps; OmniOS makes the bill, updates stock and keeps the udhaar khata.

- **Live:** omnidukaan.vercel.app · admin at `/admin` · customer bills at `/b/<code>`
- **Try it:** shop code `TEST`, PIN `000000` (Chrome on Android for voice)
- **Status / next steps:** [docs/HANDOFF.md](docs/HANDOFF.md) · see [TASKS.md](TASKS.md) · brief: [PROJECT.md](PROJECT.md) · plan: [PLAN.md](PLAN.md) · decisions: [DECISIONS.md](DECISIONS.md) · look: [DESIGN.md](DESIGN.md)

## What works today
- Language choice (Hindi / Hinglish / English), shop code + 6-digit PIN login (5 wrong tries → that phone locked 10 minutes), list of logged-in phones with log-out.
- One mic on every screen: "Sharma ji, 2 kilo cheeni, 1 Maggi" → review card → ✓ → bill saved, stock drops, WhatsApp link.
- "Maal aaya, 10 Aashirvaad atta" adds stock · "Gupta ji ne 500 diye" records udhaar payment · "Cheeni kitni bachi?" answers aloud · "Galla mein 4,200 hai" checks the cash drawer.
- Supplier bill photo → stock added + supplier dues (works by hand if the AI is busy).
- Home: today's sales, who owes you, latest bills. Poochho: ask anything by voice (rules-based, no AI call) — "aaj kitna bika?". Maal: stock, forecast, daily 3-item count.
- Hisaab (sales by day/week/month), Galla check, own-brand carry bags shop (compostable / paper / cloth), all supplier receipts, T&C (14 sections), "coming soon" interest buttons.
- Bill tab: today's bills, bill detail, Undo, bill by choosing items; branded receipt, order-status and udhaar pages for customers.
- Admin (light/dark): overview, shops + detail, bag products/orders/margins, demand, usage, analytics, CSV export, create/pause/delete shops, reset PIN.
- TEST shop has the top 150 kirana items (brands, loose, flavours) and mock data — real shops never get mock data.

## Design status
- v2 look + logo A (Voice "O") live on every screen (merchant, customer, admin). References: `design/v2/`, `design/app-v2/`, `design/logo/`. from the live site.

## How it is built
| Part | Where |
|---|---|
| App (React + Vite, deployed on Vercel) | `app/` |
| Voice understanding (rules first; Gemini only if rules find nothing) | `app/src/voice/` |
| Screens | `app/src/screens/` |
| Database tables + money functions (Supabase) | `supabase/migrations/` |
| Server functions (admin, Gemini helper) | `supabase/functions/` |
| Item catalogue (232 items) + Universe (5,750 items) | `supabase/seed/` |
| Code map | `graphify-out/GRAPH_REPORT.md` |

## Project memory (`.context/`)
Compressed memory so each session reads little: `.context/INDEX.md` has one line per topic; full detail is in the topic files next to it.
**Keep it current:** update TASKS.md as you work (mark 🔄 when starting, ✅ when seen working, add new owner asks at once). After every chunk of work, update the matching INDEX line, the topic file, and add one line to `.context/log.md` (newest first). New topic → new file + INDEX row.

## For developers
```bash
cd app && npm ci && npm run dev    # local app
npm test                           # voice tests
graphify update app/src --force    # refresh the code map (graphify 0.9.118); copy app/src/graphify-out/* to graphify-out/
```
