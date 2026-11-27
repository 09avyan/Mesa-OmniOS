# Handoff — state at 27 Nov 2026 (owner deadline: submit Sunday 29 Nov)

## What is live / done
- **Backend (Supabase msqmuvqhbxyrhogbhtta):** migrations 0001–0018 applied. Edge functions: `login` v3 (6-digit PIN, per-device lockout, shop lock), `admin` v7 (reports, bags, CSV, requests), `understand` (Gemini, receipt photos + fallback only). Docs: `docs/backend.md`.
- **App (app/):** v2 look + logo A on every screen: merchant (Login, Home, Voice/billing, Bills, Udhaar, Maal, Hisaab, Orders, Receipt, Settings, Bag shop…), customer (e-bill `/b/`, khata `/k/`, store `/s/`, order `/o/`), admin `/admin` (light+dark, toggle). Ghar button ends every flow. Offline bill queue, idempotent save, 30-min undo, retry/LoadError everywhere.
- **Poochho** (`/poochho`): rules-first assistant, no Gemini. `src/lib/assistant.ts` (parse + plan, 23 tests) → `ask_*` SQL functions → `src/screens/Poochho.tsx`. Add a question type = add a RULE + a `plan` case + a `format` case.
- **Universe v12:** 5,750 items / 11,538 variants (`supabase/seed/universe.json` → packed `app/public/universe/`).
- **Own-brand bags:** 3 products (compostable ₹199/100, paper ₹249/50, cloth ₹199/10). **Costs in `bag_products.cost` are assumptions — verify with suppliers and edit in Admin → Bags.**
- Repo cleaned: old design versions removed (history keeps them); kept `design/v2`, `design/app-v2`, `design/logo`, `design/refs`.

## Known gaps / next (priority order)
1. ~~Leaked-password protection~~ — owner: not needed (PIN-only shop logins).
2. Real-phone test of everything (nothing was run on a device; only Playwright mocks + build + 331 tests). Test voice billing, bag order → Admin → Bags status, login lockout.
3. Delete `src/styles/df7-pages.css` after confirming which legacy classes remain used (`.pad/.key` in NumberSheet, `.btn.quiet`, `.lg*`). Move `NumberSheet`/`Sheet` to v2 styles first.
4. Receipt save goes straight to Maal (no Ghar button) — add a done state.
5. Admin shows no login alerts yet: table `login_alerts` + RPC `recent_login_alerts()` exist; add an `admin` action and an Overview card.
6. Profit question in Poochho says "needs buying prices" (no cost data on items). Build once stock-in records cost.
7. Verify flavour learning decrement on undo; `store_public` may need a `phone` field for the customer store call button.
8. Repo renamed to `09avyan/OmniOS` (owner authorised it in the session).
9. Sarvam STT: optional one-off comparison only; free browser STT stays default.

## Owner's open asks (28 Nov) — do these first
1. **Voice speed + accuracy (critical).** Owner reports: recognition is slow and sometimes wrong; after saying/tapping "nahi" the item changed, then re-recognised and changed again. Done so far: spoken "nahi X" now replaces the rejected line (`voice/correction.ts`), edited lines are `locked`, "haan/sahi" confirms all rows, AI (Gemini) call only when rules find nothing (2.5 s cap), end-of-speech 4 s → 2.6 s, Universe joins the index in the background (`uniReady`, 1.2 s max wait). **Not yet verified on a real phone.** Next: (a) log each voice turn (heard text, chosen item, edits) to `usage_events` to find the real failure; (b) show the live parse while listening and let "Haan"/"Nahi" be said per item; (c) cut matcher/index memory (144 MB, 1.7 s desktop) so a 2 GB iPhone 6s stays fast; (d) fewer taps: auto-confirm rows when the top match is exact.
2. **Reduce friction everywhere**: fewer confirmations, bigger one-tap defaults, Ghar button after receipt save, remember last pay mode per customer (never pre-select money — owner rule).
3. **Minor**: login-alerts card in admin (`recent_login_alerts()` exists), move old styles (`df7-pages.css`, NumberSheet) to v2, Home's Briefing/QR/Yaad rows were removed in v2 — ask owner if wanted back, store call button needs `phone` in `store_public`, receipt photos are not stored (text items only), confirm flavour learning on undo.
4. Admin Usage page was restored (owner: "undo the section removals").

## Rules to keep (CLAUDE.md)
Owner cannot read code → plain-words reports. Never delete data. Mock data only in TEST store (code TEST, PIN 000000). Push to `main` (auto-deploys Vercel). Text ≥18px, buttons ≥56px, udhaar never red, nothing pre-selected for money, ink = actions / teal = voice / amber-brown = udhaar.

## Verify commands
`cd app && npx tsc -b && npx vitest run && npx vite build`

## Model / effort advice for Codex (limited weekly budget)
Names change; pick the closest tier. [likely]
- **Default for UI/page work and small fixes:** the mid-size coding model at **medium** effort. Cheap, enough for restyling and wiring.
- **Database migrations, login/PIN, money logic (save_bill, undo):** same model at **high**, and always read the live function first (`pg_get_functiondef`) before editing. Never apply SQL without checking live columns.
- **Don't use max/xhigh** except to debug one stubborn bug; it burns the week.
- Delegate in small, file-disjoint chunks; run the verify command before every commit.
