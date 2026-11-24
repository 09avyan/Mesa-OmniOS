# Tech, compressed (code map: ../graphify-out/GRAPH_REPORT.md)
- app/: React 19 + Vite + TS. Screens app/src/screens (Home, Briefing, Voice, Bills, BillPage, Maal, Forecast, Receipt, Udhaar, Hisaab, Extras, Orders, Store, Settings, Admin, Login, Language, Building). lib/: auth.ts (storeLogin), store.tsx (device_ping), i18n.tsx. voice/: parser (51 tests, `npm test`). styles/app.css.
- Prototypes: no longer on the live site (owner removed /proto 24 Nov). Redo #5 versions = standalone HTML in design/redo5/; old ones in design/redo4/.
- Supabase msqmuvqhbxyrhogbhtta. RLS via my_store_id(), is_admin(); writes via security-definer fns. Migrations 0001–0011 (0007+ applied via MCP, files are records).
- Tables: stores, store_users, admins, items, bills, customers, udhaar, usage_events, login_attempts, store_devices, bag_requests, feature_interest, suppliers, supplier_entries (+ supplier_balances view), orders/requests.
- Fns: day_summary, briefing, stock_check, forecast, save_receipt, pay_supplier, request_bags, want_feature, device_ping, device_revoke, public_bill, order_status, public_balance.
- Edge fns: login, admin (create/reset_pin/set_status/delete_store/list), understand (Gemini; ListModels discovery; voice 12s, receipt 40s, total 120s; 120 calls/shop/hr). Gemini free tier was 503 "busy" on 23 Nov; manual entry fallback works.
- Data: supabase/seed/catalog.json (232+ items), seed/receipts (3 samples). TEST store has top-150 items + mock data.
- Container: vercel.app blocked by proxy → Vercel MCP (web_fetch_vercel_url, list_deployments). Playwright Chromium preinstalled; screenshot helpers were in /tmp/claude-0/s/ (may be gone).
- Gotchas: `pkill -f "vite preview"` kills own shell → use setsid. Hindi: no letter-spacing, line-height ≥1.4, watch reph clipping (शर्मा) with overflow hidden.
