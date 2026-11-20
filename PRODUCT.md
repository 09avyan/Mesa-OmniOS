# Product

OmniOS Dukaan — the store app of OmniOS, an intelligence layer for kirana (neighbourhood grocery) shops in Indore. Full brief: PROJECT.md.

## Platform
Mobile web (PWA added to home screen). Mid-range Android, Chrome, 360px width. Online only for now.

## Stack
React + Vite on Vercel; Supabase (Postgres, auth, edge functions); browser speech recognition (hi-IN).

## Users
Kirana store owners who use no software today; many struggle with phones and mainly know WhatsApp. Reading Hindi (Devanagari) or Hinglish. Plus one admin (the founder) on desktop.

## Product Purpose
Near-zero-effort capture of a shop's daily work: bills, supplier receipts, udhaar (credit), stock, by voice and photo, then turn it into clear advice (what to buy, who owes what).

## Operating Context
Behind the counter in a busy shop, bright daylight, customer waiting, one hand often busy. Sessions are seconds long and frequent (dozens of bills a day). Owner may be 40-65, reading glasses, low patience for confusion.

## Capabilities and Constraints
- Max 2 taps from home to bill, receipt, udhaar. One main job per screen.
- Targets ≥56px, body ≥18px, numbers larger. Icon + word on every button. Visible back on every screen. Mic always visible.
- No hidden gestures, no tiny menus. Undo over "are you sure".
- Nothing fake: unbuilt features are honest "coming soon" screens.

## Brand Commitments
Name shown to owners: "OmniOS Dukaan". Feel: trustworthy and professional like a good bank or UPI app, yet local and friendly. Must never look AI-generated.

## Product Principles
1. The shop's numbers are the hero; chrome recedes.
2. Familiar beats clever: patterns from UPI apps and WhatsApp the owner already trusts.
3. Speak the owner's language, literally.

## Accessibility & Inclusion
High contrast for bright light, large type, no colour-only meaning, reduced-motion respected, works without reading English.
