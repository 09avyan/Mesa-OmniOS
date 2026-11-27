-- 0018: reporting functions for the admin edge function. Callable ONLY by the service role (never by shops or the browser). ADDITIVE.
-- ASSUMPTION: AI calls are usage_events whose kind is one of 'ai','understand','ask','gemini','voice_ai'. Adjust the list here if the app logs another kind.
create index if not exists usage_events_kind_at_idx on public.usage_events (kind, at desc);
create index if not exists bills_created_idx on public.bills (created_at desc);

create or replace function public.admin_overview() returns jsonb language sql stable security definer set search_path = '' as $$
  with d as (select (now() at time zone 'Asia/Kolkata')::date today),
  b as (select b.store_id, b.total, (b.created_at at time zone 'Asia/Kolkata')::date day from public.bills b where b.status = 'saved' and b.created_at > now() - interval '31 days')
  select jsonb_build_object(
    'shops_total', (select count(*) from public.stores), 'shops_active', (select count(*) from public.stores where status = 'active'), 'shops_paused', (select count(*) from public.stores where status = 'paused'),
    'new_shops_30d', (select count(*) from public.stores where created_at > now() - interval '30 days'),
    'bills_today', (select count(*) from b, d where b.day = d.today), 'bills_7d', (select count(*) from b, d where b.day > d.today - 7), 'bills_30d', (select count(*) from b, d where b.day > d.today - 30),
    'sales_today', (select coalesce(sum(total),0) from b, d where b.day = d.today), 'sales_7d', (select coalesce(sum(total),0) from b, d where b.day > d.today - 7), 'sales_30d', (select coalesce(sum(total),0) from b, d where b.day > d.today - 30),
    'udhaar_outstanding', (select coalesce(sum(bal),0) from (select sum(amount) bal from public.udhaar_entries group by customer_id having sum(amount) > 0) x),
    'ai_calls_7d', (select count(*) from public.usage_events where kind in ('ai','understand','ask','gemini','voice_ai') and at > now() - interval '7 days'),
    'daily_sales_30d', (select coalesce(jsonb_agg(jsonb_build_object('day', g.day, 'sales', coalesce(s.t,0), 'bills', coalesce(s.n,0)) order by g.day), '[]'::jsonb)
      from d, generate_series(d.today - 29, d.today, interval '1 day') g(day)
      left join (select day, sum(total) t, count(*) n from b group by day) s on s.day = g.day::date),
    'top_shops_30d', (select coalesce(jsonb_agg(x order by x.sales desc), '[]'::jsonb) from (
      select st.id, st.code, st.name, sum(b.total) sales, count(*) bills from b join public.stores st on st.id = b.store_id, d where b.day > d.today - 30 group by st.id order by sum(b.total) desc limit 10) x))
$$;

create or replace function public.admin_shops_list() returns jsonb language sql stable security definer set search_path = '' as $$
  with b as (select store_id, count(*) n, sum(total) t, max(created_at) last_bill from public.bills where status = 'saved' and created_at > now() - interval '30 days' group by store_id),
  u as (select store_id, max(at) last_use from public.usage_events group by store_id),
  ud as (select store_id, sum(bal) o from (select store_id, customer_id, sum(amount) bal from public.udhaar_entries group by 1,2 having sum(amount) > 0) z group by store_id),
  dv as (select store_id, count(*) n from public.store_devices where not revoked group by store_id)
  select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'code', s.code, 'name', s.name, 'status', s.status, 'area', s.area, 'created_at', s.created_at,
    'last_active', greatest(u.last_use, b.last_bill), 'bills_30d', coalesce(b.n,0), 'sales_30d', coalesce(b.t,0), 'udhaar_outstanding', coalesce(ud.o,0), 'phones', coalesce(dv.n,0)) order by s.created_at desc), '[]'::jsonb)
  from public.stores s left join b on b.store_id = s.id left join u on u.store_id = s.id left join ud on ud.store_id = s.id left join dv on dv.store_id = s.id
$$;

create or replace function public.admin_shop_detail(p_store uuid) returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'profile', (select to_jsonb(s) from public.stores s where s.id = p_store),
    'phones', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'label', d.label, 'created_at', d.created_at, 'last_seen', d.last_seen, 'revoked', d.revoked) order by d.last_seen desc) from public.store_devices d where d.store_id = p_store), '[]'::jsonb),
    'usage_30d', coalesce((select jsonb_object_agg(kind, n) from (select kind, count(*) n from public.usage_events where store_id = p_store and at > now() - interval '30 days' group by kind) k), '{}'::jsonb),
    'last_bills', coalesce((select jsonb_agg(x order by x.at desc) from (select b.id, b.created_at at, b.total, b.pay, b.status, c.name customer from public.bills b left join public.customers c on c.id = b.customer_id where b.store_id = p_store order by b.created_at desc limit 20) x), '[]'::jsonb),
    'top_items', coalesce((select jsonb_agg(x order by x.amount desc) from (select l.name, sum(l.qty - l.returned_qty) qty, sum(l.amount) amount from public.bill_lines l join public.bills b on b.id = l.bill_id
      where l.store_id = p_store and b.status = 'saved' and b.created_at > now() - interval '30 days' group by l.name order by sum(l.amount) desc limit 10) x), '[]'::jsonb))
$$;

create or replace function public.admin_usage_summary() returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'by_kind_7d', coalesce((select jsonb_object_agg(kind, n) from (select kind, count(*) n from public.usage_events where at > now() - interval '7 days' group by kind) a), '{}'::jsonb),
    'by_kind_30d', coalesce((select jsonb_object_agg(kind, n) from (select kind, count(*) n from public.usage_events where at > now() - interval '30 days' group by kind) a), '{}'::jsonb),
    'daily_30d', coalesce((select jsonb_agg(x order by x.day) from (select (at at time zone 'Asia/Kolkata')::date day, count(*) events, count(distinct store_id) shops from public.usage_events where at > now() - interval '30 days' group by 1) x), '[]'::jsonb))
$$;

create or replace function public.admin_bag_margin() returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(x order by x.month desc, x.kind), '[]'::jsonb) from (
    select to_char(o.created_at at time zone 'Asia/Kolkata', 'YYYY-MM') month, l.kind, sum(l.qty) packs, sum(l.qty * l.price) revenue, sum(l.qty * l.cost) cost, sum(l.qty * (l.price - l.cost)) margin
    from public.bag_order_lines l join public.bag_orders o on o.id = l.order_id where o.status <> 'cancelled' group by 1, 2) x
$$;

revoke all on function public.admin_overview(), public.admin_shops_list(), public.admin_shop_detail(uuid), public.admin_usage_summary(), public.admin_bag_margin() from public, anon, authenticated;
grant execute on function public.admin_overview(), public.admin_shops_list(), public.admin_shop_detail(uuid), public.admin_usage_summary(), public.admin_bag_margin() to service_role;
