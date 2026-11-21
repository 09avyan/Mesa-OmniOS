# PROJECT.md — OmniOS brief (owner: Avyan). Read at the start of every session.

ROLE
You are my builder in Claude Code. I'm Avyan, a student founder in Indore, India, building OmniOS for the Mesa Future Founders Challenge and beyond. I can't read code. Tell me what changed and what to tap, in plain words. No flattery, no restating this brief. If something I say contradicts this brief, flag it before acting.

FIRST
1. Save this brief as PROJECT.md in the repo and read it at the start of every session.
2. Ask me each OPEN DECISION (bottom) only when you reach it.
3. Ask every question with many options (3-5): recommended first, one line each on what it changes. Batch independent questions.
4. (Added 21 Nov 2026) You may ask me questions whenever and as many as needed.

WHAT OMNIOS IS
A voice-native app that runs a kirana (neighbourhood grocery) store for owners who have never used software, many of whom struggle with phones. The owner talks or takes a photo; OmniOS does the rest. Used for real pilots with kirana owners, competition demos, and further building.
- Phase 1: the store app (BUILD NOW, live by Thu 3 Dec 2026).
- Phase 2: smart assistant (Coming soon).
- Phase 3: quick-commerce network (Coming soon).
- (Added 21 Nov 2026) Phase 2 and 3 get real Coming soon UI plus light backend groundwork.

RULE: NOTHING FAKE IN THE APP
- Everything either works for real or is a clearly labelled "Coming soon" screen with a short, friendly Hindi/Hinglish explanation.
- No fake data, no scripted demos.

========== UX AND UI: TOP PRIORITY, ABOVE FEATURES ==========
The app must feel extremely smooth, calm and pleasant, and be easy enough for someone who only uses WhatsApp.

Navigation
- 4 tabs at most at the bottom, each with an icon plus a Hindi word. A home screen with the day at a glance.
- Max 2 taps from home to anything. A clear back button on every screen. No hidden gestures, no tiny menus.
- Same layout, colours and button positions everywhere. The main action is always in the same place.

Readability
- Body text at least 18px, numbers bigger. High contrast that's readable in a bright shop.
- Plain words: "Maal aaya", "Udhaar", "Aaj ka hisaab". Never jargon.

Touch and feedback
- Buttons at least 56px, icon plus word, never icon-only.
- Every tap responds within 0.1s, with a visible change plus a light sound or vibration.
- Success gets a tick and a short, happy moment. Undo instead of "are you sure?".
- Friendly errors that say exactly what to do next. Loading, empty and error states are warm and in the owner's language.

Motion and look
- Smooth, subtle transitions (150-250ms, eased). Nothing flashy or slow.
- A mix of clean premium (generous space, one confident accent) and a warm local Indian-market feel (warm colours, friendly bold type).
- Propose exact values (colours, fonts, sizes, radius, spacing, motion) in DESIGN.md before the first screen.

Testing
- Before reporting, test every screen as a first-time, non-tech owner would, using phone-size screenshots.
- Ask yourself: could a 55-year-old shopkeeper do this without help?

========== VOICE: THE HEART OF THE APP ==========
ONE MIC, EVERYWHERE
A big mic button is on every screen, in the same spot. The owner presses it from anywhere and just talks. OmniOS works out the intent and goes to the right flow automatically:
- "Sharma ji, 2 kilo cheeni, 1 Maggi" -> a bill
- "Maal aaya, 10 Aashirvaad atta" -> stock added
- "Gupta ji ne 500 diye" -> udhaar payment logged
- "Cheeni kitni bachi?" -> answer shown and spoken back
- "Galla mein 4,200 hai" -> cash count for the galla match
- Mixed Hindi, Hinglish and English; brand names; numbers in words or digits.

THE VOICE FLOW (always the same 3 steps)
1. DICTATE: the owner speaks the whole task in one go and sees live words as they talk.
2. REVIEW: a clean card shows exactly what OmniOS understood (items, qty, price, customer, total). Anything unsure is highlighted.
3. CORRECT + DONE: the owner taps any line to fix it, by voice or by tap. One big ✓ "Done" saves.
Nothing is ever saved without that review and ✓.

Tech
- The browser's speech recognition (hi-IN, en-IN) for the words.
- A rule-based intent and item parser first: a synonym list, fuzzy matching, units.
- Gemini only when the rules aren't sure.

========== PHASE 1: STORE APP (BUILD NOW) ==========

SETUP
- I create stores in the admin dashboard (store code + 4-digit PIN). No public sign-up.
- The owner speaks the opening stock once, using the same dictate -> review -> done flow.

DAILY LOGGING
- Receipt photo -> stock (the differentiator):
  1. The owner photographs the supplier receipt.
  2. Gemini reads every line (item, qty, buying price, MRP if printed).
  3. The review card highlights unclear lines; the owner fixes them by voice or tap, then ✓.
  4. Stock updates, and a supplier due is created (paid or credit, with due date).
  - OmniOS never places orders with suppliers.
- Item name matching without AI where possible: cheeni = shakkar = sugar = Madhur Sugar 1kg. Fuzzy spelling and units. A new name asks once and remembers.
- Billing by voice or search:
  - Simple itemised bill (no GST). Cash or UPI recorded, never collected in-app.
  - Walk-in customer: nothing required.
  - Unrecorded item: allow the sale, flag "record a receipt".
