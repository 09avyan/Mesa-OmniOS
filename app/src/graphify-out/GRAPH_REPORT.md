# Graph Report - src  (2026-11-23)

## Corpus Check
- 44 files · ~36,963 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: .css 1)

## Summary
- 346 nodes · 1382 edges · 10 communities (9 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `56364490`
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
- ui.tsx
- Admin.tsx

## God Nodes (most connected - your core abstractions)
1. `Tap()` - 68 edges
2. `useT()` - 64 edges
3. `errorFx()` - 46 edges
4. `successFx()` - 46 edges
5. `rupees()` - 40 edges
6. `navigate()` - 39 edges
7. `Icon()` - 38 edges
8. `BackBar()` - 35 edges
9. `toast()` - 35 edges
10. `Owner()` - 29 edges

## Surprising Connections (you probably didn't know these)
- `Tap()` --calls--> `tapFx()`  [EXTRACTED]
  app/src/components/ui.tsx → app/src/lib/feedback.ts
- `UpiSheet()` --calls--> `Tap()`  [EXTRACTED]
  app/src/components/UpiSheet.tsx → app/src/components/ui.tsx
- `AdminBags()` --calls--> `Tap()`  [EXTRACTED]
  app/src/screens/Admin.tsx → app/src/components/ui.tsx
- `AdminLogin()` --calls--> `Tap()`  [EXTRACTED]
  app/src/screens/Admin.tsx → app/src/components/ui.tsx
- `AdminPhones()` --calls--> `Tap()`  [EXTRACTED]
  app/src/screens/Admin.tsx → app/src/components/ui.tsx

## Import Cycles
- None detected.

## Communities (10 total, 1 thin omitted)

### Community 0 - "parse.ts"
Cohesion: 0.07
Nodes (50): supabase, AiOut, CATALOG, catalogIndex, bigrams(), buildIndex(), Candidate, dice() (+42 more)

### Community 1 - "Udhaar.tsx"
Cohesion: 0.15
Nodes (16): deviceLabel(), LoginResult, storeLogin(), SUPABASE_KEY, SUPABASE_URL, Ctx, logUsage(), State (+8 more)

### Community 2 - "Voice.tsx"
Cohesion: 0.09
Nodes (47): get(), speakOn(), speakRate(), speakSlow(), custLabel(), Customer, findCustomer(), loadShop() (+39 more)

### Community 3 - "errorFx"
Cohesion: 0.09
Nodes (47): toast(), ToastHost(), buzz(), errorFx(), successFx(), tapFx(), tone(), invalidateShop() (+39 more)

### Community 4 - "Receipt.tsx"
Cohesion: 0.23
Nodes (14): askText(), pushAsk(), AiReceipt, amt(), ItemPicker(), Receipt(), addLine(), onFile() (+6 more)

### Community 5 - "BillCard.tsx"
Cohesion: 0.14
Nodes (17): BILL_T, BillCard(), BillData, BillLine, CAT, itemName(), L3, units (+9 more)

### Community 6 - "App.tsx"
Cohesion: 0.12
Nodes (64): App(), Owner(), Icon(), P, NumberSheet(), AskHost(), BackBar(), BottomBar() (+56 more)

### Community 7 - "ui.tsx"
Cohesion: 0.09
Nodes (21): Ask, push(), Sheet(), TabId, TABS, ToastMsg, UpiSheet(), Ctx (+13 more)

### Community 8 - "Admin.tsx"
Cohesion: 0.26
Nodes (13): adb, Admin(), AdminBags(), AdminInterest(), AdminLogin(), submit(), AdminPhones(), call() (+5 more)

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Tap()` connect `App.tsx` to `Udhaar.tsx`, `Voice.tsx`, `errorFx`, `Receipt.tsx`, `ui.tsx`, `Admin.tsx`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Should `parse.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07071887784921099 - nodes in this community are weakly interconnected._
- **Why does `errorFx()` connect `errorFx` to `Udhaar.tsx`, `Voice.tsx`, `Receipt.tsx`, `App.tsx`, `ui.tsx`, `Admin.tsx`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `Voice.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08754208754208755 - nodes in this community are weakly interconnected._
- **Why does `successFx()` connect `errorFx` to `Udhaar.tsx`, `Voice.tsx`, `Receipt.tsx`, `App.tsx`, `ui.tsx`, `Admin.tsx`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Should `errorFx` be split into smaller, more focused modules?**
  _Cohesion score 0.0946938775510204 - nodes in this community are weakly interconnected._
- **Should `BillCard.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14210526315789473 - nodes in this community are weakly interconnected._