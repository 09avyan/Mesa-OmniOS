# PLAN.md — work sections (fresh start, 21 Nov 2026; live by Thu 3 Dec 2026)

Each section groups similar work, ends with a report and a commit. Workers per the `delegate` skill:
**Lead** = main model (contracts, money logic, DB, review). **Sonnet** = clear-spec UI/feature slices. **Haiku** = data, docs, copy.
Max 1 Sonnet + 1 Haiku alive, reused across sections.

| # | Section | What gets built | Who | Target |
|---|---|---|---|---|
| S0 | Reset + plan ✅ | Repo wiped except skills; PROJECT.md, PLAN.md, CLAUDE.md, DECISIONS.md | Lead | 21 Nov |
| S1 | Foundation | DESIGN.md (exact values) → app shell, 4 tabs, home, fixed mic, back button, feedback (tap sound/vibrate, tick, undo toast); Supabase schema + per-store security; store-code+PIN login; admin "create store"; Vercel deploy | Lead: schema, auth, shell. Sonnet: shared components. Haiku: Hindi/English copy file | 22–23 Nov |
| S2 | Voice engine | Speech capture (hi-IN/en-IN, live words); rule parser (Hindi number words, units, synonyms, fuzzy match); intent router; the one Review card (unsure lines highlighted, tap/voice fix, ✓); Gemini fallback (server-side) | Lead: parser + router. Haiku: Indore catalogue + synonym list. Sonnet: Review card UI | 24–25 Nov |
| S3 | Stock in | Items + opening stock by voice; "Maal aaya" by voice; receipt photo → Gemini → review → stock + supplier due; "new name asks once, remembers"; 3 sample receipts | Lead: stock + dues logic, Gemini function. Sonnet: screens. Haiku: sample receipts | 26–27 Nov |
| S4 | Money out & udhaar | Bills (voice/search, walk-in, cash/UPI, unrecorded-item flag); selling-price rule; public bill page (Hi/En) + WhatsApp share; udhaar ledger, payments, balance page + reminder link | Lead: bill/udhaar logic. Sonnet: screens + public pages | 28–29 Nov |
| S5 | Daily payoff | Aaj ka hisaab; galla match; 3-item stock check; morning briefing; streak; forecast "Seekh raha hai" state + low-stock alerts (real predictions only once data exists) | Lead: calculations. Sonnet: screens | 30 Nov |
| S6 | Customer side | Per-store order site; orders screen with sound; accept → pack → Ready → bill; customer status page; QR poster; "Free thaile mangao" | Sonnet: site + screens. Lead: order→bill logic, review | 1 Dec |
| S7 | Admin & money | Full admin: stores (create/reset PIN/pause/delete), read-only store view, usage + CSV + pitch line, bag requests; T&C page; hidden pitch-mode screen | Sonnet: admin UI. Lead: admin security. Haiku: T&C text | 1–2 Dec |
| S8 | Phase 2 & 3 groundwork | Coming soon screens for every Phase 2/3 item; light backend: feature switches per store + "Mujhe chahiye" interest button that admin can count (real demand data, nothing fake) | Sonnet: screens. Haiku: copy. Lead: tables | 2 Dec |
| S9 | Polish & acceptance | All 10 tap tests on phone-size screenshots; "55-year-old shopkeeper" pass; speed, motion, empty/error states | Lead | 2–3 Dec |

## Biggest risks (watch these)
- **Browser voice**: Hindi speech works well in Chrome on Android; weak or missing on iPhone Safari and Firefox. [likely] Pilot phones must be Android + Chrome.
- **Handwritten receipts**: Gemini will misread some lines; the review card is the safety net. [likely]
- **12 days for S1–S9** is tight; S6–S8 are the first to shrink if voice/receipts run late. [likely]
- **Gemini free tier** limits per minute/day could block a demo under load. [guessing]
