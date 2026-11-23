# OmniOS Dukaan

A voice-first app that runs a kirana (neighbourhood grocery) store. The owner speaks or taps; OmniOS makes the bill, updates stock and keeps the udhaar khata.

- **Live:** omnidukaan.vercel.app · admin at `/admin` · customer bills at `/b/<code>`
- **Try it:** shop code `TEST`, PIN `0000` (Chrome on Android for voice)
- **Status:** see [TASKS.md](TASKS.md) · brief: [PROJECT.md](PROJECT.md) · plan: [PLAN.md](PLAN.md) · decisions: [DECISIONS.md](DECISIONS.md) · look: [DESIGN.md](DESIGN.md)

## What works today
- Language choice (Hindi / Hinglish / English), shop code + PIN login (5 wrong tries → 10-minute lock), list of logged-in phones with log-out.
- One mic on every screen: "Sharma ji, 2 kilo cheeni, 1 Maggi" → review card → ✓ → bill saved, stock drops, WhatsApp link.
- "Maal aaya, 10 Aashirvaad atta" adds stock · "Gupta ji ne 500 diye" records udhaar payment · "Cheeni kitni bachi?" answers aloud · "Galla mein 4,200 hai" checks the cash drawer.
- Supplier bill photo → stock added + supplier dues (works by hand if the AI is busy).
- Home: morning briefing, daily 3-item stock count with streak, today's real sales. Maal: forecast card (learns for 14 days, then "jaldi khatam hoga").
- Hisaab (sales by day/week/month), Galla check, free bags request, T&C, "coming soon" interest buttons.
- Bill tab: today's bills, bill detail, Undo, bill by choosing items; branded receipt, order-status and udhaar pages for customers.
- Admin: create stores, reset PIN (logs out all phones), pause, delete, bag requests.
- TEST shop has the top 150 kirana items (brands, loose, flavours) and mock data — real shops never get mock data.

## Design status
- Prototype v6 passed a 5-merchant + designer panel: omnidukaan.vercel.app/proto/ (`?lang=hi` for Hindi).
- Next session: full UI + UX redo from scratch with a 5–7 person panel (see TASKS.md → UI REDO #4).

## How it is built
| Part | Where |
|---|---|
| App (React + Vite, deployed on Vercel) | `app/` |
| Voice understanding (rules first, 51 tests) | `app/src/voice/` |
| Screens | `app/src/screens/` |
| Database tables + money functions (Supabase) | `supabase/migrations/` |
| Server functions (admin, Gemini helper) | `supabase/functions/` |
| Item catalogue (232 Indore items + synonyms) | `supabase/seed/catalog.json` |
| Code map | `graphify-out/GRAPH_REPORT.md` |

## For developers
```bash
cd app && npm ci && npm run dev    # local app
npm test                           # voice tests
graphify update app/src --force    # refresh the code map (graphify 0.9.118); copy app/src/graphify-out/* to graphify-out/
```
