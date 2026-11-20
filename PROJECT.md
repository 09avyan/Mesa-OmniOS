# OmniOS — Project Brief (read at the start of every session)

Owner: Avyan, student founder, Indore. Built for the Mesa Future Founders Challenge and beyond.

## Working rules for Claude
- Builder role. Owner can't read code: report what changed and what to tap, in plain words. No flattery, no restating this brief.
- If an owner message contradicts this brief, flag it before acting.
- Ask each OPEN DECISION only when reached. Every question: 3-5 options, recommended first, one line each on what it changes. Batch independent questions.
- Delegation: at most 1 Haiku + 1 Sonnet subagent, only for simple tasks that don't need the lead (see `.claude/skills/delegate`). Be usage-efficient.
- After each reasonable chunk: push to `main`, update README.md, update the graphify graph (`graphify-out/`). Use graphify queries before broad file reads.

## What OmniOS is
An intelligence layer for kirana owners who use no software today, many not comfortable with phones. Used for real pilots, competition demos, and further building.
- Phase 1: the real store app (built now).
- Phase 2: AI agents that do work for the owner (Coming soon).
- Phase 3: kiranas become quick-commerce nodes for our own consumer app (Coming soon).

## Rule: nothing fake in the app
- Everything either works for real or is a "Coming soon" screen.
- Coming soon = short friendly explanation in Hindi/Hinglish. No fake data, no scripted demos.
- Future-feature depictions are separate videos, not in the app.

## Ease of use (top priority, above features)
- One main job per screen. Max 2 taps from home to any core task (bill, receipt, udhaar).
- Big buttons (≥56px), icon + short Hindi word. Never icon-only or text-only.
- Body text ≥18px, numbers bigger, high contrast, readable in a bright shop.
- Same layout, colours, button positions on every screen. Main action always in the same place.
- Voice works everywhere input is needed. Mic button always visible.
- No hidden gestures (no swipe-only, long-press-only, tiny menus). Clear back button on every screen.
- Confirm with big ✓ / ✗. Undo instead of "are you sure?".
- Plain words: "Udhaar", "Maal aaya", not "inventory sync".
- Clear feedback on every action: visible change, short sound/vibration, success tick.
- Friendly errors that say exactly what to do next.
- Test each screen as a first-time non-tech user. Check: could someone who only uses WhatsApp do this without help?

## Users, device, language
- Store owner only, mid-range Android, Chrome, 360px width, web link added to home screen.
- Login: store code + 4-digit PIN, created by admin. No public sign-up.
- Language: Hindi (Devanagari) and Hinglish, switchable.

## Phase 1: real app

### Capture (core edge: near-zero effort)
- Onboarding: owner speaks opening stock ("cheeni 25 kilo, Maggi 3 dabba"). Show transcript, then confirm.
- Supplier receipts: photograph → Gemini reads every line (item, qty, buying price, MRP if printed) → overview with unclear lines highlighted, fixed by voice or tap → on confirm, posts to inventory. Never places orders with suppliers. Nothing saved without confirmation.
- Item matching engine, without AI where possible: Hindi/English/brand synonym lists (cheeni = shakkar = sugar = Madhur Sugar 1kg); fuzzy spelling and unit normalisation (kg/g/packet/dabba); known matches merge silently; a new name asks once ("Is this the same as Cheeni?") and remembers; Gemini only as fallback.
- Supplier dues: each receipt paid or credit, with due date and in-app reminder ("Pay Sharma Traders ₹4,200 by Fri"). Nothing sent to suppliers.
- Delivery pattern spotting: learn when each supplier/item usually arrives, from receipt history.

### Inventory and insight
- Stock levels and dead stock.
- Low stock = item won't last until its next expected delivery (sales speed + delivery pattern).
- "What to buy and how much" list with a simple reason per item, from real data.
- Morning briefing in-app: yesterday's sales, restock, stuck stock, supplier dues.
- Coming soon: forecast chart, neighbourhood trends.

### Billing
- Add items by voice ("Sharma ji, 2 kilo cheeni, 1 Maggi") or search. Bill fills in, owner confirms.
- Simple itemised bill (no GST). Daily cash/UPI tally. UPI only recorded, never collected in-app.
- Walk-in: nothing required. Name/phone only to send bill or add udhaar.
- Item not in inventory: allow sale, negative stock, flag "record a receipt for this".
- Bill to customer: one-tap WhatsApp share with a link to a bill page on our site. Bill page switches Hindi/English, defaulting to customer's last choice (Hindi if new). Dead simple to read.

