# OmniOS Dukaan — Design rules

Clean premium + warm Indian market. Ease of use wins over style every time. Target: 360px Android, Chrome, bright shop light.

## Colour (tokens in `app/src/styles/tokens.css`)
| Token | Value | Use |
|---|---|---|
| `--bg` | `#FFF7EC` | warm cream page |
| `--surface` | `#FFFFFF` | cards, tiles |
| `--ink` | `#1E1A16` | main text (contrast 16:1 on bg) |
| `--ink-soft` | `#5A5148` | secondary text (7.4:1) |
| `--line` | `#EADFCF` | borders |
| `--accent` | `#C2410C` | the one confident accent: main action, mic (white text 5.2:1) |
| `--accent-press` | `#9A3412` | pressed accent |
| `--accent-tint` | `#FFEAD8` | accent background tint |
| `--ok` | `#15803D` | ✓ confirm, success |
| `--bad` | `#B91C1C` | ✗ cancel, errors |
| `--warn-tint` | `#FEF3C7` | highlighted "check this" lines |

One accent only. Green/red only for ✓/✗ and status.

## Type
- Headings and numbers: **Baloo 2** (700/800). Friendly, bold, has Devanagari.
- Body: **Hind** (500/600). Clear Devanagari + Latin.
- Sizes: body 18px · label 20px · title 26px · number 32px · big number 44px. Never below 16px (fine print only).
- Line height 1.4 body, 1.15 headings.

## Size and space
- Touch targets: min 56px; primary action and tiles 64px+. Gap between tappables ≥ 12px.
- Spacing scale: 4 · 8 · 12 · 16 · 24 · 32. Screen side padding 16px.
- Radius: buttons 16px, cards/tiles 20px, pills 999px.
- Shadow: one soft level `0 2px 10px rgba(60,40,20,.08)`.

## Fixed layout (same on every screen)
- Top bar 64px: big **back** button (← + "Wapas") on the left, screen title in the middle, language switch (अ/A) on the right.
- Bottom bar 88px, always visible: **mic** button in the centre (72px circle, accent). Screen's main action sits directly above it, full width.
- Every button = icon + short word. Never icon-only, never text-only.
- Confirm = big ✓ (green) / ✗ (red) pair, ✓ always on the right. Undo toast instead of "are you sure?".

## Feedback
- Every tap: pressed state within 0.1s (scale .97 + darker colour, 80ms).
- Success: green tick + short vibration (30ms) + short tone.
- Errors: plain sentence saying what to do next, in the owner's language.
- Loading: spinner only after 300ms, with words ("Ruko, aa raha hai…").

## Motion
- 120–200ms, ease-out `cubic-bezier(.2,.8,.2,1)`. No decoration motion. `prefers-reduced-motion` turns it all off.

## Language
- Two modes: हिंदी (Devanagari) and Hinglish (Roman). Switch on every top bar; choice remembered.
- Words: Bill, Maal aaya, Udhaar, Stock, Wapas, Haan ✓, Nahi ✗. No jargon.
