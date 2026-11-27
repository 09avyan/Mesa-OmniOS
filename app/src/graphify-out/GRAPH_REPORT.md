# Graph Report - src  (2026-11-23)

## Corpus Check
- 44 files · ~38,186 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: .css 1)

## Summary
- 348 nodes · 1448 edges · 9 communities (8 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3d0894b2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- parse.ts
- Udhaar.tsx
- Voice.tsx
- errorFx
- Receipt.tsx
- store.tsx
- App.tsx
- ui.tsx

## God Nodes (most connected - your core abstractions)
1. `Tap()` - 68 edges
2. `useT()` - 64 edges
3. `Icon()` - 56 edges
4. `successFx()` - 54 edges
5. `errorFx()` - 53 edges
6. `navigate()` - 41 edges
7. `rupees()` - 40 edges
8. `toast()` - 38 edges
9. `Voice()` - 36 edges
10. `BackBar()` - 35 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `ToastHost()`  [EXTRACTED]
  app/src/App.tsx → app/src/components/ui.tsx
- `App()` --calls--> `StoreProvider()`  [EXTRACTED]
  app/src/App.tsx → app/src/lib/store.tsx
- `App()` --calls--> `Admin()`  [EXTRACTED]
  app/src/App.tsx → app/src/screens/Admin.tsx
- `App()` --calls--> `StorePage()`  [EXTRACTED]
  app/src/App.tsx → app/src/screens/Store.tsx
- `Owner()` --calls--> `Login()`  [EXTRACTED]
  app/src/App.tsx → app/src/screens/Login.tsx

## Import Cycles
- None detected.

## Communities (9 total, 1 thin omitted)

### Community 0 - "parse.ts"
Cohesion: 0.07
Nodes (54): findCustomer(), loadShop(), num(), LivePreview(), AiOut, CATALOG, catalogIndex, bigrams() (+46 more)

### Community 1 - "Udhaar.tsx"
Cohesion: 0.06
Nodes (41): BILL_T, BillData, BillLine, CAT, L3, units, SUPABASE_KEY, SUPABASE_URL (+33 more)

### Community 2 - "Voice.tsx"
Cohesion: 0.10
Nodes (37): get(), speakOn(), speakRate(), speakSlow(), Customer, priceOf(), Shop, ShopMatchable (+29 more)

### Community 3 - "errorFx"
Cohesion: 0.12
Nodes (42): toast(), ToastHost(), buzz(), errorFx(), setSound(), successFx(), tapFx(), tone() (+34 more)

### Community 4 - "Receipt.tsx"
Cohesion: 0.24
Nodes (14): askText(), AiReceipt, amt(), ItemPicker(), Receipt(), addLine(), onFile(), read() (+6 more)

### Community 5 - "store.tsx"
Cohesion: 0.24
Nodes (10): deviceLabel(), LoginResult, storeLogin(), Ctx, logUsage(), State, Store, StoreProvider() (+2 more)

### Community 6 - "App.tsx"
Cohesion: 0.14
Nodes (58): App(), Owner(), BillCard(), itemName(), Icon(), NumberSheet(), AskHost(), BackBar() (+50 more)

### Community 7 - "ui.tsx"
Cohesion: 0.07
Nodes (35): P, Ask, push(), pushAsk(), Sheet(), TabId, TABS, ToastMsg (+27 more)

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Tap()` connect `App.tsx` to `Udhaar.tsx`, `Voice.tsx`, `errorFx`, `Receipt.tsx`, `store.tsx`, `ui.tsx`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Should `parse.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07093253968253968 - nodes in this community are weakly interconnected._
- **Why does `errorFx()` connect `errorFx` to `Udhaar.tsx`, `Voice.tsx`, `Receipt.tsx`, `store.tsx`, `App.tsx`, `ui.tsx`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Should `Udhaar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06462585034013606 - nodes in this community are weakly interconnected._
- **Why does `successFx()` connect `errorFx` to `Udhaar.tsx`, `Voice.tsx`, `Receipt.tsx`, `store.tsx`, `App.tsx`, `ui.tsx`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Should `Voice.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10253699788583509 - nodes in this community are weakly interconnected._
- **Should `errorFx` be split into smaller, more focused modules?**
  _Cohesion score 0.1226215644820296 - nodes in this community are weakly interconnected._