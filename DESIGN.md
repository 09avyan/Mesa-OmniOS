# OmniOS Dukaan — Design system ("Bank passbook")

Mode: Operate. The shop's numbers are the hero; chrome recedes. The world is the bank passbook every shop owner trusts: passbook-blue cover, white pages, entries in ruled columns with tabular numbers. Ease-of-use rules in PROJECT.md override everything here. Tokens live in `app/src/styles/app.css`.

## Colour (Restrained: navy shell + neutrals + meaning colours)
| Token | Value | Job |
|---|---|---|
| `--navy` | `#17325C` | passbook cover: home/login header, primary action, mic |
| `--navy-press` | `#0F2445` | pressed primary |
| `--on-navy-soft` | `#C7D3E6` | secondary text on navy (≥7:1) |
| `--ground` | `#F3F5F8` | screen ground (cool, never cream) |
| `--page` | `#FFFFFF` | pages: lists, ledger, panels |
| `--ink` / `--ink-2` / `--ink-3` | `#0F1B2D` / `#44526A` / `#6B778C` | text levels |
| `--rule` / `--rule-strong` | `#DCE2EA` / `#B9C3D2` | ledger rules, borders |
| `--jama` | `#0F7B3F` | money in, success, ✓ |
| `--baki` | `#B42318` | udhaar / due / error / ✗ only |
| `--note-tint` | `#FFF4D6` | "check this" highlight, coming-soon status |
| `--stamp` | `#3E4CB8` | rubber-stamp ink, used only by the save stamp |

Red never decorates; it always means money owed or a problem.

## Type
One family: **Mukta** (Devanagari + Latin), 500/600/700/800. All amounts use tabular lining numerals.
Scale: 15 meta · 18 body · 19–21 labels/titles · 25–28 page headings · 44 balance. Nothing below 15px.

## Shell (identical on every screen)
- Home and login: navy **cover** with mark, store name, language button; home shows today's sales as the passbook balance.
- Inner screens: white bar, **Back** (arrow + "Wapas") left, title centre, language right.
- Bottom: white bar with the full-width navy **Bolo** mic pill, always visible.
- Home actions: **Bill** full-width navy (primary), then Maal aaya · Udhaar · Stock in one row of three.

## Signature: the passbook ledger
Money lists (today's bills, udhaar, supplier dues) are passbook entries: heavy top rule, column heads (Samay · Vivran · Rakam), alternate-row tint, right-aligned tabular amounts, udhaar in red. Empty state says what will appear there.
Saving money (bill, receipt, payment) shows the round "Jama ✓" stamp for under half a second, with vibration and tone.

## Components
- Buttons: 56px min (primary 60), radius 12, icon + word always. Lucide icons, ~2px stroke, navy. No emoji.
- Lists: white grouped rows, 64px, icon · label · chevron.
- Messages: tinted strip with icon (err red, ok green, note amber).
- PIN: 4 boxes + large keypad, no system keyboard.

## Motion
90ms press (scale .98), state changes ≤200ms ease-out, stamp 380ms. No page-load choreography. Reduced motion turns it off.
