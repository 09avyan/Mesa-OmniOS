# Graph Report - src  (2026-11-23)

## Corpus Check
- 41 files · ~32,437 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: .css 1)

## Summary
- 321 nodes · 1245 edges · 9 communities (8 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9d0c1a1a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- parse.ts
- Udhaar.tsx
- Voice.tsx
- errorFx
- rupees
- BillCard.tsx
- App.tsx
- Tap

## God Nodes (most connected - your core abstractions)
1. `Tap()` - 61 edges
2. `useT()` - 55 edges
3. `errorFx()` - 42 edges
4. `successFx()` - 42 edges
5. `Voice()` - 36 edges
6. `rupees()` - 34 edges
7. `navigate()` - 34 edges
8. `Icon()` - 33 edges
9. `BackBar()` - 30 edges
10. `toast()` - 29 edges

## Surprising Connections (you probably didn't know these)
- `ids()` --calls--> `parse()`  [EXTRACTED]
  app/src/voice/__tests__/parse.test.ts → app/src/voice/parse.ts
- `toggle()` --calls--> `errorFx()`  [EXTRACTED]
  app/src/screens/Orders.tsx → app/src/lib/feedback.ts
- `App()` --calls--> `StoreProvider()`  [EXTRACTED]
  app/src/App.tsx → app/src/lib/store.tsx
- `App()` --calls--> `Admin()`  [EXTRACTED]
  app/src/App.tsx → app/src/screens/Admin.tsx
- `App()` --calls--> `BillPage()`  [EXTRACTED]
  app/src/App.tsx → app/src/screens/BillPage.tsx

## Import Cycles
- None detected.

## Communities (9 total, 1 thin omitted)

### Community 0 - "parse.ts"
Cohesion: 0.07
Nodes (49): AiOut, askAi(), CATALOG, catalogIndex, bigrams(), buildIndex(), Candidate, dice() (+41 more)

### Community 1 - "Udhaar.tsx"
Cohesion: 0.09
Nodes (27): deviceLabel(), LoginResult, SUPABASE_KEY, SUPABASE_URL, Ctx, logUsage(), State, Store (+19 more)

### Community 2 - "Voice.tsx"
Cohesion: 0.09
Nodes (49): get(), speakOn(), speakRate(), speakSlow(), custLabel(), Customer, findCustomer(), loadShop() (+41 more)

### Community 3 - "errorFx"
Cohesion: 0.17
Nodes (32): toast(), storeLogin(), buzz(), errorFx(), successFx(), tapFx(), tone(), invalidateShop() (+24 more)

### Community 4 - "rupees"
Cohesion: 0.14
Nodes (17): NumberSheet(), Sheet(), UpiSheet(), rupees(), day(), Galla(), Hisaab(), hourLabel() (+9 more)

### Community 5 - "BillCard.tsx"
Cohesion: 0.18
Nodes (13): BILL_T, BillCard(), BillData, BillLine, CAT, L3, units, BillPage() (+5 more)

### Community 6 - "App.tsx"
Cohesion: 0.09
Nodes (65): App(), Owner(), itemName(), Icon(), P, Ask, AskHost(), askText() (+57 more)

### Community 7 - "Tap"
Cohesion: 0.30
Nodes (14): Tap(), adb, Admin(), AdminBags(), AdminInterest(), AdminLogin(), submit(), AdminPhones() (+6 more)

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Tap()` connect `Tap` to `Udhaar.tsx`, `Voice.tsx`, `errorFx`, `rupees`, `App.tsx`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Should `parse.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06715063520871144 - nodes in this community are weakly interconnected._
- **Why does `errorFx()` connect `errorFx` to `Udhaar.tsx`, `Voice.tsx`, `rupees`, `App.tsx`, `Tap`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Should `Udhaar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09269162210338681 - nodes in this community are weakly interconnected._
- **Why does `successFx()` connect `errorFx` to `Udhaar.tsx`, `Voice.tsx`, `rupees`, `App.tsx`, `Tap`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Should `Voice.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09210526315789473 - nodes in this community are weakly interconnected._
- **Should `rupees` be split into smaller, more focused modules?**
  _Cohesion score 0.1402116402116402 - nodes in this community are weakly interconnected._