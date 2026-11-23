# Graph Report - src  (2026-11-23)

## Corpus Check
- 44 files · ~38,186 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: .css 1)

## Summary
- 348 nodes · 1388 edges · 9 communities (8 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `da9a5db0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- parse.ts
- Udhaar.tsx
- Voice.tsx
- errorFx
- Store.tsx
- Store.tsx
- App.tsx
- ui.tsx

## God Nodes (most connected - your core abstractions)
1. `Tap()` - 68 edges
2. `useT()` - 62 edges
3. `Icon()` - 56 edges
4. `errorFx()` - 40 edges
5. `successFx()` - 40 edges
6. `rupees()` - 40 edges
7. `navigate()` - 37 edges
8. `BackBar()` - 35 edges
9. `toast()` - 33 edges
10. `Owner()` - 29 edges

## Surprising Connections (you probably didn't know these)
- `toggle()` --calls--> `errorFx()`  [EXTRACTED]
  app/src/screens/Orders.tsx → app/src/lib/feedback.ts
- `StockCheck()` --calls--> `itemName()`  [EXTRACTED]
  app/src/screens/Briefing.tsx → app/src/components/BillCard.tsx
- `Hisaab()` --calls--> `itemName()`  [EXTRACTED]
  app/src/screens/Hisaab.tsx → app/src/components/BillCard.tsx
- `OrderPage()` --calls--> `itemName()`  [EXTRACTED]
  app/src/screens/Store.tsx → app/src/components/BillCard.tsx
- `BillCard()` --calls--> `rupees()`  [EXTRACTED]
  app/src/components/BillCard.tsx → app/src/lib/i18n.tsx

## Import Cycles
- None detected.

## Communities (9 total, 1 thin omitted)

### Community 0 - "parse.ts"
Cohesion: 0.06
Nodes (68): askText(), findCustomer(), loadShop(), num(), AiReceipt, amt(), ItemPicker(), Receipt() (+60 more)

### Community 1 - "Udhaar.tsx"
Cohesion: 0.11
Nodes (26): deviceLabel(), SUPABASE_KEY, SUPABASE_URL, Ctx, logUsage(), State, Store, StoreProvider() (+18 more)

### Community 2 - "Voice.tsx"
Cohesion: 0.10
Nodes (34): get(), speakOn(), speakRate(), speakSlow(), Customer, priceOf(), Shop, ShopMatchable (+26 more)

### Community 3 - "errorFx"
Cohesion: 0.13
Nodes (34): toast(), LoginResult, storeLogin(), buzz(), errorFx(), successFx(), tapFx(), tone() (+26 more)

### Community 4 - "Store.tsx"
Cohesion: 0.16
Nodes (16): CAT, CATS, get(), Item, Lang, OrderPage(), OS, pub (+8 more)

### Community 5 - "Store.tsx"
Cohesion: 0.08
Nodes (28): BILL_T, BillCard(), BillData, BillLine, CAT, itemName(), L3, units (+20 more)

### Community 6 - "App.tsx"
Cohesion: 0.15
Nodes (55): Owner(), Icon(), NumberSheet(), AskHost(), BackBar(), BottomBar(), RowButton(), Sheet() (+47 more)

### Community 7 - "ui.tsx"
Cohesion: 0.09
Nodes (30): App(), P, Ask, push(), pushAsk(), TabId, TABS, ToastHost() (+22 more)

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Tap()` connect `App.tsx` to `parse.ts`, `Udhaar.tsx`, `Voice.tsx`, `errorFx`, `Store.tsx`, `ui.tsx`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Should `parse.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05809802012333658 - nodes in this community are weakly interconnected._
- **Why does `Icon()` connect `App.tsx` to `parse.ts`, `Udhaar.tsx`, `Voice.tsx`, `errorFx`, `Store.tsx`, `Store.tsx`, `ui.tsx`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Should `Udhaar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11088709677419355 - nodes in this community are weakly interconnected._
- **Why does `errorFx()` connect `errorFx` to `parse.ts`, `Udhaar.tsx`, `Voice.tsx`, `Store.tsx`, `Store.tsx`, `App.tsx`, `ui.tsx`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Should `Voice.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09634146341463415 - nodes in this community are weakly interconnected._
- **Should `errorFx` be split into smaller, more focused modules?**
  _Cohesion score 0.1349527665317139 - nodes in this community are weakly interconnected._