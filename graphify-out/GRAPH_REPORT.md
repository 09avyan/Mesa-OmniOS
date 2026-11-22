# Graph Report - src  (2026-11-22)

## Corpus Check
- 38 files · ~26,344 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: .css 1)

## Summary
- 291 nodes · 1092 edges · 8 communities (7 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `eab99d1a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- parse.ts
- Voice.tsx
- errorFx
- Udhaar.tsx
- BillPage.tsx
- Maal.tsx

## God Nodes (most connected - your core abstractions)
1. `Tap()` - 49 edges
2. `errorFx()` - 42 edges
3. `useT()` - 42 edges
4. `successFx()` - 39 edges
5. `Voice()` - 36 edges
6. `Icon()` - 30 edges
7. `navigate()` - 30 edges
8. `rupees()` - 28 edges
9. `toast()` - 25 edges
10. `BackBar()` - 23 edges

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

### Community 0 - "App.tsx"
Cohesion: 0.12
Nodes (54): App(), Owner(), Icon(), P, BackBar(), BottomBar(), RowButton(), TabId (+46 more)

### Community 1 - "parse.ts"
Cohesion: 0.07
Nodes (55): findCustomer(), loadShop(), num(), LivePreview(), AiOut, CATALOG, catalogIndex, bigrams() (+47 more)

### Community 2 - "Voice.tsx"
Cohesion: 0.10
Nodes (41): get(), speakOn(), speakRate(), speakSlow(), custLabel(), Customer, priceOf(), Shop (+33 more)

### Community 3 - "errorFx"
Cohesion: 0.13
Nodes (39): push(), toast(), buzz(), errorFx(), successFx(), tapFx(), tone(), invalidateShop() (+31 more)

### Community 4 - "Udhaar.tsx"
Cohesion: 0.09
Nodes (28): LoginResult, storeEmail(), storeLogin(), storePassword(), SUPABASE_KEY, SUPABASE_URL, Ctx, logUsage() (+20 more)

### Community 5 - "BillPage.tsx"
Cohesion: 0.17
Nodes (14): BILL_T, BillCard(), BillData, BillLine, CAT, itemName(), L3, units (+6 more)

### Community 6 - "Maal.tsx"
Cohesion: 0.19
Nodes (8): NumberSheet(), Sheet(), ShopItem, CAT, fmt(), low(), Maal(), units

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `errorFx()` connect `errorFx` to `App.tsx`, `Voice.tsx`, `Udhaar.tsx`, `Maal.tsx`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11892583120204604 - nodes in this community are weakly interconnected._
- **Why does `Tap()` connect `App.tsx` to `Voice.tsx`, `errorFx`, `Udhaar.tsx`, `Maal.tsx`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Should `parse.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07067307692307692 - nodes in this community are weakly interconnected._
- **Why does `successFx()` connect `errorFx` to `App.tsx`, `Voice.tsx`, `Udhaar.tsx`, `Maal.tsx`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Should `Voice.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10017730496453901 - nodes in this community are weakly interconnected._
- **Should `errorFx` be split into smaller, more focused modules?**
  _Cohesion score 0.13170731707317074 - nodes in this community are weakly interconnected._