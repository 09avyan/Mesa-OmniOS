# Graph Report - src  (2026-11-23)

## Corpus Check
- 44 files · ~38,046 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: .css 1)

## Summary
- 348 nodes · 1393 edges · 8 communities (7 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8960d479`
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
2. `useT()` - 62 edges
3. `Icon()` - 56 edges
4. `errorFx()` - 40 edges
5. `successFx()` - 40 edges
6. `rupees()` - 40 edges
7. `toast()` - 38 edges
8. `navigate()` - 37 edges
9. `BackBar()` - 35 edges
10. `Owner()` - 29 edges

## Surprising Connections (you probably didn't know these)
- `BillPage()` --calls--> `Icon()`  [EXTRACTED]
  app/src/screens/BillPage.tsx → app/src/components/Icon.tsx
- `BriefingCard()` --calls--> `Icon()`  [EXTRACTED]
  app/src/screens/Briefing.tsx → app/src/components/Icon.tsx
- `Login()` --calls--> `Icon()`  [EXTRACTED]
  app/src/screens/Login.tsx → app/src/components/Icon.tsx
- `Maal()` --calls--> `Icon()`  [EXTRACTED]
  app/src/screens/Maal.tsx → app/src/components/Icon.tsx
- `Receipt()` --calls--> `Icon()`  [EXTRACTED]
  app/src/screens/Receipt.tsx → app/src/components/Icon.tsx

## Import Cycles
- None detected.

## Communities (8 total, 1 thin omitted)

### Community 0 - "parse.ts"
Cohesion: 0.06
Nodes (68): askText(), findCustomer(), loadShop(), num(), AiReceipt, amt(), ItemPicker(), Receipt() (+60 more)

### Community 1 - "Udhaar.tsx"
Cohesion: 0.09
Nodes (36): App(), ToastHost(), deviceLabel(), LoginResult, storeLogin(), SUPABASE_KEY, SUPABASE_URL, I18nProvider() (+28 more)

### Community 2 - "Voice.tsx"
Cohesion: 0.10
Nodes (34): get(), speakOn(), speakRate(), speakSlow(), Customer, priceOf(), Shop, ShopMatchable (+26 more)

### Community 3 - "errorFx"
Cohesion: 0.13
Nodes (35): toast(), buzz(), errorFx(), successFx(), tapFx(), tone(), Key, invalidateShop() (+27 more)

### Community 5 - "Store.tsx"
Cohesion: 0.07
Nodes (35): BILL_T, BillCard(), BillData, BillLine, CAT, itemName(), L3, units (+27 more)

### Community 6 - "App.tsx"
Cohesion: 0.16
Nodes (53): Owner(), Icon(), NumberSheet(), AskHost(), BackBar(), BottomBar(), RowButton(), Sheet() (+45 more)

### Community 7 - "ui.tsx"
Cohesion: 0.08
Nodes (30): P, Ask, push(), pushAsk(), TabId, TABS, ToastMsg, setSound() (+22 more)

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Tap()` connect `App.tsx` to `parse.ts`, `Udhaar.tsx`, `Voice.tsx`, `errorFx`, `ui.tsx`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Should `parse.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05809802012333658 - nodes in this community are weakly interconnected._
- **Why does `Icon()` connect `App.tsx` to `parse.ts`, `Udhaar.tsx`, `Voice.tsx`, `errorFx`, `Store.tsx`, `ui.tsx`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Should `Udhaar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0898989898989899 - nodes in this community are weakly interconnected._
- **Why does `errorFx()` connect `errorFx` to `parse.ts`, `Udhaar.tsx`, `Voice.tsx`, `Store.tsx`, `App.tsx`, `ui.tsx`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Should `Voice.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09634146341463415 - nodes in this community are weakly interconnected._
- **Should `errorFx` be split into smaller, more focused modules?**
  _Cohesion score 0.12955465587044535 - nodes in this community are weakly interconnected._