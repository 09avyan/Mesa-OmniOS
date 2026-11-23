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
- ✅ Receipt photo → Gemini reads lines → review (yellow = unclear, pick item, qty, rate) → ✓ → stock + supplier due; works without AI (type items); Maal tab button; Hisaab → Supplier dues → 'Paise diye'. Tested end to end without AI.
- 🔄 Gemini: model list now auto-discovered (old 2.x models retired by Google); all 3.x Flash models answered 'high demand' on the free tier today — retry later, or a paid key (ask owner) if it persists.
- ✅ 3 sample receipts (one handwritten) — supabase/seed/receipts/.
- ✅ "New name asks once, remembers" for receipts (name on parchi saved as alias on ✓).

## S4 · Bills and udhaar
- ✅ Bill tab — today's bills, bill detail, WhatsApp share, Bill hatao, bill by choosing items.
- ✅ Bill redone from scratch (modern card) — same design on customer page, "Bill ban gaya" screen and bill detail.
- ✅ Branded customer bill page — receipt style, bill no., payment stamp, Hindi/Hinglish/English with proper item names, savings line.
- ✅ Price learned after 3 bills (decision 5).
- ✅ Udhaar tab — total due, customers by balance, "Paise mile", phone number, WhatsApp reminder, customer's own balance page.
- ⏳ Returns by voice ("wapas …") updating the original bill (decision 6).

- ⏳ Mock bills — owner decided: none (everything real).

## S4b · Owner requests (23 Nov)
- ✅ Add customer in Udhaar tab (name, phone, opening udhaar).
- ✅ Same-name customers: tell apart (phone / area / nickname) in voice, review and Udhaar.
- ✅ After saving: show "Ghar" (home) button instead of "Naya bill".
- ✅ Maal item sheet: set available quantity directly.
- ✅ Chips/namkeen flavours: catalogue variants (Lays, Balaji, Bingo, Kurkure… by flavour + size) and voice auto-detect.
- ✅ Online store — customer page /s/<name> (search, categories, cart, 'Mangwao' requests, repeat order), order status/edit/cancel /o/…, shop Orders (Naye/Chal rahe/Ho gaye/Maange gaye), packing 'Nahi hai', Ready → WhatsApp, order → bill, Meri online dukaan (QR, share, print, on/off), Home badge + chime, 'order online' on bills; tested end to end.
- ⏳ Admin: set store link (button added in /admin → 'Store link'; TEST = test-dukaan).
- ✅ Phone number after payment (optional) → WhatsApp to that number; editable in bill detail.
- ✅ PIN lockout (5 wrong → 10 min) + logged-in phones list with Remove (Settings + /admin "Phones"); PIN secret now server-side; PIN reset logs out all phones.
- ⏳ Khata photo import (OCR) — after receipts; brief had it in Phase 2.

## S4c · Owner requests (24 Nov)
- ✅ Mock data in TEST store only (customers, items with prices, bills, udhaar, orders, requests); never deleted unless owner asks.
- ✅ Online store redesign — make it beautiful, not bland.
- ✅ QR icon next to Settings on Home (opens store QR).
- ✅ Settings: merchant UPI ID; UPI payment shows QR with amount filled; close option (paid via printed QR).

## S4d · Owner requests (24 Nov, later)
- ⏳ Optimise Supabase (indexes, query count, RLS speed, advisors) and the site (bundle size, lazy screens, load time on cheap phones).
- ⏳ Real professional item photos — plan needed (options: brand press kits/permission, licensed packshot databases, own photo shoots per item, shop-taken photos cleaned up); ask owner before any cost.
- ⏳ NEW revenue stream: sponsored items — brands pay to boost their products across all stores or a region; 60% shared with stores. ASK OWNER PROPERLY LATER (pricing, how boosting shows, store payout, disclosure "Sponsored", admin screens). Add to pitch-mode business model.

