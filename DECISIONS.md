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
