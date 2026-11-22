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
