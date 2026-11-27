# .context/INDEX — read this first, open a topic file only when the task needs it
| 🔔 Reminders | Remind owner each session: (1) switch app to design/v2 after approval, (2) pick fixes from docs/fix-proposals.md, (3) build assistant. Logo = A. | TASKS.md top |
Format: topic → 1–2 line summary → file. Keep each line short. Update the matching line + file at every commit chunk.

| Topic | Summary | Full |
|---|---|---|
| Brief | OmniOS Dukaan: voice-native kirana app (Indore). Phase 1 live by **Thu 3 Dec 2026**. Owner Avyan can't read code → plain-word REPORT BACK. Nothing fake; Coming-soon for Phase 2/3. | brief.md (→ PROJECT.md) |
| Hard UI rules | Text ≥18 (secondary ≥17), buttons ≥56, icon+word, ≤2 taps, dictate→review→✓, Undo not "are you sure", udhaar never red, ₹0 spend. Redo #4: free hand on looks + tabs/mic layout; size/accessibility rules fixed. | brief.md |
| Owner rules | Push to main (+ session branch). NEVER delete data unless owner asks. Mock data only in TEST store. Keep design current + one `-prev`. No model names in commits. Ask with 3–5 options, recommended first. | rules.md (→ CLAUDE.md) |
| Decisions | Name OmniOS Dukaan; tabs Ghar·Bill·Maal·Udhaar + mic; 3 languages; price learned after 3 bills; returns by "wapas"; no expiry; PIN lockout; pickup-only store. | decisions.md (→ DECISIONS.md, ONLINE_STORE.md) |
| Tech | React19+Vite+TS in app/, Vercel (omnidukaan + omnios-dukaan, both from main), Supabase msqmuvqhbxyrhogbhtta, edge fns login/admin/understand(Gemini). Container can't reach vercel.app → use Vercel MCP. | tech.md |
| Tasks | Live list in TASKS.md (always read). Now: **UI REDO #4**. Then returns, admin usage+CSV, speed+speak settings, .items master file. | ../TASKS.md |
| UI redo #5 | 14 designs shown; d2 PASSED (teal wallet+voice bar), d5/d6/d13 HOLD, d14 last (chat in d2 look). Panel runs only on owner's ask. | ui-redo-5.md |
- Universe: v11, 5000 items + 10,475 variants + mishearing aliases, packed format p2 ~174 KB gz (was 290); async unpack + warm start; matcher ~1.35 ms/word; STT: n-best+pickBest, stabiliser, numbers, names; 306 tests.
| Design history | v3 "Clean counter" shipped; redo #3 prototype v6 (bahi green+saffron, Anek, awning/stamp) passed old panel but owner wants fresh start. | design-history.md |
| Money | Revenue streams + sponsored items (60% to stores, ask owner later). | ../REVENUE.md |
| Code map | graphify 0.9.118. `graphify query "<q>"` before grepping; rebuild: `graphify update app/src --force` then copy app/src/graphify-out/* to graphify-out/. | ../graphify-out/GRAPH_REPORT.md |
| Memory dump | Owner quotes (quality bar), request history, panel method, full screen list for redesign, errors/lessons, open items. | memory.md |
| Session log | What happened each session, newest first. | log.md |

| Handoff | 27 Nov state, gaps, verify cmd, Codex model/effort advice. Read first when resuming. | ../docs/HANDOFF.md |
| Assistant | Poochho rules engine: lib/assistant.ts → ask_* RPCs; no Gemini. | ../docs/assistant-plan.md |
