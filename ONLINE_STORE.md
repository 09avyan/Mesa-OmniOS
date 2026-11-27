# ONLINE_STORE.md — flows (agreed 23 Nov 2026)

Pickup only (delivery = "Coming soon"). Orders can be placed any time (shop closed = order for later).

## How customers find it
- Public link `/s/<public-name>` (e.g. `/s/sharma-kirana-rajwada`), set by admin, **separate from the login code**.
- QR poster: printable, and a "Meri online dukaan" section in the shop app shows the QR on screen (no stand needed).
- Every WhatsApp bill footer: "Online order karein: <link>".

## Customer flow (/s/<name>, no login)
1. Shop header + "Online order on/off" state. If off: "Abhi online order band hai" (browse only).
2. Search bar + category chips + "Pichhla order dobara" (repeat last, remembered on their phone).
3. Only visible, priced items. In stock → "+ Add". Out of stock → **"Mangwao" (request)**.
4. Cart → name + phone (remembered on their phone) → "Order bhejo".
5. Status page `/o/<token>`: Bheja → Mana/accepted → Pack ho raha → Ready (pickup) → Done, or Cancelled/Rejected with reason. Customer can cancel until accepted. Changed items (nahi hai) shown with new total.
6. Pay at pickup.

## Merchant flow (app)
- Home row "Online orders" shows count badge; new order plays a sound while app is open.
- Orders screen tabs: Naye · Chal rahe · Ho gaye.
- Order: Accept / Reject (reason) → Packing checklist (tick, or mark "nahi hai" → customer sees new total) → "Ready" → at pickup "Bill banao" opens normal review (cash/UPI/udhaar, phone prefilled) → bill saved, order Done.
- **Requests ("Mangwao")**: separate list "Grahak ne maanga": item, how many customers, who (name+phone), when. Owner taps "Order karunga" / "Aa gaya" (when stock arrives, customers can be told on WhatsApp).
- Settings → "Meri online dukaan": on/off switch, link, QR (show / print / share).

## Other agreed changes
- Bill: after payment, optional "Number?" keypad (pre-filled for saved customers); WhatsApp goes to that number. Phone can be added/changed from Bill detail.
- Same-name customers: tag ("Pehchaan", e.g. "gali 4"); "Yeh nahi, naya …" on review; phone match auto-selects.
- Security: PIN lockout after 5 wrong tries (10 min); logged-in phones listed for owner (Settings) and admin, with "Log out this phone".
