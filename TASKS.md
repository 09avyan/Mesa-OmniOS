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
- 🔄 Full UI redo from scratch (owner, 23 Nov): look chosen by test (3 versions → 'clean counter' won), 6 prototype rounds + 3 real-app rounds → ✅ MERCHANT PASSED (all 4 owner personas 9/9/9). Next: customer pages (customer panel) → admin (admin panel). DESIGN.md v3.
- ⏳ Maal tab: 150+ items make a very long list — search-first / sections (panel note).
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
6. Full UI redo (now UI REDO #4, next session) + panel ≥ 9.
7. Speed (Supabase + site) + spoken-answer settings.
- 🔄 Universe file (was "`.items`", renamed by owner 24 Nov): supabase/seed/universe.json — batch 1 = 100 best-known items ✅. Next batches by category. Original aim: master items file (`.items`): every item any current or future customer store could sell — kirana, niche/regional, supermart/POS ranges (pack sizes, flavours, brands, Hindi/Hinglish/English names, aliases, barcodes where known). Used by voice + receipts so Gemini is needed less. Plan: build in batches by category, merge with catalog.json.
- ✅ T&C wording approved by owner (lawyer check before real pilots).
- ⏸ Not approved yet: hidden pitch-mode screen.
- ⏸ DISCUSS LATER — remind owner: edge cases + safety, sponsored items, item photos plan, khata photo import (Phase 2 vs now).

## UI REDO #3 (owner, 23 Nov)
- ✅ Prototype v6 (Home + bill flow) PASSED panel: 5 merchants (Shyam ji, Aman, Rekha, Pooja, Baldev) 9/9/9 + designer 9/9/9. Live at /proto/ (?lang=hi for Hindi).
- ⏸ (superseded by REDO #4) Owner approves prototype on phone → then rebuild all merchant, customer, admin screens in this design.

## UI REDO #4 — 🔄 STARTED 24 Nov (spec: .context/ui-redo-4.md)
- ⏳ Redo all UI + UX again from ABSOLUTE scratch: new look, new flows. v6 (/proto/) stays only as a reference to beat, not a starting point.
- Panel (24 Nov): 9 votes = 5 merchants (Shyam ji, Aman, Rekha, Pooja, Baldev) ×1 + 2 premium product designers from different multi-billion software firms ×2. Free hand on looks + tabs/mic layout; size/accessibility rules fixed. No style reference: versions one by one, fail = redo from scratch.
- Loop: one version at a time → run the panel → pass = continue, fail = next version. Owner approves the prototype on phone before the full rebuild.
- Order after approval: merchant screens → customer pages (customer panel) → admin (admin panel). Language picked at onboarding, changeable in Settings.
- Use every design skill that raises quality (impeccable, ui-ux-pro-max, interface-design, emil-design-eng, frontend-ui-engineering, design-taste-frontend).
- ❌ v1 "Aaj ka panna" (calendar page) FAILED panel 0/7, avg 6.3: looked like generic fintech (indigo slab header, pastel icon tiles, KPI arrow, mini bars, shimmer); bill items hidden under pay sheet; 'Cash mila' looked pre-selected + saved on one tap (Rekha scared); some text 15–16px; saved screen plain. Kept learnings: action list on Home, cash/UPI/udhaar on Home, fewer steps. Screens design/redo4/v1*.
- ❌ v2 "MRP box" (packet yellow, ₹/- MRP box) FAILED panel 0/7 but best yet, avg 7.44 (v1 6.3). Merchants 7.7/7.3/7.7/7.3/8.3, designers 7.3/7.0. Liked: home MRP box, khata maths before save, Save locked till sure. Gaps: packet look stops after Home; Bolo not bigger than tabs, weak listening state; no total udhaar on Home; 4 button styles in one list; stamp/zigzag copied from v6; looks like Blinkit colours. Panel: keep direction, push it through all screens. Owner's question box closed twice (session restarts) → went with recommended defaults, owner can overrule:
  - v3 = keep MRP-box world, every screen redrawn from scratch in it (panel: strongest idea).
  - Payment: hint only ("Aksar udhaar"), nothing pre-selected (money rule kept).
  - Colours: deeper haldi + packet-print maroon, so it doesn't read as Blinkit.
- ❌ v3 "MRP box, full flow" FAILED 0/7, avg 7.93 (up from 7.44). Shyam 8.0 · Aman 8.0 · Rekha 8.3 · Pooja 7.7 · Baldev 8.7 · payments designer 7.7 · super-app director 7.7. Panel: direction right, fix craft: one main-button colour, readable batch code (dots looked like commas, wrapped), only "Bas" while listening, fill listening screen, keep total visible on confirm, aligned steppers, a payoff moment on save, clearer words ("Doosri Maggi dikhao", Hindi "पक्का करो").
- ❌ v4 FAILED 0/7, avg 8.15 (Shyam 8.7 · Aman 7.7 · Rekha 8.3 · Pooja 7.7 · Baldev 8.3 · payments 8.0 · super-app 8.3). Left: two maroon buttons stacked (Save + Aur bolo), listening screen still emptyish + no running total, dashed hints look like buttons, too many outlined boxes, saved screen needs "Agla bill" + a seal moment, Hindi unit text touches stepper.
- ❌ v5 FAILED 1/7 YES (Baldev 9/9/9), avg 8.33 (Shyam 8.0 · Aman 8.3 · Rekha 8.7 · Pooja 8.3 · Baldev 9.0 · payments 8.0 · super-app 8.3). Left: mic scrolls away on confirm/pay (rule break), rows too tall, "Aur bolo" wraps, "aksar" looks pre-selected, seal too small, flat type scale, empty frame while listening, raised tab-bar pill looks generic.
- ❌ v6 FAILED 2/7 YES (Rekha, Pooja 9/9/9), avg 8.74 (Shyam 8.7 · Aman 8.7 · Rekha 9.0 · Pooja 9.0 · Baldev 8.7 · payments 8.7 · super-app 8.7). Left: pay sheet hides 3rd item (Baldev can't check sum), top panel half-scrolls off, two mics at once, dead space in ask sheet, seal looks like a template badge (blur shadow), unit text 17px.
- ❌ v7 FAILED 5/7 YES (Aman, Rekha, Pooja, Baldev, super-app director), avg 8.89. NO: Shyam 8.7 (mic out of thumb reach, small brown text), payments designer 8.7 (band/customer card half-cut under sticky strip, steppers on review screen).
- ❌ v8 FAILED 5/7 YES, avg 8.96 (Shyam 8.7, payments designer 8.7 NO). Left: "Bas" out of thumb reach while listening, picked payment too subtle in sunlight, empty gap above pay sheet, khata line cramped, qty shown twice, Hinglish "Save" vs Hindi "पक्का".
- ❌ v9 FAILED 6/7 YES, avg 9.00 (only payments designer NO: 9/8/9 — pay sheet not pinned to bottom, Save button moves between steps, white strip below; heard-word white box looks like a glitch).
- ✅ v10 "MRP box" PASSED 7/7 YES, avg 9.15 (Shyam 9.0 · Aman 9.0 · Rekha 9.3 · Pooja 9.0 · Baldev 9.3 · payments designer 9.0 ×2 · super-app director 9.3 ×2). Polish applied after pass: "/-" min 14px, Kul row on pay/ready, "/-" on running total, bigger Hindi pay labels, darker tile borders, shorter Hindi undo note. Was at /proto/ (removed 24 Nov). Score path: 6.3 → 7.44 → 7.93 → 8.15 → 8.33 → 8.74 → 8.89 → 8.96 → 9.00 → 9.15.
- ⏸ (superseded by REDO #5) Owner approves v10 on phone → then rebuild ALL merchant screens in this design (Maal, Udhaar, Bill list, Hisaab, Galla, Orders, Settings, receipt, onboarding w/ language), then customer pages (customer panel), then admin (admin panel).
- ⏳ Write DESIGN.md v4 "MRP box" (tokens + rules) when owner approves; current DESIGN.md (v3) moves to design/DESIGN-prev.md.

## UI REDO #5 — 🔄 STARTED 24 Nov (owner: "Redo UI from absolute scratch, forget everything UI UX related")
- v10 (passed 9.15) dropped unapproved; kept at /proto-prev/ + design/redo4/proto-v10-passed.html as archive only, not a reference.
- Kept from the brief (product rules, not UI): text ≥18 / buttons ≥56 icon+word, dictate → review → ✓, udhaar never red, nothing pre-selected for money, Hindi/Hinglish/English, mic reachable everywhere.
- Loop (owner rule): version → 7-member panel (5 merchants ×1, 2 premium designers ×2; pass = all ≥9) → if fail: ONE improvement attempt → panel → if still fail: brand-new design from scratch.
- Panel judges each design fresh (no earlier versions shown).
- Owner (24 Nov, later): use ui-ux-pro-max + impeccable together (no clash). Panel gets an 8th member: an AI-detector who scores 1–10 how NOT-AI-made it looks (lower = more AI); must be ≥8 to pass. If the AI score is the ONLY failing point, the design gets up to 3 improvement rounds instead of 1.
- ✅ Owner: "remove proto" → /proto/ and /proto-prev/ removed from the live site (24 Nov). Copies kept in design/redo4/ + git history.
- Redo #5 versions are built as files in design/redo5/ (not on the live site); panel reviews screenshots. ⏳ Asked owner how to show an approved version on the phone.
- 🗑 Designs A (banknote), B (block print), C (handwritten slip) — all vetoed by owner and deleted on owner request (24 Nov). Restart from square 0.
- Owner answers (24 Nov): vetoes were about everything (look, theme idea, layout); references = Apple, PhonePe, Spotify; light+dark toggle; owner sees labelled screenshots (small translucent watermark: screen + stage) before every panel.
- Design 1 (clean modern, orange accent, centre mic) — owner: "fine, but not up to the mark".
- ✅ Design 2 (teal wallet card, quick actions, docked voice bar) — PASSED owner look; queued for panel.
- Owner rule: panel runs only when owner asks, on all owner-passed designs, one after another.
- ❌ Design 3 (black/gold, shelves) — vetoed by owner.
- ❌ Design 4 (iOS widget grid) — vetoed by owner.
- ⏸ Design 5 (chat thread) — owner: neither pass nor fail; ASK OWNER what to do with it just before running the panel.
- ⏸ Design 6 (bank-style timeline) — HOLD; owner: needs AI-reduction steps before panel.
- 🔄 Design 7: monochrome + lime, Schibsted Grotesk, hairline rows (no cards/avatars/blur/KPI arrows) — AI-reduction baked in; waiting for owner look.

## S5 · Daily payoff
- ✅ Home shows real today's sales and udhaar.
- ✅ Aaj ka hisaab screen — Aaj/Kal/7/30 din: sales, cash/UPI/udhaar split, udhaar collected, avg bill, busiest hour, top 5 items. Supplier dues shown once receipts exist.
- ✅ Galla screen — type or say drawer cash, compared with today's cash bills.
- ✅ Morning briefing card on Home (yesterday, who to collect udhaar from + days waiting, streak) + daily 3-item count (/check: corrects stock, shows gaps). Restock advice waits for forecast (owner).
- ✅ Forecast card on Maal: 'Seekh raha hai' with progress until 14 sale-days, simple low-stock meanwhile; then 'Jaldi khatam hoga' with ~days left from last 14 days of real sales. 'This week will sell' prediction still pending (needs more data).

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
- ✅ .context/ compressed memory (INDEX + topic files); session start reads INDEX + TASKS + graphify only.
- ✅ graphify code graph — `graphify-out/` (run `graphify update app/src` after code changes).
- ✅ README updated.
