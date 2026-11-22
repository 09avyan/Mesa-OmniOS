# Graph Report - src  (2026-11-22)

## Corpus Check
- 36 files · ~21,211 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: .css 1)

## Summary
- 253 nodes · 932 edges · 10 communities (9 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `67948564`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- Voice.tsx
- ui.tsx
- Udhaar.tsx
- parse.ts
- shop.ts
- Maal.tsx
- numbers.ts
- normalize.ts

## God Nodes (most connected - your core abstractions)
1. `Tap()` - 44 edges
2. `useT()` - 37 edges
3. `Voice()` - 36 edges
4. `errorFx()` - 28 edges
5. `Icon()` - 26 edges
6. `successFx()` - 26 edges
7. `rupees()` - 22 edges
8. `navigate()` - 21 edges
9. `ReviewScreen()` - 21 edges
10. `toast()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `ids()` --calls--> `parse()`  [EXTRACTED]
  app/src/voice/__tests__/parse.test.ts → app/src/voice/parse.ts
- `App()` --calls--> `ToastHost()`  [EXTRACTED]
  app/src/App.tsx → app/src/components/ui.tsx
- `App()` --calls--> `StoreProvider()`  [EXTRACTED]
  app/src/App.tsx → app/src/lib/store.tsx
- `App()` --calls--> `Admin()`  [EXTRACTED]
  app/src/App.tsx → app/src/screens/Admin.tsx
- `Owner()` --calls--> `Login()`  [EXTRACTED]
  app/src/App.tsx → app/src/screens/Login.tsx

## Import Cycles
- None detected.

## Communities (10 total, 1 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.15
Nodes (43): App(), Owner(), BillCard(), Icon(), P, BackBar(), BottomBar(), RowButton() (+35 more)

### Community 1 - "Voice.tsx"
Cohesion: 0.10
Nodes (39): get(), speakOn(), speakRate(), speakSlow(), Customer, priceOf(), Shop, ShopMatchable (+31 more)

### Community 2 - "ui.tsx"
Cohesion: 0.12
Nodes (36): push(), TabId, TABS, toast(), ToastHost(), ToastMsg, LoginResult, storeEmail() (+28 more)

### Community 3 - "Udhaar.tsx"
Cohesion: 0.11
Nodes (23): BILL_T, BillData, BillLine, CAT, itemName(), L3, units, SUPABASE_KEY (+15 more)

### Community 4 - "parse.ts"
Cohesion: 0.14
Nodes (23): LivePreview(), Candidate, unitOf(), isNumberWord(), cleanName(), CUSTOMER_TAIL, firstNumberIndex(), GALLA (+15 more)

### Community 5 - "shop.ts"
Cohesion: 0.26
Nodes (13): findCustomer(), loadShop(), num(), CATALOG, bigrams(), buildIndex(), dice(), Entry (+5 more)

### Community 6 - "Maal.tsx"
Cohesion: 0.19
Nodes (8): NumberSheet(), Sheet(), ShopItem, CAT, fmt(), low(), Maal(), units

### Community 7 - "numbers.ts"
Cohesion: 0.17
Nodes (12): catalogIndex, tokenize(), DEV_DIGITS, devToAscii(), FRACTION, MULT, PREFIX, readNumber() (+4 more)

### Community 8 - "normalize.ts"
Cohesion: 0.24
Nodes (8): AiOut, askAi(), isSure(), FILLER, SEPARATORS, Unit, UNIT_WORDS, Parsed

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Tap()` connect `App.tsx` to `Voice.tsx`, `ui.tsx`, `Udhaar.tsx`, `Maal.tsx`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14949201741654572 - nodes in this community are weakly interconnected._
- **Why does `Voice()` connect `Voice.tsx` to `App.tsx`, `ui.tsx`, `parse.ts`, `shop.ts`, `numbers.ts`, `normalize.ts`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Should `Voice.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10338164251207729 - nodes in this community are weakly interconnected._
- **Why does `errorFx()` connect `ui.tsx` to `App.tsx`, `Voice.tsx`, `Udhaar.tsx`, `Maal.tsx`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Should `ui.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12195121951219512 - nodes in this community are weakly interconnected._
- **Should `Udhaar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10574712643678161 - nodes in this community are weakly interconnected._