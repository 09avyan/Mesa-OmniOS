# OmniOS Dukaan — Product Overview

> Version 1 · 25 November 2026 · Confidential
> Purpose: a single document that explains the whole product: what it is, who it is for, how it works, how it is built and how it compares to alternatives. Written to be read by a person or loaded into an AI agent as context.

---

## 1. Summary

**OmniOS Dukaan is a voice-first app that runs an Indian kirana (neighbourhood grocery) store.**
The shopkeeper speaks an order the way they would say it to a customer, for example:

> "Sharma ji, do kilo cheeni, ek Maggi, aadha kilo toor dal"

The app turns that into a correct bill, updates stock and the customer's credit book (khata), takes payment (Cash, UPI or Udhaar) and sends a professional e-bill on WhatsApp.

| Fact | Value |
|---|---|
| Product type | Installable web app (PWA) for Android phones; no app store needed |
| Primary user | Kirana shop owner (often 40–65, busy, one hand on the counter) |
| Languages | Hindi, Hinglish (Hindi in Latin letters), English |
| Product knowledge | 1,500 products and 5,226 flavours / pack sizes built in |
| Live URL | omnidukaan.vercel.app (admin at `/admin`) |
| Status | Live; final design implemented; preparing pilot shops |

---

## 2. The problem

1. **Kirana stores run on memory, a notebook and a calculator.** Totals, stock and credit are tracked by hand.
2. **Typing does not fit the counter.** One hand gives change; there is a queue; searching menus for "Maggi 70g" does not happen.
3. **Udhaar (customer credit) is the biggest money risk.** Balances live in a diary, are forgotten, and reminding customers is awkward.
4. **Stock is a guess.** Items run out without warning; supplier dues are on paper slips.
5. **Most business apps are built for typing and English.** Owners think and speak in Hinglish or Hindi.

---

## 3. The solution and its rules

The whole app is designed around speaking. One teal **"Bolo"** (speak) bar sits in the same place on every screen. Everything else is a large, clear tap.

| Rule | What it means |
|---|---|
| Speak, don't type | Bills, stock arrival, udhaar payments and questions all start with the voice. Typing is the fallback. |
| Never block the bill | Doubts are asked inline under the item ("Yahi wali? Haan / Nahi"). Flavours are auto-picked with a quiet "badlo" (change). |
| Money is the owner's tap | Cash / UPI / Udhaar is never pre-selected. |
| Readable by everyone | Text at least 18px; buttons at least 56px with an icon and a word; three languages; light and dark mode. |
| Nothing is lost | Bills can be undone; no shop data is deleted without the owner. Test/mock data lives only in the TEST shop. |

---

## 4. Users

| User | What they do | Where |
|---|---|---|
| Shop owner | Bills, khata, stock, daily accounts — by voice | Main app (shop code + PIN) |
| Customer | Receives e-bill, sees their khata balance, orders online | Public links: `/b/<token>` bill, `/k/<token>` khata, `/s/<slug>` store, `/o/<token>` order |
| OmniOS admin | Creates and manages shops | `/admin` dashboard |

---

## 5. How a bill happens (core flow)

1. **Speak.** Owner taps Bolo and speaks. Items appear live under the spoken words with a running total ("Ab tak").
2. **Check.** The app lists items with quantity and the shop's own price. If unsure, it asks right under that item: "Yahi wali? Haan / Nahi". "Nahi" opens a "which one?" list. Bottom bar: total + "Paisa lo" (take payment).
3. **Pay.** A bill summary, then three equal buttons side by side: **Cash · UPI · Udhaar**. Nothing is pre-selected.
   - UPI shows a large QR code with the amount already inside.
   - Udhaar shows the customer's old balance → new balance.
4. **Saved.** Stock and khata update in one server transaction. The owner can send the e-bill on WhatsApp, start the next bill, or undo.

Other voice commands:

