# Graph Report - src  (2026-11-23)

## Corpus Check
- 43 files · ~35,994 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: .css 1)

## Summary
- 342 nodes · 1382 edges · 8 communities (7 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bb59c4ad`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- parse.ts
- Udhaar.tsx
- Voice.tsx
- errorFx
- ui.tsx
- BillCard.tsx
- App.tsx

## God Nodes (most connected - your core abstractions)
1. `Tap()` - 68 edges
2. `useT()` - 62 edges
3. `errorFx()` - 48 edges
4. `successFx()` - 48 edges
5. `navigate()` - 40 edges
6. `rupees()` - 39 edges
7. `Voice()` - 36 edges
8. `Icon()` - 36 edges
9. `BackBar()` - 35 edges
10. `toast()` - 34 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `StoreProvider()`  [EXTRACTED]
  app/src/App.tsx → app/src/lib/store.tsx
- `App()` --calls--> `Admin()`  [EXTRACTED]
  app/src/App.tsx → app/src/screens/Admin.tsx
- `App()` --calls--> `BillPage()`  [EXTRACTED]
  app/src/App.tsx → app/src/screens/BillPage.tsx
- `App()` --calls--> `StorePage()`  [EXTRACTED]
  app/src/App.tsx → app/src/screens/Store.tsx
- `App()` --calls--> `BalancePage()`  [EXTRACTED]
  app/src/App.tsx → app/src/screens/Udhaar.tsx

## Import Cycles
- None detected.

## Communities (8 total, 1 thin omitted)

### Community 0 - "parse.ts"
Cohesion: 0.07
Nodes (52): findCustomer(), loadShop(), num(), ShopItem, LivePreview(), CATALOG, catalogIndex, bigrams() (+44 more)

### Community 1 - "Udhaar.tsx"
Cohesion: 0.10
Nodes (30): deviceLabel(), LoginResult, storeLogin(), SUPABASE_KEY, SUPABASE_URL, Ctx, logUsage(), State (+22 more)

### Community 2 - "Voice.tsx"
Cohesion: 0.09
Nodes (46): get(), speakOn(), speakRate(), speakSlow(), custLabel(), Customer, priceOf(), Shop (+38 more)

### Community 3 - "errorFx"
Cohesion: 0.10
Nodes (47): push(), toast(), buzz(), errorFx(), successFx(), tapFx(), tone(), invalidateShop() (+39 more)

### Community 4 - "ui.tsx"
Cohesion: 0.12
Nodes (18): NumberSheet(), Sheet(), UpiSheet(), CAT, fmt(), low(), Maal(), units (+10 more)

### Community 5 - "BillCard.tsx"
Cohesion: 0.14
Nodes (23): BILL_T, BillCard(), BillData, BillLine, CAT, itemName(), L3, units (+15 more)

### Community 6 - "App.tsx"
Cohesion: 0.09
Nodes (69): App(), Owner(), Icon(), P, Ask, AskHost(), askText(), BackBar() (+61 more)

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Tap()` connect `App.tsx` to `Udhaar.tsx`, `Voice.tsx`, `errorFx`, `ui.tsx`, `BillCard.tsx`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Should `parse.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07213114754098361 - nodes in this community are weakly interconnected._
- **Why does `errorFx()` connect `errorFx` to `Udhaar.tsx`, `Voice.tsx`, `ui.tsx`, `App.tsx`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Should `Udhaar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1006006006006006 - nodes in this community are weakly interconnected._
- **Why does `successFx()` connect `errorFx` to `Udhaar.tsx`, `Voice.tsx`, `ui.tsx`, `BillCard.tsx`, `App.tsx`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `Voice.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0859538784067086 - nodes in this community are weakly interconnected._
- **Should `errorFx` be split into smaller, more focused modules?**
  _Cohesion score 0.10459183673469388 - nodes in this community are weakly interconnected._