# Graph Report - src  (2026-11-23)

## Corpus Check
- 44 files · ~37,743 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: .css 1)

## Summary
- 348 nodes · 1372 edges · 8 communities (7 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b680eba7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- parse.ts
- Udhaar.tsx
- Voice.tsx
- errorFx
- Store.tsx
- App.tsx
- ui.tsx

## God Nodes (most connected - your core abstractions)
1. `Tap()` - 68 edges
2. `useT()` - 64 edges
3. `Icon()` - 44 edges
4. `errorFx()` - 40 edges
5. `successFx()` - 40 edges
6. `rupees()` - 40 edges
7. `navigate()` - 37 edges
8. `BackBar()` - 35 edges
9. `toast()` - 30 edges
10. `Owner()` - 29 edges

## Surprising Connections (you probably didn't know these)
- `StockCheck()` --calls--> `itemName()`  [EXTRACTED]
  app/src/screens/Briefing.tsx → app/src/components/BillCard.tsx
- `Hisaab()` --calls--> `itemName()`  [EXTRACTED]
  app/src/screens/Hisaab.tsx → app/src/components/BillCard.tsx
- `OrderDetail()` --calls--> `itemName()`  [EXTRACTED]
  app/src/screens/Orders.tsx → app/src/components/BillCard.tsx
- `BillCard()` --calls--> `rupees()`  [EXTRACTED]
  app/src/components/BillCard.tsx → app/src/lib/i18n.tsx
- `BillDetail()` --calls--> `BillCard()`  [EXTRACTED]
  app/src/screens/Bills.tsx → app/src/components/BillCard.tsx

## Import Cycles
- None detected.

## Communities (8 total, 1 thin omitted)

### Community 0 - "parse.ts"
Cohesion: 0.06
Nodes (68): askText(), findCustomer(), loadShop(), num(), AiReceipt, amt(), ItemPicker(), Receipt() (+60 more)

### Community 1 - "Udhaar.tsx"
Cohesion: 0.11
Nodes (28): deviceLabel(), LoginResult, SUPABASE_KEY, SUPABASE_URL, Ctx, logUsage(), State, Store (+20 more)

### Community 2 - "Voice.tsx"
Cohesion: 0.09
Nodes (38): get(), speakOn(), speakRate(), speakSlow(), custLabel(), Customer, priceOf(), Shop (+30 more)

### Community 3 - "errorFx"
Cohesion: 0.14
Nodes (34): toast(), storeLogin(), buzz(), errorFx(), successFx(), tapFx(), tone(), invalidateShop() (+26 more)

### Community 5 - "Store.tsx"
Cohesion: 0.07
Nodes (39): App(), BILL_T, BillCard(), BillData, BillLine, CAT, itemName(), L3 (+31 more)

### Community 6 - "App.tsx"
Cohesion: 0.14
Nodes (56): Owner(), Icon(), NumberSheet(), AskHost(), BackBar(), BottomBar(), RowButton(), Tap() (+48 more)

### Community 7 - "ui.tsx"
Cohesion: 0.08
Nodes (28): P, Ask, push(), pushAsk(), Sheet(), TabId, TABS, ToastMsg (+20 more)

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Tap()` connect `App.tsx` to `parse.ts`, `Udhaar.tsx`, `Voice.tsx`, `errorFx`, `ui.tsx`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Should `parse.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05809802012333658 - nodes in this community are weakly interconnected._
- **Why does `errorFx()` connect `errorFx` to `parse.ts`, `Udhaar.tsx`, `Voice.tsx`, `Store.tsx`, `App.tsx`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Should `Udhaar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10588235294117647 - nodes in this community are weakly interconnected._
- **Why does `successFx()` connect `errorFx` to `parse.ts`, `Udhaar.tsx`, `Voice.tsx`, `Store.tsx`, `App.tsx`, `ui.tsx`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Should `Voice.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09292929292929293 - nodes in this community are weakly interconnected._
- **Should `errorFx` be split into smaller, more focused modules?**
  _Cohesion score 0.13940256045519203 - nodes in this community are weakly interconnected._