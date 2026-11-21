# DESIGN.md — OmniOS Dukaan ("Warm market + premium")

Goal: calm, premium, warm; readable in a bright shop; usable by someone who only knows WhatsApp.

## Colour (all text pairs ≥ 7:1 contrast unless noted)
| Token | Hex | Use |
|---|---|---|
| `bg` | #FBF6EC | App background (warm cream) |
| `surface` | #FFFFFF | Cards, sheets |
| `surface-2` | #F3EADA | Pressed rows, tab bar, inputs |
| `line` | #E6DAC4 | Dividers, card borders |
| `ink` | #1F1A14 | Main text, numbers |
| `ink-2` | #594E43 | Secondary text (7.4:1 on bg) |
| `accent` | #0F6B4B | The one accent: main action, mic, active tab (6.7:1 with white) |
| `accent-press` | #0A5038 | Pressed main action |
| `accent-soft` | #DDEFE5 | Active tab pill, success background |
| `haldi` | #F2B01E | Highlights, streak flame |
| `unsure` | #FFF1C7 bg + #D99A00 left bar | "Not sure" lines on the Review card |
| `danger` | #B3261E / soft #FBE3E0 | Errors, money gaps |
| `udhaar` | #9A4A12 | Money owed to the shop (warm brown, not red: udhaar isn't a mistake) |

No dark mode in Phase 1 (bright shops; one look everywhere).

## Type
- Headings & numbers: **Baloo 2** (700/800) — bold, friendly, full Devanagari.
- Body & labels: **Mukta** (500/600) — very readable Devanagari + Latin.
- Self-hosted (no font flash, works on slow 4G).

| Role | Size / line | Weight |
|---|---|---|
| Big money (totals) | 44 / 48 | Baloo 800, tabular figures |
| Number | 32 / 36 | Baloo 700 |
| Screen title | 28 / 34 | Baloo 700 |
| Section title | 22 / 28 | Baloo 700 |
| Body | 18 / 26 | Mukta 500 |
| Button / tab label | 18 / 22 | Mukta 600 |
Minimum anywhere: 18px. Numbers always ₹ with Indian grouping (₹1,24,500).

## Shape & space
- Radius: card 18 · button 16 · input 14 · chip/mic pill 999.
- Spacing scale: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48. Screen side gutter **24**. Gap between cards/sections **24**, inside cards **20–24**. Leave ≥ 80px clear above the mic.
- Cards: no borders; separation by space + one soft shadow `0 1px 2px rgba(60,40,10,.05), 0 6px 20px rgba(60,40,10,.05)`. Max one box level (no boxes inside boxes). Settings/Peeche are borderless text buttons (still 56px tall).

## Touch
- Every button ≥ 56px tall, icon + word, never icon-only. Main action 64px, full width.
- Mic: 72px round, `accent`, white mic icon + word under it ("Bolo" / "बोलो" / "Speak"), fixed centre-bottom above the tabs, same spot on every screen.
- Main action ("✓ Done", "Save"): full-width 64px bar fixed directly above the mic, same spot on every screen that has one. Content scrolls behind neither.
- Tab bar: 72px + phone safe area. 4 tabs, icon 26px + word 18px. Active = `accent-soft` pill + `accent` text.
- Top bar: 64px. Back button on every inner screen: arrow + word ("Peeche"), top-left, 56px.

## Feedback
- Press: scale .97 + darker shade in 80ms; 10ms vibration; soft "tick" sound (Web Audio, quiet).
- Success: green circle tick draws in 240ms + 30ms vibration + short chime; toast "Ho gaya ✓" with **Undo** for 6s. No "are you sure?" dialogs.
- Errors: warm sentence + exactly one next step ("Net nahi chal raha. Wi-Fi ya data on karke dobara dabaiye.").
- Loading: skeleton lines in `surface-2`, never a blank screen; >2s shows a friendly line.

## Motion
- Enter: 180ms `cubic-bezier(0.2, 0.8, 0.2, 1)`, fade + 8px rise. Exit: 140ms ease-in.
- Screen change: 200ms slide (forward from right, back to right). Sheets: 220ms from bottom.
- Low-end phones first: animate only `opacity`/`transform`; at most ONE looping animation on screen (the listening mic: opacity 1→0.75→1, 1.6s). No glow rings, blurs, shadows that animate, or particle effects.
- `prefers-reduced-motion`: fades only.

## Language
Hindi (देवनागरी) · Hinglish (Roman) · English. Picked at first launch; Settings button on Home top bar. Every label exists in all three.
Tabs: Ghar/घर/Home · Bill/बिल/Bill · Maal/माल/Stock · Udhaar/उधार/Udhaar.

## UX rules (v2, after owner review 21 Nov)
1. **Different things never look alike.** Person = round avatar with initial + "Kiska bill?" label + outlined "Badlo" button. Items = rows inside one list card. Money choice = 3 big toggle buttons. Totals = biggest number on screen.
2. **Fix by touching the thing itself.** Quantity has visible − / + buttons on every item row (no hidden "tap to edit"). An unsure item shows its 2–3 likely choices as big buttons right in the row.
3. **The app never guesses silently.** Done stays disabled and says why ("Pehle Maggi chuno") until every unsure line is settled.
4. **Each section has its own colour + icon**, used on Home tiles and tab icons, so owners who read slowly recognise by colour/shape: Bill green #0F6B4B · Maal blue #1F5FA8 · Udhaar rust #A4461B · Hisaab purple #6B4FA0 · Galla haldi #8A6A00 · Orders teal #0E7490 · Thaile magenta #9D174D. Main actions stay accent green.
5. **Teach by example, in place.** Home shows one real example sentence above the mic; the listening screen says how it ends.
6. **Flow screens (listening, review, saved) hide the tab bar**; the bottom slot becomes the one main action. Mic keeps its exact spot.
7. **Listening state** turns the mic saffron #C2410C with "Sun raha hai", and shows live words at 30px.
8. **After saving**: big tick, what changed in plain words ("Stock se 2 kg cheeni kam") with Undo, then WhatsApp + "Naya bill".
9. Disabled buttons: #E4DCCB background, #594E43 text (still readable).
10. **Nothing overlaps unless on purpose.** Every preview/screen is checked by script for overlapping blocks and cut-off text before it is shown.
