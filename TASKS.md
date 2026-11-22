# TASKS.md — every task, every iteration

Status: ✅ done · 🔄 in progress · ⏳ pending. One line each. Updated on every commit chunk.
Deadline: live by **Thu 3 Dec 2026**. Live app: omnidukaan.vercel.app (also builds on omnios-dukaan).

## S0 · Reset and plan
- ✅ Wipe old build (skills kept) — fresh repo, nothing old left behind.
- ✅ PROJECT.md / PLAN.md / CLAUDE.md / DECISIONS.md — brief, work sections, session rules, owner answers.
- ✅ Decisions 1–8 recorded — build order, name, tabs, languages, price rule, returns, expiry, speak answers.

## S1 · Foundation
- ✅ DESIGN.md + previews — "warm market + premium" look; 8 owner-test rounds until every screen ≥ 9/10.
- ✅ Supabase wiped and rebuilt — stores, logins, admins, usage events; each shop sees only its own data (tested).
- ✅ Admin function — create store, reset PIN, pause, delete; first-admin setup locked.
- ✅ App shell — language choice (Hindi/Hinglish/English), code + PIN login, Home, Settings, 4 tabs + mic.
- ✅ /admin page — admin@omni.in created; stores table with actions.
- ✅ TEST store (code TEST, PIN 0000) — for trying the app; empty of real data.
- ✅ Real-app owner tests (rounds 9–11) — every screen ≥ 9/10 ease and calm.
- ✅ Vercel — omnidukaan live; omnios-dukaan reconnected (owner wants both kept).

## S2 · Voice engine
- ✅ Indore catalogue — 232 items with Hindi/English/brand/misspelling names (Haiku, reviewed).
- ✅ Voice parser — numbers in words (dedh, dhai, sau, hazaar), units, intents (bill, maal aaya, payment, question, galla).
- ✅ Names vs items — known customers, name at start or end, "Yahi naam?" when unsure.
- ✅ Accent-proof matching — maida = meda, atta = aata, Eveready = "everyday"; 51 tests pass.
- ✅ Mic listening — restarts quietly after pauses, waits 4 s, live list of items while speaking.
- ✅ Review card — Haan/Doosri, −/+, price pad, items first then Cash/UPI/Udhaar, udhaar running balance.
- ✅ Discount can be removed with one tap ("Hatao").
- ✅ Save bill / stock / payment — one-step database saves, Undo puts stock and udhaar back (tested end to end).
- ✅ Question + galla answers — "Cheeni kitni bachi?" spoken back; galla gap message.
- ✅ Fix: bill disappearing when mic kept listening — new words now add to the current bill.
- 🔄 Gemini fallback — deployed; Google answered "busy" on test, retry pending (rules work without it).
- ⏳ Owner-test rounds on voice screens — simulated owners until every screen ≥ 9/10.
- ⏳ Spoken-answer controls in Settings — on/off + slow/normal (stored, screen not added yet).

## S3 · Stock in
- ✅ "Maal aaya" by voice — adds stock (tested).
- ✅ Maal tab — stock list (low first), "Kam hai" tags, set own price, show/hide online, add stock by voice or by choosing.
- ⏳ Receipt photo → Gemini reads lines → review → stock + supplier due.
- ⏳ 3 sample receipts (one handwritten) for testing.
- ⏳ "New name asks once, remembers" for receipts (voice already remembers).

## S4 · Bills and udhaar
- ✅ Bill tab — today's bills, bill detail, WhatsApp share, Bill hatao, bill by choosing items.
- ✅ Bill redone from scratch (modern card) — same design on customer page, "Bill ban gaya" screen and bill detail.
- ✅ Branded customer bill page — receipt style, bill no., payment stamp, Hindi/Hinglish/English with proper item names, savings line.
- ✅ Price learned after 3 bills (decision 5).
- ✅ Udhaar tab — total due, customers by balance, "Paise mile", phone number, WhatsApp reminder, customer's own balance page.
- ⏳ Returns by voice ("wapas …") updating the original bill (decision 6).

- ⏳ Mock bills — owner decided: none (everything real).

## S5 · Daily payoff
- ✅ Home shows real today's sales and udhaar.
- ⏳ Aaj ka hisaab screen — sales, cash vs UPI, udhaar given/collected, supplier dues.
- ⏳ Galla gino screen (galla by voice already works).
- ⏳ 3-item daily stock check, morning briefing, daily streak.
- ⏳ Forecast "Seekh raha hai" state + low-stock alerts (no invented numbers).

## S6 · Customer side
- ⏳ Store order site, orders screen with sound, Ready → bill, customer status page, QR poster.
- ⏳ "Free thaile mangao" request + admin list.

## S7 · Admin and money
- ⏳ Admin usage per store, CSV, pitch line, read-only store view, bag requests.
- ⏳ T&C page with data-use clause; hidden pitch-mode screen.
- ⏳ Change admin password before real pilots (owner).

## S8 · Phase 2 and 3 groundwork
- ⏳ Coming-soon screens for every Phase 2/3 item + "Mujhe chahiye" interest counter.

## S9 · Polish and acceptance
- ⏳ All 10 tap tests on phone-size screens; real-phone check by owner.
- ⏳ Clear test data from TEST store before demos.

## Housekeeping
- ✅ graphify code graph — `graphify-out/` (run `graphify update app/src` after code changes).
- ✅ README updated.
