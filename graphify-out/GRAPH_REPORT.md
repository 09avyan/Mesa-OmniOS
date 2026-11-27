# Graph Report - src  (2026-11-27)

## Corpus Check
- 69 files · ~71,331 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: .css 3)

## Summary
- 665 nodes · 2475 edges · 20 communities (18 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a5be0992`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- parse.ts
- Udhaar.tsx
- Voice.tsx
- Admin.tsx
- ai.ts
- store.tsx
- Icon
- i18n.tsx
- universe.ts
- shop.ts
- App.tsx
- parse
- prefs.ts
- normalize.ts
- offlineQueue.ts
- Home.tsx
- pickBest.ts
- Settings.tsx
- V2-CLASSES.md

## God Nodes (most connected - your core abstractions)
1. `Icon()` - 75 edges
2. `useT()` - 73 edges
3. `Tap()` - 65 edges
4. `successFx()` - 54 edges
5. `errorFx()` - 53 edges
6. `rupees()` - 48 edges
7. `navigate()` - 43 edges
8. `TopBar()` - 42 edges
9. `Voice()` - 42 edges
10. `toast()` - 41 edges

## Surprising Connections (you probably didn't know these)
- `read()` --indirect_call--> `KEY()`  [INFERRED]
  app/src/lib/offlineQueue.ts → app/src/voice/flavour.ts
- `write()` --indirect_call--> `KEY()`  [INFERRED]
  app/src/lib/offlineQueue.ts → app/src/voice/flavour.ts
- `place()` --indirect_call--> `slug()`  [INFERRED]
  app/src/screens/Store.tsx → app/src/lib/universe.ts
- `request()` --indirect_call--> `slug()`  [INFERRED]
  app/src/screens/Store.tsx → app/src/lib/universe.ts
- `savedMode()` --indirect_call--> `KEY()`  [INFERRED]
  app/src/screens/Admin.tsx → app/src/voice/flavour.ts

## Import Cycles
- None detected.

## Communities (20 total, 2 thin omitted)

### Community 0 - "parse.ts"
Cohesion: 0.09
Nodes (36): Candidate, unitOf(), isNumberWord(), ADDRESS, baseAmt(), cleanName(), CUSTOMER_TAIL, dimOf() (+28 more)

### Community 1 - "Udhaar.tsx"
Cohesion: 0.10
Nodes (43): BILL_T, BillCard(), BillData, BillLine, billMessage(), CAT, itemName(), L3 (+35 more)

### Community 2 - "Voice.tsx"
Cohesion: 0.05
Nodes (86): MicProps, addDays(), entity(), EXAMPLES, Intent, iso(), norm(), pad() (+78 more)

### Community 3 - "Admin.tsx"
Cohesion: 0.11
Nodes (51): Admin(), AdminLogin(), submit(), An, Analytics(), Daily(), KIND, N (+43 more)

### Community 4 - "ai.ts"
Cohesion: 0.29
Nodes (7): toLine(), AiOut, askAi(), isSure(), MatchIndex, Unit, Parsed

### Community 5 - "store.tsx"
Cohesion: 0.20
Nodes (12): deviceKey(), deviceLabel(), LoginResult, storeLogin(), Ctx, logUsage(), State, Store (+4 more)

### Community 6 - "Icon"
Cohesion: 0.06
Nodes (129): Icon(), P, NumberSheet(), Ask, AskHost(), askText(), BackBar(), BottomBar() (+121 more)

### Community 7 - "i18n.tsx"
Cohesion: 0.28
Nodes (7): Ctx, Entry, I18n, Key, Lang, LANGS, S

### Community 8 - "universe.ts"
Cohesion: 0.05
Nodes (60): pub, SItem, src, aliasesOf(), autoHi(), build(), fetchFile(), fetchPointer() (+52 more)

### Community 9 - "shop.ts"
Cohesion: 0.16
Nodes (29): findCustomer(), loadShop(), num(), ShopItem, loadUniverse(), universeMatchables(), addInChunks(), CATALOG (+21 more)

### Community 10 - "App.tsx"
Cohesion: 0.13
Nodes (30): Admin, AllReceipts, App(), Bags, BillDetail, BillPage, Bills, Galla (+22 more)

### Community 11 - "parse"
Cohesion: 0.11
Nodes (24): correct(), extractPay(), tokenize(), DEV_DIGITS, devToAscii(), ENG_ONES, ENG_TENS, FRACTION (+16 more)

### Community 12 - "prefs.ts"
Cohesion: 0.14
Nodes (7): applyTheme(), get(), setTheme(), speakSlow(), Theme, theme(), UNDO_MS

### Community 13 - "normalize.ts"
Cohesion: 0.12
Nodes (17): BRAND_RE, BRANDS, dec(), DV_C, DV_M, DV_V, FILLER, HOMO (+9 more)

### Community 15 - "offlineQueue.ts"
Cohesion: 0.35
Nodes (10): enqueueBill(), flushQueue(), isOffline(), newClientKey(), Queued, queuedCount(), read(), startQueueSync() (+2 more)

### Community 16 - "Home.tsx"
Cohesion: 0.31
Nodes (9): Logo(), clock(), Home(), HomeSkeleton(), Row, Sum, useOnline(), chime() (+1 more)

### Community 17 - "pickBest.ts"
Cohesion: 0.31
Nodes (8): Best, isOwn(), pickBest(), PickContext, recentOf(), recentSet, scoreParsed(), known

### Community 18 - "Settings.tsx"
Cohesion: 0.39
Nodes (7): setSound(), soundEnabled(), useStore(), Device, Phones(), sessionIdOf(), Settings()

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Icon()` connect `Icon` to `Udhaar.tsx`, `Voice.tsx`, `Admin.tsx`, `i18n.tsx`, `App.tsx`, `Home.tsx`, `Settings.tsx`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Should `parse.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09009009009009009 - nodes in this community are weakly interconnected._
- **Why does `errorFx()` connect `Icon` to `Udhaar.tsx`, `Voice.tsx`, `Admin.tsx`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Should `Udhaar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10352941176470588 - nodes in this community are weakly interconnected._
- **Why does `successFx()` connect `Icon` to `Udhaar.tsx`, `Voice.tsx`, `Admin.tsx`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Should `Voice.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05087719298245614 - nodes in this community are weakly interconnected._
- **Should `Admin.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11090225563909774 - nodes in this community are weakly interconnected._