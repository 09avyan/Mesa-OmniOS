-- 0013: cover every foreign key with an index (Supabase performance advisor, 15 findings). Additive, safe to re-run.
create index if not exists bill_lines_bill_id_idx on public.bill_lines (bill_id);
create index if not exists bill_lines_item_id_idx on public.bill_lines (item_id);
create index if not exists bills_customer_id_idx on public.bills (customer_id);
create index if not exists bills_order_id_idx on public.bills (order_id);
create index if not exists item_aliases_item_id_idx on public.item_aliases (item_id);
create index if not exists item_requests_item_id_idx on public.item_requests (item_id);
create index if not exists item_requests_store_id_idx on public.item_requests (store_id);
create index if not exists order_lines_item_id_idx on public.order_lines (item_id);
create index if not exists order_lines_order_id_idx on public.order_lines (order_id);
create index if not exists order_lines_store_id_idx on public.order_lines (store_id);
create index if not exists orders_bill_id_idx on public.orders (bill_id);
create index if not exists stock_moves_item_id_idx on public.stock_moves (item_id);
create index if not exists supplier_entries_supplier_id_idx on public.supplier_entries (supplier_id);
create index if not exists udhaar_entries_bill_id_idx on public.udhaar_entries (bill_id);
create index if not exists udhaar_entries_customer_id_idx on public.udhaar_entries (customer_id);
