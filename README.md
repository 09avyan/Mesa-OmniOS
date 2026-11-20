# OmniOS Dukaan

Store app for kirana owners (Mesa Future Founders Challenge). Full brief: [PROJECT.md](PROJECT.md) · Design rules: [DESIGN.md](DESIGN.md) · Decisions: [DECISIONS.md](DECISIONS.md)

**Live:** https://omnidukaan.vercel.app (store app) · https://omnidukaan.vercel.app/admin (owner admin)

## Status
| Slice | What | State |
|---|---|---|
| 1 | Bank-passbook design, login (store code + PIN), home, Coming soon screens (Agents, Phase 3), Terms, admin (create store, PIN reset, pause, delete, usage, CSV, pitch line) | Live |
| 2 | Voice opening stock + item matching + Indore catalogue | Next |

## Layout
- `app/` — React + Vite web app (deployed by Vercel on every push to `main`)
- `supabase/migrations/` — database tables and rules (each store sees only its own rows)
- `supabase/functions/admin/` — admin-only actions (create store logins, reset PIN)
- `graphify-out/` — code map for AI sessions
