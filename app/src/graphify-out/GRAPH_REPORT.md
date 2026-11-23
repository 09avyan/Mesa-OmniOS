# Graph Report - src  (2026-11-23)

## Corpus Check
- 39 files · ~28,174 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: .css 1)

## Summary
- 301 nodes · 1146 edges · 15 communities (13 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e89e2388`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- parse.ts
- Store.tsx
- Voice.tsx
- errorFx
- Tap
- navigate
- Orders.tsx
- store.tsx
- App.tsx
- useT
- Settings.tsx
- Udhaar.tsx
- i18n.tsx

## God Nodes (most connected - your core abstractions)
1. `Tap()` - 54 edges
2. `useT()` - 46 edges
3. `errorFx()` - 42 edges
4. `successFx()` - 39 edges
5. `Voice()` - 36 edges
6. `navigate()` - 32 edges
7. `Icon()` - 30 edges
8. `rupees()` - 30 edges
9. `toast()` - 26 edges
10. `ReviewScreen()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `AskHost()`  [EXTRACTED]
  app/src/App.tsx → app/src/components/ui.tsx
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

## Communities (15 total, 2 thin omitted)

### Community 0 - "parse.ts"
Cohesion: 0.06
Nodes (64): Customer, findCustomer(), loadShop(), num(), priceOf(), Shop, ShopMatchable, AiOut (+56 more)

### Community 1 - "Store.tsx"
Cohesion: 0.07
Nodes (35): BILL_T, BillData, BillLine, CAT, L3, units, SUPABASE_KEY, SUPABASE_URL (+27 more)

### Community 2 - "Voice.tsx"
Cohesion: 0.12
Nodes (32): Key, get(), speakOn(), speakRate(), speakSlow(), custLabel(), listen(), ListenError (+24 more)

### Community 3 - "errorFx"
Cohesion: 0.16
Nodes (34): toast(), buzz(), errorFx(), successFx(), tapFx(), tone(), invalidateShop(), ShopItem (+26 more)

### Community 4 - "Tap"
Cohesion: 0.22
Nodes (13): NumberSheet(), Ask, AskHost(), askText(), push(), pushAsk(), Sheet(), TabId (+5 more)

### Community 5 - "navigate"
Cohesion: 0.33
Nodes (12): BillCard(), Icon(), P, RowButton(), rupees(), navigate(), BillDetail(), BillRow (+4 more)

### Community 6 - "Orders.tsx"
Cohesion: 0.22
Nodes (10): itemName(), chime(), OLine, Order, OrderDetail(), Orders(), Req, time() (+2 more)

### Community 7 - "store.tsx"
Cohesion: 0.24
Nodes (10): deviceLabel(), LoginResult, storeLogin(), Ctx, logUsage(), State, Store, StoreProvider() (+2 more)

### Community 8 - "App.tsx"
Cohesion: 0.40
Nodes (9): App(), Owner(), BottomBar(), ToastHost(), I18nProvider(), savedLang(), usePath(), BillPage() (+1 more)

### Community 9 - "useT"
Cohesion: 0.47
Nodes (8): BackBar(), useT(), depth(), goBack(), Building(), MyStore(), AnswerView(), GallaView()

### Community 10 - "Settings.tsx"
Cohesion: 0.39
Nodes (7): setSound(), soundEnabled(), useStore(), Device, Phones(), sessionIdOf(), Settings()

### Community 11 - "Udhaar.tsx"
Cohesion: 0.28
Nodes (8): supabase, ago(), BalancePage(), Cust, Entry, pub, Pub, UdhaarList()

### Community 12 - "i18n.tsx"
Cohesion: 0.32
Nodes (6): Ctx, Entry, I18n, Lang, LANGS, S

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `errorFx()` connect `errorFx` to `Store.tsx`, `Voice.tsx`, `navigate`, `Orders.tsx`, `store.tsx`, `useT`, `Udhaar.tsx`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Should `parse.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06126126126126126 - nodes in this community are weakly interconnected._
- **Why does `Tap()` connect `Tap` to `Store.tsx`, `Voice.tsx`, `errorFx`, `navigate`, `Orders.tsx`, `store.tsx`, `App.tsx`, `useT`, `Settings.tsx`, `Udhaar.tsx`, `i18n.tsx`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Should `Store.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07317073170731707 - nodes in this community are weakly interconnected._
- **Why does `successFx()` connect `errorFx` to `Store.tsx`, `Voice.tsx`, `navigate`, `Orders.tsx`, `store.tsx`, `useT`, `Udhaar.tsx`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Should `Voice.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11806543385490754 - nodes in this community are weakly interconnected._