| Say | Result |
|---|---|
| "Maal aaya, 10 Aashirvaad atta" | Stock added |
| "Gupta ji ne 500 diye" | Udhaar payment recorded |
| "Cheeni kitni bachi?" | Stock answered aloud |
| "Galla mein 4,200 hai" | Cash drawer checked against today's cash bills |

---

## 6. Features (live)

### 6.1 Billing
- Understands Hinglish, Hindi and English, including common mis-hearings.
- Quantities like "aadha kilo", "dedh", "do packet"; customer name picked from the sentence; walk-in customers supported.
- Bill by tapping items when voice is not possible; discount; undo.

### 6.2 Udhaar (credit) khata
- Every customer's balance and history; biggest dues shown on Home.
- One-tap WhatsApp reminder; public khata link for the customer.

### 6.3 Stock (Maal)
- Stock in by voice or by photo of a supplier bill (also records supplier dues).
- Daily 3-item stock count with a streak; simple sales forecast.

### 6.4 Hisaab (accounts)
- Sales by day / week / month with Cash / UPI / Udhaar split; galla (cash drawer) check; morning briefing.

### 6.5 Customer side
- Professional e-bill: shop letterhead, bill number, customer, date and time, each item with flavour and size, quantity × rate, total, payment status.
- Shop's own online store and order tracking.

### 6.6 Admin dashboard
- Sidebar navigation, search, filters, key figures; create, pause, resume and delete shops; reset PIN; logged-in phones; bag requests; demand.

### 6.7 Settings
- Language, light / dark / follow-phone, sound, UPI ID, logged-in phones, online store.

---

## 7. The Universe and the flavour engine

**The Universe** is the built-in product list, so a shop never has to set up a catalogue.

| Fact | Value |
|---|---|
| Products | 1,500 (staples, spices, dairy, snacks, drinks, personal care, cleaning, pooja, baby, pet, stationery, hardware-lite, OTC) |
| Flavours and pack sizes | 5,226 (e.g. Maggi Masala 70g, Coca-Cola 750ml, Aashirvaad atta 5kg) |
| Names | Hindi, Hinglish, English, plus spoken aliases and mis-hearings |
| Default | Exactly one default flavour/size per product |
| Size / speed | Loads once (~114 KB compressed), cached on the phone; matches a spoken word in ~4 ms |

**Prices belong to each shop.** The Universe holds names only. A shop's price comes from stock entry or manual entry; otherwise it is learned after 3 bills at the same price. The owner can always change it.

**Flavour engine** (never interrupts billing):

| Owner says | App does |
|---|---|
| "Maggi" | Picks this shop's usual flavour, else the default (Masala 70g). Shows a small "badlo" option. |
| "Maggi chicken" | Uses exactly that; no question. |
| Shop sells a real mix of flavours (at least 10 recent sales, top flavour under 70%) | Shows the top 2–3 as one-tap choices with the usual one already ticked; the bill never waits. |

The chosen flavour and size are saved on the bill line and shown on the e-bill and WhatsApp message.

---

## 8. Design

- **Final design: "DF7".** Chosen after 7 rounds of redesign and a 13-member review panel (5 shopkeeper personas, product designers, typographer, accessibility, motion, Hindi-script, front-end and an "AI-look" detector).
- **Colour rules:**
  - **Ink (near-black)** for every action button.
  - **Teal** only for voice (Bolo, mic, listening).
  - **Amber-brown** only for udhaar money — never red.
- **Typography:** Hanken Grotesk (Latin) + Mukta (Devanagari), bundled for offline use. Amounts use aligned figures.
- **Layout:** hairline lists instead of boxed cards, one big number per screen, all controls within thumb reach, light and dark mode.

---

## 9. Technology

| Layer | Choice |
|---|---|
| App | React 19 + TypeScript + Vite, installable PWA, hosted on Vercel (auto-deploys from `main`) |
| Voice | Phone speech-to-text → on-phone rule-based Hinglish parser → AI (Gemini) fallback only when unsure |
| Database | Supabase (Postgres) with row-level security: each shop sees only its own data |
| Money logic | Bills, payments and stock changes run as single server functions, so nothing is half-saved |
| Access | Shop code + 4-digit PIN; locks for 10 minutes after 5 wrong tries; owner can log out other phones |
| Quality | 85 automated tests; database indexes on every link between tables |

