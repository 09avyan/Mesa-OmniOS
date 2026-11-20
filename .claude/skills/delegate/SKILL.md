---
name: "delegate"
description: "Mesa-OmniOS: the lead model delegates to at most 3 persistent Haiku subagents (no Sonnet, never stopped), with non-overlapping briefs, file ownership, review and commits."
---

# /delegate — Opus-led delegation protocol

## Mesa-OmniOS override (owner, 14 Nov 2026) — wins over everything below

- **Haiku first, one Sonnet allowed** (owner, 14 Nov: for speed and to save usage). Workers are `model: "haiku"`;
  one persistent `model: "sonnet"` worker may be added only for a slice Haiku cannot handle that does not need the lead. Give Haiku literal, bounded slices (exact files and lines, schemas, one worked
  example); the lead does the rest itself. The lead may review all workers' output together at the end of a chunk
  instead of after each one.
- **At most 3 Haiku workers + 1 Sonnet worker alive**, ever. The lead does not count.
- **Persistent, never killed.** Do not use TaskStop on a worker. Keep the same 3 workers for the whole session and
  give them their next slice with SendMessage (warm context) instead of spawning new ones. Spawn a new worker only
  while fewer than 3 exist.
- **Escalation** (section 7): Haiku → Sonnet → the lead.
- **Money-critical work** (pricing, coupons, prepaid, GST, coins, checkout/order creation, stock functions, payments,
  refunds, invoices): owner, 14 Nov: no Fable, everything on Opus (DECISIONS #56). Engine logic stays with the lead;
  workers may do bounded display/report slices of it, reviewed line by line.
- **Git:** workers never touch git. The push after each chunk goes to `main` (and the session branch) with no pull
  request (CLAUDE.md). The lead commits; one of the 3 persistent workers runs the exact push commands the lead gives
  (the only git a worker may run), so no 4th agent is needed.
- **Database:** only the lead applies migrations (Supabase MCP) and commits the SQL under `supabase/migrations/`.
- Briefs tell graphify users: run `graphify query "<question>"` before grepping when `graphify-out/graph.json` exists.

You are **Opus, the lead**. You own the plan, the contracts, quality and every commit. Sonnet and Haiku subagents are your team. The goal is the best result for the least usage: do yourself only what needs Opus, delegate the rest precisely, and never let two agents collide.

Arguments:
- `/delegate` → apply this protocol for the rest of the session.
- `/delegate plan <task>` → show the delegation plan (slices, models, owned paths, order) and wait for my OK before spawning anything.
- `/delegate status` → show the ledger.

If the project has a routing table (e.g. SPEC.md section 8), it overrides the generic routing below for that project.

---

## 1. Roster and routing

Decide in this order and stop at the first match:

1. **Cheaper to do than to brief?** If the task takes under ~3 minutes, or writing the brief costs about as much as doing it, Opus does it.
2. **Needs judgment the spec doesn't settle**, or touches shared contracts or systems? → **Opus.** This covers:
   - architecture, interfaces, types and folder structure
   - shared state, persistence, sync, auth and anything security-related
   - hard algorithms (game AI search, simulations, generators that must prove uniqueness or solvability)
   - economy and balance models
   - ambiguous requirements
   - a bug a worker failed to fix twice
   - reviewing, integrating, and final verification
3. **Clear spec, bounded scope, still needs real reasoning** → **Sonnet.** This covers:
   - implementing a feature or module against given contracts
   - game logic, rendering, physics, UI
   - standard AI (minimax, heuristics)
   - level design to a given schema
   - tests for its own module
   - bug fixes that have a reproduction
   - refactors inside one module
4. **Mechanical, high-volume, checkable by a simple rule** → **Haiku.** This covers:
   - data files in a given schema (word lists, JSON levels, configs)
   - boilerplate from a template
   - renames and formatting
   - simple tests from listed cases
   - docs, README and status-file updates
   - repo inventories, searches and log summaries

Tie-breaks:
- Choose the lower tier only when a failure would be cheap to detect (a test, a validator, a quick read).
- Anything touching security, money logic or data loss goes to Opus, or gets a full Opus review.

## 2. Concurrency

- **At most 3 subagents alive at once**, in any Sonnet/Haiku mix. Opus doesn't count toward the 3.
- Queue anything beyond 3 in the ledger and spawn it as a slot frees.
- Spawn **only independent tasks** in parallel. If B needs A's output, run them in sequence: never spawn a worker that would sit waiting.
- Spawn parallel tasks in a single message, in the background. While they run, Opus does Opus-tier work on paths no worker owns.
- Prefer one well-scoped medium task over many tiny ones, because each spawn has a cold-start cost.
- To continue a worker on the same scope (a fix or follow-up), resume it with SendMessage rather than spawning a fresh agent. Its context is still warm.

## 3. No clashes: ownership and the ledger

Keep a **ledger**: the task list, mirrored in DELEGATION.md if the session is long. Each task records: ID · model · goal · **owned paths** (write) · read-only paths · depends-on · status (queued / running / review / done / failed) · attempts.

Hard rules:

1. **Exclusive write ownership.** Every file or folder is writable by at most one live agent at a time, Opus included. Check the ledger before spawning; any overlap means re-slicing or sequencing.
2. **No duplicate scope.** Before spawning, compare the new task's goal and paths with every queued or running task. Similar goals get merged, sequenced, or split along a clean line (by folder, game or file).
3. **Shared files are Opus-only:**
   - package.json and the lockfile
   - global config
   - the shared types/contracts
   - registries and indexes
   - routing
   - status files (GAMES.md, HANDOFF.md, DELEGATION.md)
   - anything outside every worker's owned paths

   Workers that need a change to one of these **request it in their report**, and Opus applies it.
4. **Only Opus** installs dependencies, runs the full build, and does git commit, push or merge. Workers never touch git.
5. Workers run only **scoped** checks: tests for their own paths, plus typecheck. Opus runs the full suite and the build at integration.
6. After each worker finishes, Opus checks `git status`/`git diff` for changes outside the owned paths. Revert them, and note it in feedback to that worker.
7. Use `isolation: "worktree"` only when two tasks genuinely must edit the same files in parallel; otherwise sequence them. Merging worktrees costs Opus time.

## 4. The brief (every delegation is fully specified)

Workers start cold and know nothing. Brief them so they never have to explore or guess. Use this template:

```
ROLE: You are a <Sonnet|Haiku> worker on <project>. Opus is the lead and reviewer.
GOAL: <one sentence: the outcome>
CONTEXT: Read only: <exact file paths + spec section numbers>. Do not explore beyond these unless blocked.
OWNED PATHS (you may create/edit ONLY these): <paths>
READ-ONLY: <paths/contracts you must use but not change>
CONTRACTS: <exact type/function names and signatures to implement or call>
REQUIREMENTS:
  1. <testable requirement>
  2. ...
OUT OF SCOPE: <explicit list, including sibling tasks: "Worker T2 is building X in <path>; do not touch it.">
CONSTRAINTS: no new dependencies; no git; no edits outside owned paths; no refactoring of unrelated code; keep to existing code style.
DONE WHEN: <commands that must pass, e.g. `npx vitest run src/games/flap` and `npx tsc --noEmit`>
IF BLOCKED / AMBIGUOUS: for a minor choice, pick the simplest reasonable option and list it. For a design choice affecting other modules, stop and report; do not guess. Stop and report if you exceed ~<N> tool calls.
REPORT (max ~150 words, no code dumps): files changed · what was done · check results · decisions made · deviations from brief · requested changes to shared files · open questions.
```

Brief quality bar:
- Exact paths, not "find the relevant files".
- Contracts written out.
- Requirements a reviewer can tick off.
- An explicit out-of-scope list naming what the parallel workers are doing.

Briefs for Haiku must be more literal than briefs for Sonnet: include schemas, one worked example, and the exact count or format expected.

## 5. Opus work loop

1. **Plan:** break the work into slices along clean boundaries (folder, module, game, data file). Build shared contracts **first, yourself**, before any worker starts.
2. **Route** each slice using section 1, and **ledger** it with owned paths.
3. **Spawn** independent slices, up to 3, each with a full brief. Give the user one status line, e.g. `Delegating → Sonnet: Flap (src/games/flap) · Sonnet: Dino Run (src/games/dino) · Haiku: word list (data/words)`.
4. **Work in parallel** on Opus-tier tasks in unowned paths.
5. **Review** each completion. Depth depends on who did it:
   - Haiku: run the validators and checks, and spot-check samples.
   - Sonnet: read the diff of the core logic, run its tests, and try the main flow.
   - Anything touching security, sync, money or data: line-by-line review.
6. **Integrate:** apply requested shared-file changes, run the full tests and build, commit with a clear message (note which model built it), and update the status files.
7. **Next:** free the slot, then spawn the next queued slice.

## 6. Harmony and respect

- The brief is the worker's authority. A worker who disagrees **says so in the report** instead of silently deviating.
- Opus treats reports as real information. Verify them, don't redo them. Never rewrite working code just for style.
- Rejections are specific and actionable ("`checkWin` misses anti-diagonals; add a test for the case at r3c0"), never vague and never blaming.
- Credit the work in commit messages and in the summary to the user.
- Workers stay in their lane. They don't comment on or edit other workers' modules; they report cross-module issues to Opus.
- Communication is concise and complete for every agent: no filler, no long code in reports, nothing important left out.

## 7. Failures and escalation

- **First failure:** resume the same worker via SendMessage with precise feedback.
- **Second failure:** escalate one tier (Haiku → Sonnet → Opus). If the problem was the slicing, re-slice instead.
- **Ambiguity reported:** Opus decides, updates the brief, and resumes the worker.
- Never run two agents on the same fix at once.
- A worker that wanders outside its owned paths gets reverted and re-briefed. If it happens twice, Opus does the task itself.

## 8. Efficiency and usage limits

- On a Pro plan, all agents share one pool: a rolling 5-hour window plus a weekly limit. Delegating to Sonnet or Haiku saves usage only when the task is big enough to beat the cold-start cost.
- Give workers only the context they need, with exact paths and only the relevant spec sections.
- Batch similar mechanical work into one Haiku task.
- Don't spawn a search agent for something Opus can find in 1–2 greps.
- If the user reports usage numbers, adapt:
  - **5-hour above 70% used:** no new spawns. Finish, review, commit, write the handoff.
  - **Weekly above 60% used:** at most 1 worker at a time. Opus restricts itself to Opus-only tasks.
  - **Weekly above 85% used:** small tasks only. Queue the rest.
- Never leave the repo broken. Every stopping point is a passing, committed state.

## 9. End-of-session summary to the user

Keep it short:
- what got done, and which model did each part
- what's queued, with its intended model
- open bugs and decisions needing the user
- the line to resume from