### Udhaar (credit)
- Ledger of who owes what and payments.
- Reminders shared as WhatsApp links to a simple balance page.

### Store order link (real or Coming soon — ask owner)
- If real: per-store order page of in-stock items with prices (owner can hide items); orders land in an Orders tab and continue into a pre-filled bill; fulfilment by store helper (pay on delivery, cash/UPI) or pickup; printable QR poster.

### Money side
- Terms & Conditions page with data-use clause (anonymised, aggregated data may be shared/sold).
- Hidden "pitch mode" business model screen. Streams: brand promos/schemes; aggregated anonymised data sales; ad-printed carry bags; NBFC mini-loan referral commission (ledger-based); Phase 3 revenue: TBD; kirana subscription: TBD.
- Coming soon: brand promo cards, loan eligibility.

### Admin dashboard (owner only), complete and organised
- Create stores, reset PINs, pause/delete stores.
- Read-only view of any store's data.
- Usage stats per store (bills/day, receipts, voice entries, orders, active days, udhaar entries), CSV export, quotable pitch summary line.
- Room for subscriptions and billing data later.

## Phase 2: AI agents (Coming soon in app)
Agents section with Coming soon screens: 1) Udhaar collection (owner's rules, owner approval); 2) Customer orders; 3) Promo suggestions from slow/dead stock and brand schemes. Each says what the agent will do and that the owner stays in control (per task: autopilot or approve first).

## Phase 3: quick-commerce nodes (Coming soon in app)
One screen. Our consumer app sends orders to the nearest store with all items in stock; else splits across the 2 nearest stores that cover it. Offers the trusted local store, credit (store's own regulars only, store bears risk), cheaper prices, loose/local items, and works where quick commerce doesn't deliver.

## Later (design data now, build only when told)
Khata page photo import; offline-first hybrid mode; subscriptions in admin; real Phase 2 agents; real Phase 3 routing engine and consumer app.

## Tech
- Hosting: Vercel. Data: owner's free Supabase.
- Each store sees only its own data. Admin access locked to owner.
- AI: Gemini free tier (ask owner for key), server-side as a Supabase secret, never in browser.
- Voice: browser speech recognition (hi-IN, en-IN).
- Seed an Indore kirana catalogue + 3 sample supplier receipts (one handwritten).
- Online only for now. ₹0 spend; ask before anything that costs money.
- Test own work: run it, phone-size screenshots, tap tests before reporting.

## Look and feel
- Clean premium (minimal, generous space, one confident accent) mixed with warm local Indian-market feel (warmer colours, friendly bold type). Ease of use wins over style.
- Exact values (colours, fonts, sizes, radius, spacing, motion) in DESIGN.md before the first screen.
- Every tap responds within 0.1s. Loading, empty and error states friendly and in the owner's language.

## Acceptance (tap tests)
1. Mic: "cheeni 25 kilo" → transcript shows. ✓ → stock is 25 kg.
2. Sample receipt → overview with an unclear line highlighted. Fix by voice, ✓ → stock rises, supplier due created.
3. Receipt "Madhur Sugar 1kg" → matched to Cheeni (asks once if new).
4. Voice bill "2 kilo cheeni, 1 Maggi" → bill filled. Save → stock drops. Share → WhatsApp opens with bill link.
5. Bill link on another phone → readable bill. Language toggle works.
6. Bill an unrecorded item → sale goes through, item flagged.
7. From home, bill / receipt / udhaar each open in ≤2 taps.
8. Agents or Phase 3 → clear Coming soon screen, no fake data.
9. Admin creates a store → log in on a phone → only that store's data. Usage stats rise, CSV downloads.

## Open decisions (ask when reached)
1. Build order. 2. Copy default skills from private "skill" repo? 3. App name owners see. 4. Home screen layout. 5. Selling-price rule (suggested: receipt MRP → learned from first voice bill → cost + category margin %; unpriced items hidden from customers). 6. Bill edits and returns. 7. Expiry date tracking. 8. Store order link: real or Coming soon. 9. Semis additions and pilot timing. 10. Switching to hybrid offline. 11. Anything that costs money or can't be undone.

Decided answers are logged in DECISIONS.md.

## Report format after each chunk
BUILT / LIVE (link) / SEEN WORKING / NOT TESTED / TAP TEST (3 lines) / DECIDED FOR YOU / KNOWN ISSUES / NEXT. "Fixed" only for things watched working after the change.
