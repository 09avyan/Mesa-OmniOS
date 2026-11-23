# Graph Report - src  (2026-11-23)

## Corpus Check
- 44 files · ~37,023 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: .css 1)

## Summary
- 346 nodes · 1362 edges · 12 communities (11 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4b3ea9e1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- parse.ts
- Udhaar.tsx
- Voice.tsx
- errorFx
- shop.ts
- BillCard.tsx
- App.tsx
- ui.tsx
- Admin.tsx
- draft.ts
- prefs.ts

## God Nodes (most connected - your core abstractions)
1. `Tap()` - 68 edges
2. `useT()` - 64 edges
3. `errorFx()` - 41 edges
4. `successFx()` - 41 edges
5. `rupees()` - 40 edges
6. `Icon()` - 38 edges
7. `navigate()` - 38 edges
8. `BackBar()` - 35 edges
9. `toast()` - 30 edges
10. `Owner()` - 29 edges

## Surprising Connections (you probably didn't know these)
- `Owner()` --calls--> `savedLang()`  [EXTRACTED]
  app/src/App.tsx → app/src/lib/i18n.tsx
- `NumberSheet()` --calls--> `useT()`  [EXTRACTED]
  app/src/components/Pad.tsx → app/src/lib/i18n.tsx
- `UpiSheet()` --calls--> `useT()`  [EXTRACTED]
  app/src/components/UpiSheet.tsx → app/src/lib/i18n.tsx
- `BillDetail()` --calls--> `useT()`  [EXTRACTED]
  app/src/screens/Bills.tsx → app/src/lib/i18n.tsx
- `ForecastCard()` --calls--> `useT()`  [EXTRACTED]
  app/src/screens/Forecast.tsx → app/src/lib/i18n.tsx

## Import Cycles
- None detected.

## Communities (12 total, 1 thin omitted)

### Community 0 - "parse.ts"
Cohesion: 0.10
Nodes (35): FILLER, SEPARATORS, tokenize(), Unit, UNIT_WORDS, unitOf(), DEV_DIGITS, devToAscii() (+27 more)

### Community 1 - "Udhaar.tsx"
Cohesion: 0.08
Nodes (34): App(), ToastHost(), deviceLabel(), LoginResult, storeLogin(), SUPABASE_KEY, SUPABASE_URL, I18nProvider() (+26 more)

### Community 2 - "Voice.tsx"
Cohesion: 0.15
Nodes (27): UpiSheet(), custLabel(), listen(), ListenError, Rec, speak(), speechSupported(), AnswerView() (+19 more)

### Community 3 - "errorFx"
Cohesion: 0.13
Nodes (37): toast(), buzz(), errorFx(), successFx(), tapFx(), tone(), invalidateShop(), ShopItem (+29 more)

### Community 4 - "shop.ts"
Cohesion: 0.16
Nodes (19): findCustomer(), loadShop(), num(), AiOut, askAi(), needsAi(), CATALOG, catalogIndex (+11 more)

### Community 5 - "BillCard.tsx"
Cohesion: 0.11
Nodes (26): BILL_T, BillCard(), BillData, BillLine, CAT, itemName(), L3, units (+18 more)

### Community 6 - "App.tsx"
Cohesion: 0.12
Nodes (54): Owner(), Icon(), P, AskHost(), BackBar(), BottomBar(), RowButton(), Tap() (+46 more)

### Community 7 - "ui.tsx"
Cohesion: 0.09
Nodes (27): NumberSheet(), Ask, askText(), push(), pushAsk(), Sheet(), TabId, TABS (+19 more)

### Community 8 - "Admin.tsx"
Cohesion: 0.26
Nodes (13): adb, Admin(), AdminBags(), AdminInterest(), AdminLogin(), submit(), AdminPhones(), call() (+5 more)

### Community 9 - "draft.ts"
Cohesion: 0.21
Nodes (13): Customer, priceOf(), Shop, ShopMatchable, understand(), buildDraft(), Draft, Line (+5 more)

### Community 10 - "prefs.ts"
Cohesion: 0.36
Nodes (4): get(), speakOn(), speakRate(), speakSlow()

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Tap()` connect `App.tsx` to `Udhaar.tsx`, `Voice.tsx`, `errorFx`, `BillCard.tsx`, `ui.tsx`, `Admin.tsx`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Should `parse.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10128205128205128 - nodes in this community are weakly interconnected._
- **Why does `errorFx()` connect `errorFx` to `Udhaar.tsx`, `Voice.tsx`, `App.tsx`, `ui.tsx`, `Admin.tsx`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Should `Udhaar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07682926829268293 - nodes in this community are weakly interconnected._
- **Why does `successFx()` connect `errorFx` to `Udhaar.tsx`, `Voice.tsx`, `BillCard.tsx`, `App.tsx`, `ui.tsx`, `Admin.tsx`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Should `Voice.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1477832512315271 - nodes in this community are weakly interconnected._
- **Should `errorFx` be split into smaller, more focused modules?**
  _Cohesion score 0.1346153846153846 - nodes in this community are weakly interconnected._