## S4e · Owner requests (24 Nov, evening)
- ✅ Order screens show item names in the chosen language (was Hinglish "Cheeni" in Hindi mode).
- ✅ Deleting a bill made from an online order: order goes back to "Taiyaar" + message to the owner.
- ✅ Branded staples: Silver Coin, Aashirvaad, Gangwal, Pillsbury, Fortune, Rajdhani… atta/maida/suji/besan/poha/rice by pack size (38 items, voice-tested).
- ⏳ Edge cases + safety checks — list and discuss with owner (negative stock, offline mid-save, duplicate bills, wrong customer, PIN guessing, fake orders, price errors, undo limits, data loss, privacy).

## NEXT BUILD
- ⏳ Full UI redo again (all merchant + customer screens), design-skill led, owner-test rounds ≥ 9/10.
- 🔄 Redo all UI — merchant side pass 1 done (Home hero, shared design polish, app-styled pop-ups, review fixes); next: deeper per-screen redesign + owner-test rounds ≥ 9/10; customer side later.

## S4f · Owner requests (23 Nov)
- ✅ TEST shop: top 150 kirana items (loose, branded staples, chips/namkeen flavours, dairy, care, cleaning) with Indore prices + stock.

## OWNER APPROVALS (23 Nov) — build order
Approved, in this order:
1. Receipt photo → stock + supplier dues (+ 3 sample receipts).
2. Morning briefing (yesterday's hisaab + who to collect udhaar from) + daily streak + 3-item stock check. NOTE: "what to restock" waits for the forecast, once there is enough data to train it.
3. Forecast "Seekh raha hai" state + simple low-stock alerts.
4. Returns by voice ("wapas").
5. Admin usage per store + CSV + pitch line + read-only store view.
6. Full UI redo + owner-test rounds ≥ 9/10.
7. Speed (Supabase + site) + spoken-answer settings.
- ⏳ Master items file (`.items`): every item any current or future customer store could sell — kirana, niche/regional, supermart/POS ranges (pack sizes, flavours, brands, Hindi/Hinglish/English names, aliases, barcodes where known). Used by voice + receipts so Gemini is needed less. Plan: build in batches by category, merge with catalog.json.
- ✅ T&C wording approved by owner (lawyer check before real pilots).
- ⏸ Not approved yet: hidden pitch-mode screen.
- ⏸ DISCUSS LATER — remind owner: edge cases + safety, sponsored items, item photos plan, khata photo import (Phase 2 vs now).

## S5 · Daily payoff
- ✅ Home shows real today's sales and udhaar.
- ✅ Aaj ka hisaab screen — Aaj/Kal/7/30 din: sales, cash/UPI/udhaar split, udhaar collected, avg bill, busiest hour, top 5 items. Supplier dues shown once receipts exist.
- ✅ Galla screen — type or say drawer cash, compared with today's cash bills.
- ✅ Morning briefing card on Home (yesterday, who to collect udhaar from + days waiting, streak) + daily 3-item count (/check: corrects stock, shows gaps). Restock advice waits for forecast (owner).
- ⏳ Forecast "Seekh raha hai" state + low-stock alerts (no invented numbers).

## S6 · Customer side
- ⏳ Store order site, orders screen with sound, Ready → bill, customer status page, QR poster.
- ✅ "Free thaile mangao" — request 100/250/500, status; admin list with Sent/Delivered/Cancel.

## S7 · Admin and money
- ⏳ Admin usage per store, CSV, pitch line, read-only store view, bag requests.
- ✅ T&C page (6 plain sections incl. anonymised data-use clause) — needs owner approval of wording.
- ⏳ Hidden pitch-mode screen.
- ⏳ Change admin password before real pilots (owner).

## S8 · Phase 2 and 3 groundwork
- ✅ Coming-soon page (10 Phase 2/3 items) + "Mujhe chahiye" counter; admin sees demand per feature.

## S9 · Polish and acceptance
- ⏳ All 10 tap tests on phone-size screens; real-phone check by owner.
- ⏳ Clear test data from TEST store before demos.

## Housekeeping
- ✅ graphify code graph — `graphify-out/` (run `graphify update app/src` after code changes).
- ✅ README updated.
