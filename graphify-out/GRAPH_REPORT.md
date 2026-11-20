# Graph Report - Mesa-OmniOS  (2026-11-20)

## Corpus Check
- 31 files · ~8,470 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 3, .webmanifest 1, .css 1)

## Summary
- 218 nodes · 364 edges · 14 communities (10 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `932c0dbb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- package.json
- OmniOS — Project Brief (read at the start of every session)
- compilerOptions
- compilerOptions
- Product
- speech.ts
- OmniOS Dukaan — Design rules
- .oxlintrc.json
- index.ts
- React + TypeScript + Vite
- 0001_core.sql
- tsconfig.json
- vercel.json

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 18 edges
2. `Screen()` - 16 edges
3. `stores` - 15 edges
4. `OmniOS — Project Brief (read at the start of every session)` - 15 edges
5. `compilerOptions` - 15 edges
6. `useLang()` - 14 edges
7. `Login()` - 12 edges
8. `Product` - 10 edges
9. `tap()` - 10 edges
10. `lucide-react` - 9 edges

## Surprising Connections (you probably didn't know these)
- `LangButton()` --calls--> `tap()`  [EXTRACTED]
  app/src/components/Screen.tsx → app/src/lib/feedback.ts
- `LangButton()` --calls--> `useLang()`  [EXTRACTED]
  app/src/components/Screen.tsx → app/src/lib/i18n.tsx
- `Login()` --calls--> `LangButton()`  [EXTRACTED]
  app/src/pages/Login.tsx → app/src/components/Screen.tsx
- `Login()` --calls--> `Mark()`  [EXTRACTED]
  app/src/pages/Login.tsx → app/src/components/Screen.tsx
- `Screen()` --calls--> `fail()`  [EXTRACTED]
  app/src/components/Screen.tsx → app/src/lib/feedback.ts

## Import Cycles
- None detected.

## Communities (14 total, 4 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.12
Nodes (38): App(), StoreApp(), LangButton(), Mark(), Screen(), fail(), success(), tap() (+30 more)

### Community 1 - "package.json"
Cohesion: 0.08
Nodes (32): dependencies, lucide-react@^1.77.0, react@^19.3.1, react-dom@^19.3.1, react-router-dom@^7.18.6, @supabase/supabase-js@^2.119.2, devDependencies, oxlint@^1.90.0 (+24 more)

### Community 2 - "OmniOS — Project Brief (read at the start of every session)"
Cohesion: 0.09
Nodes (22): Acceptance (tap tests), Admin dashboard (owner only), complete and organised, Billing, Capture (core edge: near-zero effort), Ease of use (top priority, above features), Inventory and insight, Later (design data now, build only when told), Look and feel (+14 more)

### Community 3 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 4 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 5 - "Product"
Cohesion: 0.18
Nodes (10): Accessibility & Inclusion, Brand Commitments, Capabilities and Constraints, Operating Context, Platform, Product, Product Principles, Product Purpose (+2 more)

### Community 7 - "OmniOS Dukaan — Design rules"
Cohesion: 0.13
Nodes (11): Decisions (owner answers to PROJECT.md open decisions), Colour (Restrained: navy shell + neutrals + meaning colours), Components, Motion, OmniOS Dukaan — Design system ("Bank passbook"), Shell (identical on every screen), Signature: the passbook ledger, Type (+3 more)

### Community 8 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 10 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

### Community 11 - "0001_core.sql"
Cohesion: 0.22
Nodes (17): admins, bill_lines, bills, catalog_items, customers, is_admin(), item_aliases, items (+9 more)

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `App.tsx` to `package.json`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11530398322851153 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `App.tsx` to `package.json`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.0766488413547237 - nodes in this community are weakly interconnected._
- **Why does `OmniOS — Project Brief (read at the start of every session)` connect `OmniOS — Project Brief (read at the start of every session)` to `OmniOS Dukaan — Design rules`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Should `OmniOS — Project Brief (read at the start of every session)` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._