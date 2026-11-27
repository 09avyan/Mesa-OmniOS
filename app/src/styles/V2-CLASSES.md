# v2 classes (src/styles/v2.css)
Tokens: --bg --s --s2 --line --line2 --ink --ink2 --ink3 --ac(ink) --on-ac --vf/--vt (teal, voice only) --vsoft --ud/--udsoft (udhaar amber) --ok/--oksoft --wa --r1/r2/r3 (8/14/18) --sk. Dark via [data-theme=dark] (Settings > Rang).
Page: `<main className="screen v2 has-bar|has-flow|has-foot|has-foot2">` (16px gutters, room for bars/footers).
Top bar: `.vtop` (+`.bk` when first item is a back `.ib`) with `<h1>`, icon buttons `.ib` (+`.b` outlined). `<TopBar/>` in ui.tsx does this. Chips: `.vchip` (+ud/ok/v). `.vwho` customer chip.
Surfaces: `.vc` card; `.vstack` 12px grid; rows `.vrow` > `.vav` + `.t`(b + span) + `.a` (+`.ud`); use `<button className="vrow">` when tappable.
Type: `.vbig` 48 · `.vmid` 32 · `.vfig` 24 · `.vh1` 32 · `.vlab` 18 muted. `.ud` amber text. `.ulink` underlined link.
Buttons (`.btn` + one of): `.primary` ink · `.outline` · `.vo` teal (voice) · `.wa` green · `.s` 56px; disabled via `disabled` or `aria-disabled`. Primary 64px.
Footer: `.vfoot` (+`.flat`) fixed bottom; `.why` centered reason text; `.vgrid2` / `.vgrid2.w` two-up. `<FlowBar mic>` still gives [mic][sum][action].
Feedback: `.vbanner` (info strip), `.vnote` (amber note + button), `.vsk` skeleton block, `<LoadError onRetry/>` (`.vload`), empty state `.vempty` (+`.vsay` voice example chip).
Home: `.vask` Poochho card. Pay: `.vpay` > `.vtile` (+`.ud`, aria-pressed). Check: `.vit` (+`.q` question row with `.ask`), `.vqty` stepper. Listening: `.vlisten`, `.vsaid`, `.vwave`. Saved: `.vdone`. QR: `.vqr`. Login: `.vpins`, `.vk` keypad.
Bottom: `<BottomBar active onMic>` = teal Bolo bar + 4 tabs (Home, Bills, Udhaar, Maal). Toast: `toast({text, action})`.
Legacy (still used by unmigrated screens): .btn.quiet .rowb .hrow .hm-* .it .chg .ticket .bc/.eb-* .lg .pad/.key (NumberSheet) and all of df7-pages.css. Delete df7-pages.css when the last screen moves.
Hindi: all strings via t(); Cash/UPI/WhatsApp/Bill stay English.
