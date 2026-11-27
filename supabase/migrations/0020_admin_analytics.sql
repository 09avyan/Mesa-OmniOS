-- 0020: one read-only report for the admin Analytics tab (service role only, called by the admin edge function).
create or replace function public.admin_analytics() returns jsonb language sql stable security definer set search_path = '' as $$
with d as (select generate_series((now() at time zone 'Asia/Kolkata')::date - 29, (now() at time zone 'Asia/Kolkata')::date, interval '1 day')::date day),
b as (select b.store_id, b.total, b.pay, (b.created_at at time zone 'Asia/Kolkata') ist from public.bills b where b.status = 'saved' and b.created_at > now() - interval '31 days'),
u as (select e.store_id, e.kind, (e.created_at at time zone 'Asia/Kolkata') ist from public.usage_events e where e.created_at > now() - interval '31 days')
select jsonb_build_object(
 'daily', (select jsonb_agg(jsonb_build_object('day', d.day,
     'active_shops', (select count(distinct x.store_id) from (select store_id from b where ist::date = d.day union select store_id from u where ist::date = d.day) x),
     'bills', (select count(*) from b where ist::date = d.day), 'sales', (select coalesce(sum(total),0) from b where ist::date = d.day)) order by d.day) from d),
 'wau', (select count(distinct store_id) from u where ist > (now() at time zone 'Asia/Kolkata') - interval '7 days'),
 'mau', (select count(distinct store_id) from u where ist > (now() at time zone 'Asia/Kolkata') - interval '30 days'),
 'shops', (select count(*) from public.stores),
 'funnel', jsonb_build_object(
   'shops', (select count(*) from public.stores),
   'with_bill', (select count(distinct store_id) from public.bills where status = 'saved'),
   'with_10_bills', (select count(*) from (select store_id from public.bills where status = 'saved' group by 1 having count(*) >= 10) q),
   'with_udhaar', (select count(distinct store_id) from public.udhaar_entries),
   'with_stock', (select count(distinct store_id) from public.items where stock_known),
   'with_receipt', (select count(distinct store_id) from public.usage_events where kind = 'receipt')),
 'pay_mix', (select coalesce(jsonb_object_agg(pay, jsonb_build_object('bills', n, 'sales', s)), '{}'::jsonb) from (select pay, count(*) n, sum(total) s from b group by pay) q),
 'hours', (select coalesce(jsonb_agg(jsonb_build_object('hour', h, 'bills', n) order by h), '[]'::jsonb) from (select extract(hour from ist)::int h, count(*) n from b group by 1) q),
 'features', (select coalesce(jsonb_agg(jsonb_build_object('kind', kind, 'n', n, 'shops', sh) order by n desc), '[]'::jsonb) from (select kind, count(*) n, count(distinct store_id) sh from u group by kind) q),
 'top_items', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select l.name, sum(l.qty - l.returned_qty) qty, sum(l.amount) amount, count(distinct l.store_id) shops
     from public.bill_lines l join public.bills bb on bb.id = l.bill_id where bb.status = 'saved' and bb.created_at > now() - interval '30 days' group by l.name order by sum(l.amount) desc limit 15) x),
 'avg_bill', (select coalesce(round(avg(total),2),0) from b)
)
$$;
revoke all on function public.admin_analytics() from public, anon, authenticated;
