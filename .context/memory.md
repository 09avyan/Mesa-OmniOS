# Everything else I know (carried over from earlier sessions). Open on need.

## Owner quotes on quality (verbatim, keep as the bar)
- "The current UI feels hollow, redo every UI and UX from absolute scratch, use all and any skill which improves UI and UX" (hollow = too empty/plain, no personality, lifeless)
- "this version is trash, It should look very professional and amazing"
- "it should not have any AI feel anywhere, not even a pixel, it should look utterly professional but should pass the feed back loop"
- "The UI should not look AI at all, use UI UX pro max and impeccable skills" · "UI needs to look ultra professional while being approving to the feedback loop"
- "Ask me more if you feel so, try not to assume anything radical or critical" · "If required you can ask more" · "Ask me all questions you require"
- Benchmark: "Choose whatever is the best fit… just nothing should look AI made, you are free to surf all the web you want"
- Redo #4 answer: "make versions one by one, after each version take the feedback of all… one version made, feedback if pass then apply else redo from scratch"

## Owner request history (chronological)
1. Continue dev with graphify + README. 2. TEST shop: top 150 items (brands, loose, flavours); build unbuilt pages; ask approvals in TASKS. 3. Approved build order (receipts, briefing, forecast, returns, admin usage+CSV, UI redo, speed+settings). "Restock advice comes with forecast later". Edge cases/sponsored/photos/khata OCR → "All later, remind me, keep in tasks". T&C wording approved. 4. Add master `.items` file task (every item any current/future store could sell; reduce Gemini). 5. UI redo: merchant → customer → admin; one version per round; relevant panel; pass or back to drawing board. 6. Redo #3 from scratch with 3 then 5 distinct merchants + designer; owner approves prototype on phone first; language at onboarding + Settings. 7. Redo #4 (24 Nov): see ui-redo-4.md. 8. .context memory (this folder); README tells how to update it.

## Panel method (how I ran it)
- Personas simulated by a subagent given phone-size screenshots (390×844, scale 2) of every state + persona sheets; each persona scores Look/Feel/Ease (merchants) or Professional/Not-hollow/Not-AI (designers) 1–10 with concrete fixes; verdict PASS only if all ≥9.
- Old agent IDs (dead after session ends): merchant a47c534b3c5dde9e2, customer ae464423ef0b76b82, v6 panel ade411624015b0fea.
- Panel-found issues worth remembering: wrong Save reason shown; dock covering items; double rules read as glitch; orphan rows; Hindi reph clipped; letter-spacing breaks Devanagari; Hindi baseline high in buttons; stamp covering items.

## Screens / flows that must exist in any redesign
- Merchant: Language → Login (code+PIN) → Home (sales today, briefing, streak, 3-item count, orders badge, QR, Settings) · Bill tab (today's bills, detail, WhatsApp, delete/undo, bill by choosing) · Voice review (customer, items w/ steppers, unsure Haan/Doosri, price pad, discount, Cash/UPI/Udhaar, phone keypad, Save, saved screen + Undo) · Maal (stock list low-first, item sheet: price/count/online, forecast card, receipt photo flow, add stock) · Udhaar (total, people by balance, add person, Paise mile, WhatsApp reminder) · Hisaab (Aaj/Kal/7/30, supplier dues) · Galla · Orders (Naye/Chal rahe/Ho gaye/Maange gaye, packing, Ready, → bill) · Meri online dukaan (QR, on/off) · Settings (language, UPI ID, phones, speak answers) · Free bags · T&C · Coming soon.
- Customer (public): bill page /b/, balance page, store /s/<name> (search, categories, cart, Mangwao, repeat), order status /o/.
- Admin /admin: stores (create, reset PIN, pause, delete, store link, phones), bag requests, feature interest; to add: usage + CSV + pitch line + read-only view.

## Errors / lessons
- pkill self-kill → setsid. A Briefing edit once dropped StockCheck (restore from git show HEAD). Python heredoc strings with apostrophes break.
- Gemini 2.x retired (404); 3.x free tier 503/timeouts; WORKER_RESOURCE_LIMIT fixed with AbortSignal timeouts.
- graphify 0.9.118 writes to app/src/graphify-out; copy to root graphify-out/.

## Not built / open
- Settings field for shop phone. Admin password change (owner). Pitch-mode screen not approved. Forecast "this week will sell" needs data. Maal long list → search-first/sections.
