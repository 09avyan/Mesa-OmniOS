# Graph Report - src  (2026-11-23)

## Corpus Check
- 42 files · ~34,789 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: .css 1)

## Summary
- 335 nodes · 1331 edges · 8 communities (7 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9434fd88`
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
1. `Tap()` - 65 edges
2. `useT()` - 59 edges
3. `errorFx()` - 46 edges
4. `successFx()` - 46 edges
5. `rupees()` - 37 edges
6. `navigate()` - 37 edges
7. `Icon()` - 36 edges
8. `Voice()` - 36 edges
9. `BackBar()` - 33 edges
10. `toast()` - 32 edges

## Surprising Connections (you probably didn't know these)
- `toggle()` --calls--> `errorFx()`  [EXTRACTED]
  app/src/screens/Orders.tsx → app/src/lib/feedback.ts
- `App()` --calls--> `StoreProvider()`  [EXTRACTED]
  app/src/App.tsx → app/src/lib/store.tsx
- `App()` --calls--> `Admin()`  [EXTRACTED]
  app/src/App.tsx → app/src/screens/Admin.tsx
- `App()` --calls--> `OrderPage()`  [EXTRACTED]
  app/src/App.tsx → app/src/screens/Store.tsx
- `App()` --calls--> `StorePage()`  [EXTRACTED]
  app/src/App.tsx → app/src/screens/Store.tsx

## Import Cycles
- None detected.

## Communities (8 total, 1 thin omitted)

### Community 0 - "parse.ts"
Cohesion: 0.07
Nodes (51): LivePreview(), AiOut, CATALOG, catalogIndex, bigrams(), buildIndex(), Candidate, dice() (+43 more)

### Community 1 - "Udhaar.tsx"
Cohesion: 0.10
Nodes (30): deviceLabel(), LoginResult, storeLogin(), SUPABASE_KEY, SUPABASE_URL, Ctx, logUsage(), State (+22 more)

### Community 2 - "Voice.tsx"
Cohesion: 0.10
Nodes (44): get(), speakOn(), speakRate(), speakSlow(), custLabel(), Customer, findCustomer(), loadShop() (+36 more)

### Community 3 - "errorFx"
Cohesion: 0.10
Nodes (48): toast(), buzz(), errorFx(), setSound(), soundEnabled(), successFx(), tapFx(), tone() (+40 more)

### Community 4 - "ui.tsx"
Cohesion: 0.09
Nodes (29): NumberSheet(), Ask, askText(), push(), pushAsk(), Sheet(), TabId, TABS (+21 more)

### Community 5 - "BillCard.tsx"
Cohesion: 0.14
Nodes (22): BILL_T, BillCard(), BillData, BillLine, CAT, itemName(), L3, units (+14 more)

### Community 6 - "App.tsx"
Cohesion: 0.10
Nodes (55): App(), Owner(), Icon(), P, AskHost(), BackBar(), BottomBar(), RowButton() (+47 more)

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Tap()` connect `App.tsx` to `Udhaar.tsx`, `Voice.tsx`, `errorFx`, `ui.tsx`, `BillCard.tsx`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Should `parse.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07175141242937853 - nodes in this community are weakly interconnected._
- **Why does `errorFx()` connect `errorFx` to `Udhaar.tsx`, `Voice.tsx`, `ui.tsx`, `App.tsx`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Should `Udhaar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1006006006006006 - nodes in this community are weakly interconnected._
- **Why does `successFx()` connect `errorFx` to `Udhaar.tsx`, `Voice.tsx`, `ui.tsx`, `BillCard.tsx`, `App.tsx`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Should `Voice.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09879336349924585 - nodes in this community are weakly interconnected._
- **Should `errorFx` be split into smaller, more focused modules?**
  _Cohesion score 0.10431372549019607 - nodes in this community are weakly interconnected._