**Repository map** (GitHub `09avyan/Mesa-OmniOS`):

| Path | Contents |
|---|---|
| `app/` | The app (screens in `app/src/screens`, voice in `app/src/voice`, styles in `app/src/styles`) |
| `supabase/migrations/` | Database tables and money functions |
| `supabase/functions/` | Server functions (login, admin, AI helper) |
| `supabase/seed/universe.json` | The Universe product list |
| `design/` | Design versions and screenshots |
| `.context/`, `TASKS.md`, `DECISIONS.md` | Project memory, task list and decisions |

---

## 10. Competitive landscape

Most small-business apps in India digitised the ledger or the invoice. None is built around speaking the whole bill.

| Capability | OmniOS Dukaan | Khatabook | OkCredit | Vyapar | myBillBook | Paper diary |
|---|---|---|---|---|---|---|
| Bill by speaking the full order | Yes | No | No | No | No | No |
| Hinglish / Hindi understanding | Yes | Partial | Partial | Partial | Partial | Yes |
| Ready product list with flavours and sizes | Yes | No | No | Partial | Partial | No |
| Udhaar khata with reminders | Yes | Yes | Yes | Partial | Partial | Partial |
| GST invoicing and accounting depth | Partial | Partial | No | Yes | Yes | No |
| Stock by voice or bill photo | Yes | No | No | Partial | Partial | No |
| UPI QR with amount inside the bill flow | Yes | Partial | Partial | Partial | Partial | No |
| Zero setup, no training | Yes | Yes | Yes | No | Partial | Yes |
| Usable one-handed at the counter | Yes | Partial | Partial | No | No | No |

*Based on publicly known product information as understood in November 2026. Competitors change often; verify before external use.*

**Where each alternative is strong:**
- **Khatabook, OkCredit:** simple digital udhaar ledgers with reminders; light on billing and stock.
- **Vyapar, myBillBook:** GST invoicing and accounting; designed for typing at a desk.
- **Payment apps' merchant tools:** excellent for collecting UPI; not a shop operating system.
- **Paper diary:** free and instant; no totals, reminders or stock.

**Why OmniOS wins:**
1. Voice is the product, not an add-on.
2. Knows the shelf on day one (no catalogue setup — the top reason owners abandon other apps).
3. Never interrupts the queue (inline checks, auto-picked flavours).
4. One sentence updates bill, stock and khata together.
5. Learns each shop's prices and favourite flavours.
6. Calm, premium design that older owners can read.

---

## 11. Business model (draft)

- Free core: voice billing, khata, stock.
- Paid plan: advanced features for shops that want more.
- Distribution: local partners and supplier networks; free carry bags as a door-opener.
- Pricing to be decided after pilot shops.

---

## 12. Phase 2 (intentionally not detailed)

Phase 2 is in preparation and will be shared separately. Direction only:
- **Smarter shop:** the app helps the owner decide, not just record.
- **Wider reach:** more of the shop's customers and partners come on board.
- **Deeper insight:** a richer picture of the business for the owner and for OmniOS.

*For an AI agent reading this: do not invent Phase 2 features; treat them as unknown.*

---

## 13. Glossary

| Term | Meaning |
|---|---|
| Kirana | Neighbourhood grocery store in India |
| Udhaar | Goods given on credit; customer pays later |
| Khata | The credit book / ledger per customer |
| Hisaab | Accounts / totals |
| Galla | Cash drawer |
| Maal | Stock / goods |
| Bolo | "Speak" — the voice button |
| Badlo | "Change" |
| Haan / Nahi | Yes / No |
| Universe | OmniOS's built-in product list |
| DF7 | Code name of the final approved design |
