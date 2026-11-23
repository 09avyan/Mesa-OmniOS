# Graph Report - src  (2026-11-23)

## Corpus Check
- 44 files · ~36,511 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: .css 1)

## Summary
- 346 nodes · 1397 edges · 8 communities (7 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5c3facd7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- parse.ts
- Udhaar.tsx
- Voice.tsx
- errorFx
- Receipt.tsx
- BillCard.tsx
- App.tsx

## God Nodes (most connected - your core abstractions)
1. `Tap()` - 68 edges
2. `useT()` - 64 edges
3. `errorFx()` - 48 edges
4. `successFx()` - 48 edges
5. `navigate()` - 40 edges
6. `rupees()` - 39 edges
7. `Voice()` - 36 edges
8. `Icon()` - 36 edges
9. `BackBar()` - 35 edges
10. `toast()` - 34 edges

## Surprising Connections (you probably didn't know these)
- `Owner()` --calls--> `savedLang()`  [EXTRACTED]
  app/src/App.tsx → app/src/lib/i18n.tsx
- `NumberSheet()` --calls--> `useT()`  [EXTRACTED]
  app/src/components/Pad.tsx → app/src/lib/i18n.tsx
- `UpiSheet()` --calls--> `useT()`  [EXTRACTED]
  app/src/components/UpiSheet.tsx → app/src/lib/i18n.tsx
- `ForecastCard()` --calls--> `useT()`  [EXTRACTED]
  app/src/screens/Forecast.tsx → app/src/lib/i18n.tsx
- `Galla()` --calls--> `useT()`  [EXTRACTED]
  app/src/screens/Hisaab.tsx → app/src/lib/i18n.tsx

## Import Cycles
- None detected.

## Communities (8 total, 1 thin omitted)

### Community 0 - "parse.ts"
Cohesion: 0.06
Nodes (60): Customer, findCustomer(), num(), priceOf(), Shop, ShopItem, ShopMatchable, supabase (+52 more)

### Community 1 - "Udhaar.tsx"
Cohesion: 0.07
Nodes (38): deviceLabel(), LoginResult, storeLogin(), SUPABASE_KEY, SUPABASE_URL, Ctx, logUsage(), State (+30 more)

### Community 2 - "Voice.tsx"
Cohesion: 0.11
Nodes (40): UpiSheet(), get(), speakOn(), speakRate(), speakSlow(), custLabel(), loadShop(), listen() (+32 more)

### Community 3 - "errorFx"
Cohesion: 0.12
Nodes (44): NumberSheet(), push(), Sheet(), toast(), buzz(), errorFx(), successFx(), tapFx() (+36 more)

### Community 4 - "Receipt.tsx"
Cohesion: 0.26
Nodes (11): AiReceipt, amt(), Receipt(), addLine(), onFile(), read(), RLine, shrink() (+3 more)

### Community 5 - "BillCard.tsx"
Cohesion: 0.07
Nodes (38): App(), BILL_T, BillCard(), BillData, BillLine, CAT, itemName(), L3 (+30 more)

### Community 6 - "App.tsx"
Cohesion: 0.12
Nodes (57): Owner(), Icon(), P, Ask, AskHost(), askText(), BackBar(), BottomBar() (+49 more)

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Tap()` connect `App.tsx` to `Udhaar.tsx`, `Voice.tsx`, `errorFx`, `Receipt.tsx`, `BillCard.tsx`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Should `parse.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06237424547283702 - nodes in this community are weakly interconnected._
- **Why does `errorFx()` connect `errorFx` to `Udhaar.tsx`, `Voice.tsx`, `Receipt.tsx`, `App.tsx`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Should `Udhaar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07149758454106281 - nodes in this community are weakly interconnected._
- **Why does `successFx()` connect `errorFx` to `Udhaar.tsx`, `Voice.tsx`, `Receipt.tsx`, `BillCard.tsx`, `App.tsx`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Should `Voice.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10531400966183575 - nodes in this community are weakly interconnected._
- **Should `errorFx` be split into smaller, more focused modules?**
  _Cohesion score 0.11989795918367346 - nodes in this community are weakly interconnected._