- The bill goes to the customer as a WhatsApp share link to a simple bill page, switchable Hindi/English (defaults to the customer's last choice, Hindi if new).
- Udhaar ledger: credit added from bills, payments logged, reminders shared as WhatsApp links to a balance page.

DAILY PAYOFF (the reason to open the app every day)
- Aaj ka hisaab (daily close): today's sales, cash vs UPI, udhaar given and collected, supplier money due. NO profit (that comes in Phase 2).
- Galla match: the owner speaks the cash in the drawer, and OmniOS shows whether it matches the cash bills. A gap shows as "kuch bill chhoot gaya?" (did a bill get missed?).
- 3-item daily stock check: the owner counts 3 rotating items by voice. Mismatches flag missing entries and correct stock.
- Morning briefing: yesterday's hisaab, what to restock, who to collect udhaar from.
- Daily streak: "7 din ka hisaab poora" (7 days of accounts done). A light nudge, not a game.

FORECAST (real, and it improves with time)
- "Buy before it runs out": warns before stock runs short, based on sales speed and the learned delivery pattern of each supplier and item.
- "This week will sell": a prediction from real sales history.
- It needs data first. Show an honest "Seekh raha hai" (learning) state with a progress indicator, e.g. "Forecast gets better after 2-4 weeks of daily use."
- Before enough data, show only simple low-stock alerts. Never invent predictions.

CUSTOMER SIDE
- Store order site: a per-store web page where customers browse in-stock items with prices, order online, and pick up later.
  - The owner can hide items.
  - Orders land in the app's Orders screen with a sound. The owner accepts, packs, marks it "Ready", and turns it into a bill.
  - The customer sees the status on the page.
  - No online payment: pay at pickup.
  - A printable QR poster for the counter links to the site.
- Free ad-printed carry bags: an app screen where the owner requests a free bag pack ("Free thaile mangao"), and I see the requests in admin. The bags carry ads from local businesses and brands. The app only handles the request and tracking; I handle supply.

ADMIN DASHBOARD (only me): complete, organised
- Create stores, reset PINs, pause/delete stores.
- Read-only view of any store's data.
- Usage per store (bills/day, receipts, voice commands, orders, galla matches, streaks, active days), CSV export, and a quotable pitch summary line.
- Bag requests.
- Room for subscriptions later.

MONEY SIDE
- A T&C page with a data-use clause (anonymised, aggregated data may be shared/sold).
- Hidden "pitch mode" business model screen. Streams:
  - ad-printed bags
  - kirana subscription (price TBD, kept low)
  - brand promos
  - aggregated data
  - NBFC loan referral commission
  - Phase 3 revenue: TBD

========== PHASE 2: SMART ASSISTANT (Coming soon screens) ==========
- AI agents: udhaar collection (follows the owner's rules), customer orders, promo suggestions. Each task is set to autopilot or approve-first.
- Khata (paper ledger) photo import. Offline mode.
- Mini NBFC loans based on the store's ledger, to replace expensive supplier credit (lower costs, higher earnings). Via licensed partners; OmniOS earns a referral commission.
- Profit tracking (last item in Phase 2).

========== PHASE 3: NETWORK (Coming soon screens) ==========
- Consumer quick-commerce app with delivery. Routing: the nearest store with every item, or a split across 2 nearby stores. Delivery by the store helper or a partner.
- Customer credit from their own kirana (the store bears the risk).
- Nearby-store trends, brand offers, data insights.

TECH
- Hosting: Vercel. Data: my free Supabase.
- Each store sees only its own data. Admin access is locked to me.
- Gemini free tier key (I'll create it when you ask), kept server-side as a Supabase secret, never in the browser.
- Seed an Indore kirana catalogue with a Hindi/English/brand synonym list. Include 3 sample receipts (one handwritten) for testing.
- Online only for now. ₹0 spend; ask before anything that costs money.

ACCEPTANCE (tap tests)
1. Home -> mic -> "Sharma ji, 2 kilo cheeni, 1 Maggi" -> review card -> fix Maggi to 2 -> ✓ -> bill saved, stock drops, WhatsApp share ready.
2. Bills screen -> mic -> "Maal aaya, 10 Aashirvaad" -> goes to stock review -> ✓ -> stock rises.
3. Mic -> "Gupta ji ne 500 diye" -> udhaar payment review -> ✓ -> balance drops.
4. Sample handwritten receipt -> unclear lines highlighted -> fix by voice -> ✓ -> stock and supplier due update.
5. "Madhur Sugar 1kg" on a receipt -> matched to Cheeni (asks once if new).
6. Speak galla cash 300 less than cash bills -> gap shown with a friendly message.
7. New store forecast -> "learning" state, no invented numbers.
8. Customer orders on the store site -> it appears in the app with a sound -> Ready -> customer page shows Ready -> converted to a bill.
9. Any Phase 2/3 item -> clear Coming soon screen.
10. From home, any feature is reachable in at most 2 taps. Admin: create a store -> log in on a phone -> only that store's data shows.

OPEN DECISIONS (ask me with many options when you reach each)
1. Build order: one feature at a time or all at once.
2. Copy my default skills from my private "skill" repo first?
3. App name owners see.
4. Home screen layout and the 4 tabs.
5. Selling-price rule. (Suggested: receipt MRP -> learned from the first voice bill -> cost + one category margin %; unpriced items hidden on the store site.)
6. Bill edits and returns.
7. Expiry date tracking.
8. Whether the mic speaks answers aloud by default.
9. Switching to offline hybrid.
10. Anything that costs money or can't be undone.

REPORT BACK after each chunk
BUILT / LIVE (link) / SEEN WORKING / NOT TESTED / TAP TEST (3 lines) / DECIDED FOR YOU / KNOWN ISSUES / NEXT.
Write "fixed" only for things you watched work after the change.
