# DESIGN.md — OmniOS Dukaan v3 ("Clean counter")

Chosen 23 Nov 2026 by test, not taste: 3 directions → simulated owner panel → "Standard clean" won; 6 design rounds + 3 real-app rounds until every persona scored ≥ 9/10 (ease, calm, trust). Previous system: `design/DESIGN-prev.md`. Prototypes + screenshots: `design/redo/`.

## Principles (what made it pass)
1. **One solid green per screen.** The main action (or the mic) is the only filled green; everything else is outlined or text.
2. **Items first, money second.** Payment choices appear only when every question on the bill is answered.
3. **Nothing pre-selected** where money is involved. Save stays grey and *says why* ("↑ Upar sahi Sharma ji chuno") — tapping the reason jumps to it.
4. **Save states the consequence**: "Udhaar → Sharma ji ka khata (ab ₹2,597)". No "are you sure?" pop-ups (brief).
5. **Undo is big and lasting**: "Bill wapas lo" until the next bill.
6. **Udhaar is never red**: warm brown, light tint when chosen.

## Colour
| Token | Hex | Use |
|---|---|---|
| bg | #F2F4F6 | App background (cool light grey) |
| s | #FFFFFF | Cards, sheets, dock |
| s2 | #EEF1F4 | Icon tiles, waiting buttons, undo box |
| line / mute | #E4E7EC / #C4CAD3 | Dividers / outlines of secondary buttons |
| ink / ink2 | #0E1116 / #2B313A | Text / secondary text (never lighter) |
| ac / acp / acs | #0B7A4B / #086339 / #E3F3EA | The one accent: main action, mic, active tab, sales number |
| uns / unsb | #FFF4D1 / #D99A00 | "Not sure" items and the waiting reason button (#FBE7B0) |
| ud / udsoft | #8A4B12 / #FBEFE3 | Udhaar amounts / chosen Udhaar tile |
| WhatsApp | #1FA855 outline, #137A3C text | WhatsApp buttons (outlined, never filled) |

## Type
Hind (self-hosted, Devanagari + Latin) 500/600/700 for everything. Body 18/26. Secondary lines ≥ 17px. Title 28–30. Sales 56/60 green, tabular figures. Total in dock 26.

## Shape & touch
Cards 16 radius, soft shadow, no border. Buttons ≥ 56px (main 62–64), always icon + word. Header buttons 56px with words (QR, Settings). Tabs: neutral icons, active = green text (no pill). Mic 76px round, centre-bottom, on every screen.

## Screens (built)
- **Home:** greeting + QR/Settings → shop name → sales card (big green ₹, bills · udhaar diya) → "Aaj ki shuruaat" (yesterday line, one green "Aaj 3 saaman gino", people to collect from with outlined WhatsApp reminder) → plain list (Hisaab, Galla, Orders, Bags, Coming soon).
- **Bill review:** items card → bottom dock: total + yellow reason (while questions open) → Cash/UPI/Udhaar tiles → Save with consequence.
- **Bill ban gaya:** tick + summary + khata after → outlined WhatsApp + outlined Ghar → undo box → bill card.

## Motion
Unchanged from v2: 180ms fade+rise enter, press scale .97, one looping animation max (listening mic), reduced-motion respected.
