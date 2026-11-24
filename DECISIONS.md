# Decisions (fresh start, 21 Nov 2026). Old build's decisions were dropped; each is re-asked.

| # | Decision | Answer |
|---|---|---|
| 1 | Build order | One work section at a time; each live, tested, reported before the next |
| 2 | Skills | Keep the skills already in `.claude/skills`; nothing more to import |
| 3 | App name | OmniOS Dukaan |
| 4 | Tabs | Ghar · Bill · Maal · Udhaar (Home, Bill, Stock, Udhaar). Labels follow chosen language. Mic above tabs on every screen |
| 4b | Languages | Hindi (Devanagari), Hinglish (Roman), English. Picked at first launch, changeable in Settings |
| 4c | Settings | Gear + word on Home top bar |
| 4d | Look | Warm market + premium (exact values in DESIGN.md) |
| — | Database | Wipe old Supabase tables, rebuild clean in same project |
| — | Vercel | Live project is `omnidukaan` |
| — | Git | Push straight to `main` (owner override of the session's branch rule, 21 Nov) |
| 8 | Mic speaks answers aloud | Yes for answers to questions ("Cheeni kitni bachi?"); bills/stock show the review card silently. Settings: speak answers on/off + speed (slow/normal) |
| — | Vercel | Owner (21 Nov, later): `omnios-dukaan` must NOT be deleted; it is the publish target. Both `omnios-dukaan` and `omnidukaan` build from `main` (root `app`). |
| — | Admin login | admin@omni.in (created 21 Nov). Password set by owner; change it before real pilots. |
| 5 | Selling price | Owner's manual price, else learned: a price becomes the item's price after it is billed 3 times at that price. Until then the bill line asks for the price (prefilled with the last one, highlighted). One discount field per bill. |
| 6 | Bill edits / returns | By voice: owner says "wapas" + item names (+ customer). OmniOS finds that customer's latest bill with those items and updates it (stock back, total and udhaar adjusted) after the review ✓. Plus Undo right after saving. |
| 7 | Expiry dates | Not in Phase 1. |
| — | Gemini key | Ask again in the next iteration (before receipts, S3). |
| — | Online store (23 Nov) | See ONLINE_STORE.md. Pickup only; public name link separate from login code; QR in app; link on bills; name+phone; Accept→Pack→Ready→Bill; requests ("Mangwao") list + WhatsApp "aa gaya" (Phase 2 AI agent later, with approval); shop price; discount at billing; customer can edit/cancel open orders; max 3 open per phone; phones visible to shop only. |
| — | Same-name customers | Tag ("Pehchaan") asked when a 2nd same name is created; "Yeh nahi, naya …" on review; phone match auto-selects. |
| — | After save | Only "Ghar" button. |
| — | Maal quantity | Set exact count ("Abhi kitna hai?"). |
| — | Add person (Udhaar) | Name + phone + old udhaar (optional). Khata photo OCR requested now (brief had it in Phase 2) — after receipts. |
| — | Security | PIN lockout 5 tries/10 min; logged-in phones visible to owner and admin with log-out. |
| — | Phone at billing | Optional keypad after payment; WhatsApp to that number; editable from Bill detail. |

## Login security (23 Nov 2026)
- Login goes through the `login` edge function. The real password is HMAC(service key, CODE:PIN), so PINs can't be guessed against Supabase directly. Old-style passwords move over on first login.
- 5 wrong PINs lock that shop code for 10 minutes. Trade-off: someone could lock a shop out on purpose; admin "Reset PIN" clears it.
- Removing a phone blocks its data access at once (database check on its session); the phone is sent to the login screen next time it opens. Reset PIN removes all phones.
- If the Supabase service key is ever rotated, every shop needs a PIN reset from /admin.

## UI redo process (23 Nov 2026, owner)
- Look chosen by test: 3 internal versions → simulated owner panel → "Standard clean" (white + green) won round 1 (7.6 vs 6.6 signboard, 5.3 khata).
- From now on: ONE design per round, tested by the people who use it (merchants for merchant screens, customers for customer pages, the admin persona for /admin). Pass = every persona ≥ 9/10 on ease, calm, trust → ship. Fail → back to the drawing board (new design, not a patch).
- Text minimum stays 18px (brief) even if a panel suggests smaller.

## UI redo #3 (23 Nov 2026, owner)
- Current UI rejected as "hollow": too empty/plain, no personality, lifeless.
- Redo look AND flows from scratch (within the brief: 4 tabs + one mic, dictate → review → ✓).
- Test: 3 totally different simulated merchants must all review the look and feel positively (plus designer "not AI" check).
- Owner approves a live prototype (Home + bill flow) on his phone BEFORE any full rebuild.

## UI redo #5 (24 Nov 2026, owner)
- v10 "MRP box" passed the panel but owner asked for a full redo from absolute scratch, forgetting all earlier UI/UX.
- Loop: each design gets the panel, then at most ONE improvement round; still failing → new design from scratch.
- (later, 24 Nov) Panel adds an AI-detector (score ≥8/10 = looks human-made). If only the AI score fails → up to 3 improvement rounds. Skills: ui-ux-pro-max + impeccable together.
