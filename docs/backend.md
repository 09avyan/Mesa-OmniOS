# Backend notes (Supabase)

## How to apply (lead does this; nothing here is applied yet)
1. Apply migrations in the order in `supabase/migrations/_apply_order.txt`: 0014 bags, 0015 bills, 0016 login, 0017 assistant, 0018 admin. All additive and safe to re-run.
2. Deploy functions: `login` (after 0016), `admin` (after 0014 + 0016 + 0018).
3. Check afterwards: prices in `bag_products`, then place a test bag order from the TEST shop.

## New tables (all RLS on, no direct writes from the app)
| Table | Purpose | Who can read |
|---|---|---|
| bag_products | 3 branded bag packs: kind, name, pack_qty, price, cost | nobody directly (cost is secret); shops use `list_bag_products()`, admin uses service role |
| bag_orders | one order per shop, status new/confirmed/packed/dispatched/delivered/cancelled, address snapshot | own shop; admins |
| bag_order_lines | snapshot of name, qty (packs), price, cost | own shop (cost column hidden); admin via service role |
| login_fails | one row per wrong PIN (code + device hash) | service role only |
| login_alerts | "someone tried your PIN" | via `recent_login_alerts()` |
Changed: `bills.client_key` (unique per shop when set), `bill_lines.match_id`. `bag_requests` is untouched.

Seed prices are ASSUMPTIONS to verify with suppliers: compostable bag M pack of 100 sells 199 (cost 120); paper bag M printed pack of 50 sells 249 (cost 160); cotton printed bag pack of 10 sells 199 (cost 110). Change them in Admin (`bag_products_update`).

## Shop RPCs (authenticated)
- Bags: `list_bag_products()`, `place_bag_order({note,address,lines:[{product_id,qty}]})` returns id, `my_bag_orders()`, `cancel_bag_order(id)` (only while status is new).
- Bills: `save_bill(p)` now accepts `p.client_key` (any unique string per bill attempt); a repeat returns the same JSON as the first save. `undo_bill(id)` raises `too_old` after 30 minutes and takes back flavour counts (not below 0).
- Login: `recent_login_alerts()` returns the last 20 alerts (kind device_locked / shop_locked, device label, time).
- Assistant (read only, own shop, jsonb, India dates inclusive): ask_sales, ask_top_items, ask_slow_items, ask_low_stock, ask_item_stock, ask_customer_balance, ask_top_debtors, ask_customer_history, ask_supplier_due, ask_last_price, ask_cash_expected, ask_bill_count, ask_busiest_hour, ask_udhaar_collected, ask_profit_estimate (returns null: no item cost stored yet), ask_bill_search, ask_online_orders. Name lookups are fuzzy (contains or trigram similarity).
  - Low stock = stock 0 or less, or 3 days or fewer left at the last 14 days sales rate.
  - Cash expected = cash bills + all udhaar payments received that day (payment mode is not stored).

## Login lockout
Device id = short hash of IP + device label (raw IP never stored). 5 wrong PINs from one device lock that device for 10 minutes; 20 wrong PINs across all devices in 10 minutes lock the shop for 10 minutes. Each lock writes a `login_alerts` row. Success clears that device's count. Responses now also carry `scope: "device"|"shop"` when locked (extra field, old app ignores it). `reset_pin` also clears the device counts. 6-digit PIN and the 4 to 6 digit move are unchanged. Caveat: a shop whose phones share one IP and same label share a device count.

## Admin edge function (send `{action, ...}` with the admin's bearer token)
Existing and unchanged: bootstrap, list_stores, create_store, reset_pin, set_status, delete_store.
New:
- `overview` KPIs: shops total/active/paused, new shops 30d, bills and sales today/7d/30d, udhaar outstanding, AI calls 7d, `daily_sales_30d`, `top_shops_30d` (10).
- `shops_list`, `shop_detail {store_id}`, `usage_events` (counts by kind 7d/30d + daily).
- `bag_products_list`, `bag_products_update {id, price?, cost?, active?}`, `bag_orders_list {status?}`, `bag_order_set_status {id,status}`, `bag_margin_report` (revenue, cost, margin per kind per month, cancelled excluded).
- `requests`: bag_requests, item_requests, feature_interest counts.
- `export_csv {kind: shops|bills|bag_orders, from?, to?}` returns `{csv}` (dates YYYY-MM-DD India time; formula-looking cells are prefixed with an apostrophe).
Reports run in SQL functions `admin_*` (migration 0018) executable only by the service role.

## Assumptions and risks
- AI calls are counted from usage_events kinds ai, understand, ask, gemini, voice_ai. If the app logs a different kind, edit the list in 0018 (`admin_overview`).
- Live tables not in the repo (orders, suppliers, supplier_balances, item_requests, feature_interest, bag_requests) were assumed to have `store_id` (suppliers, orders, item_requests) and `created_at`; check on first run. 0017 and 0018 are SQL language functions parsed at create time, so a wrong column name fails the apply loudly, not silently.
- Not run against a database; syntax was checked by reading only. Apply to a branch or the TEST data first.
- save_bill/public_bill/undo_bill are full re-creations of the 0012/0002 definitions; diff them against live (`pg_get_functiondef`) before applying in case something changed after 0012.
- Old flavour counts for bills saved before 0015 are decremented by item catalog id or family (best effort).
