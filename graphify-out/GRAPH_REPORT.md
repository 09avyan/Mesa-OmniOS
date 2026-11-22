# Graph Report - src  (2026-11-22)

## Corpus Check
- 33 files · ~18,556 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: .css 1)

## Summary
- 226 nodes · 782 edges · 16 communities (14 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e02cafa9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- parse.ts
- errorFx
- shop.ts
- Voice.tsx
- App.tsx
- ReviewScreen
- ui.tsx
- Tap
- Settings.tsx
- draft.ts
- prefs.ts
- Bills.tsx
- ai.ts
- store.tsx

## God Nodes (most connected - your core abstractions)
1. `Tap()` - 39 edges
2. `Voice()` - 36 edges
3. `useT()` - 32 edges
4. `Icon()` - 22 edges
5. `errorFx()` - 21 edges
6. `ReviewScreen()` - 21 edges
7. `successFx()` - 19 edges
8. `BackBar()` - 17 edges
9. `Owner()` - 16 edges
10. `navigate()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `StoreProvider()`  [EXTRACTED]
  app/src/App.tsx → app/src/lib/store.tsx
- `App()` --calls--> `Admin()`  [EXTRACTED]
  app/src/App.tsx → app/src/screens/Admin.tsx
- `Owner()` --calls--> `Tap()`  [EXTRACTED]
  app/src/App.tsx → app/src/components/ui.tsx
- `Owner()` --calls--> `savedLang()`  [EXTRACTED]
  app/src/App.tsx → app/src/lib/i18n.tsx
- `Owner()` --calls--> `useT()`  [EXTRACTED]
  app/src/App.tsx → app/src/lib/i18n.tsx

## Import Cycles
- None detected.

## Communities (16 total, 2 thin omitted)

### Community 0 - "parse.ts"
Cohesion: 0.09
Nodes (37): LivePreview(), FILLER, SEPARATORS, tokenize(), Unit, UNIT_WORDS, unitOf(), DEV_DIGITS (+29 more)

### Community 1 - "errorFx"
Cohesion: 0.13
Nodes (28): LoginResult, storeEmail(), storeLogin(), storePassword(), SUPABASE_KEY, SUPABASE_URL, buzz(), errorFx() (+20 more)

### Community 2 - "shop.ts"
Cohesion: 0.18
Nodes (17): Customer, findCustomer(), loadShop(), num(), Shop, ShopItem, ShopMatchable, CATALOG (+9 more)

### Community 3 - "Voice.tsx"
Cohesion: 0.22
Nodes (16): listen(), ListenError, Rec, speak(), speechSupported(), queryAnswer(), Saved, Stage (+8 more)

### Community 4 - "App.tsx"
Cohesion: 0.20
Nodes (14): App(), ToastHost(), Ctx, Entry, I18n, I18nProvider(), Key, Lang (+6 more)

### Community 5 - "ReviewScreen"
Cohesion: 0.27
Nodes (13): NumberSheet(), push(), toast(), invalidateShop(), remove(), cap(), fmtQty(), LineRow() (+5 more)

### Community 6 - "ui.tsx"
Cohesion: 0.32
Nodes (7): Icon(), P, RowButton(), TabId, TABS, ToastMsg, Home()

### Community 7 - "Tap"
Cohesion: 0.44
Nodes (10): BackBar(), Sheet(), Tap(), useT(), goBack(), Building(), AnswerView(), CustomerPicker() (+2 more)

### Community 8 - "Settings.tsx"
Cohesion: 0.35
Nodes (9): Owner(), BottomBar(), setSound(), soundEnabled(), depth(), navigate(), useStore(), Settings() (+1 more)

### Community 9 - "draft.ts"
Cohesion: 0.33
Nodes (9): priceOf(), buildDraft(), draftTotal(), lineFrom(), lineTotal(), qtyFor(), searchItems(), toMatchables() (+1 more)

### Community 10 - "prefs.ts"
Cohesion: 0.36
Nodes (4): get(), speakOn(), speakRate(), speakSlow()

### Community 11 - "Bills.tsx"
Cohesion: 0.48
Nodes (6): rupees(), BillDetail(), BillRow, Bills(), time(), units

### Community 12 - "ai.ts"
Cohesion: 0.33
Nodes (6): supabase, AiOut, askAi(), isSure(), MatchIndex, Parsed

### Community 13 - "store.tsx"
Cohesion: 0.40
Nodes (5): Ctx, logUsage(), State, Store, StoreProvider()

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Tap()` connect `Tap` to `errorFx`, `Voice.tsx`, `App.tsx`, `ReviewScreen`, `ui.tsx`, `Settings.tsx`, `Bills.tsx`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Should `parse.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09407665505226481 - nodes in this community are weakly interconnected._
- **Why does `Voice()` connect `Voice.tsx` to `parse.ts`, `errorFx`, `shop.ts`, `App.tsx`, `ReviewScreen`, `Tap`, `Settings.tsx`, `draft.ts`, `prefs.ts`, `ai.ts`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Should `errorFx` be split into smaller, more focused modules?**
  _Cohesion score 0.1253968253968254 - nodes in this community are weakly interconnected._
- **Why does `errorFx()` connect `errorFx` to `Voice.tsx`, `Bills.tsx`, `ReviewScreen`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._