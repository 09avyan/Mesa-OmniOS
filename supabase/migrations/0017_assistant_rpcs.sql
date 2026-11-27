-- 0017: read-only "ask" lookups for the Poochho assistant. Own shop only (via _store()), jsonb out, India dates. ADDITIVE.
-- Dates are inclusive Asia/Kolkata calendar days. "saved" bills only (undone bills are ignored).
-- ASSUMPTIONS: item cost is not stored anywhere -> ask_profit_estimate returns null. orders/suppliers column names beyond id/store_id/status/name are not relied on.

create index if not exists items_name_trgm on public.items using gin (lower(name) extensions.gin_trgm_ops);
create index if not exists customers_name_trgm on public.customers using gin (lower(name) extensions.gin_trgm_ops);
create index if not exists bills_store_status_at_idx on public.bills (store_id, status, created_at desc);
create index if not exists udhaar_store_kind_at_idx on public.udhaar_entries (store_id, kind, created_at desc);
create index if not exists item_aliases_store_idx on public.item_aliases (store_id);

create or replace function public._ist_from(d date) returns timestamptz language sql immutable set search_path = '' as $$ select (coalesce(d, (now() at time zone 'Asia/Kolkata')::date)::timestamp at time zone 'Asia/Kolkata') $$;
create or replace function public._ist_to(d date) returns timestamptz language sql immutable set search_path = '' as $$ select ((coalesce(d, (now() at time zone 'Asia/Kolkata')::date) + 1)::timestamp at time zone 'Asia/Kolkata') $$;

create or replace function public.ask_sales(p_from date, p_to date) returns jsonb language sql stable security definer set search_path = '' as $$
  with s as (select public._store() id), r as (select public._ist_from(p_from) a, public._ist_to(coalesce(p_to, p_from)) z),
  b as (select b.* from public.bills b, s, r where b.store_id = s.id and b.status = 'saved' and b.created_at >= r.a and b.created_at < r.z)
  select jsonb_build_object('from', coalesce(p_from, (now() at time zone 'Asia/Kolkata')::date), 'to', coalesce(p_to, p_from, (now() at time zone 'Asia/Kolkata')::date),
    'sales', coalesce(sum(total),0), 'bills', count(*), 'avg_bill', coalesce(round(avg(total),2),0),
    'cash', coalesce(sum(total) filter (where pay='cash'),0), 'upi', coalesce(sum(total) filter (where pay='upi'),0), 'udhaar', coalesce(sum(total) filter (where pay='udhaar'),0)) from b
$$;

create or replace function public.ask_top_items(p_from date, p_to date, p_limit int default 5) returns jsonb language sql stable security definer set search_path = '' as $$
  with s as (select public._store() id), r as (select public._ist_from(p_from) a, public._ist_to(coalesce(p_to, p_from)) z)
  select coalesce(jsonb_agg(x order by x.amount desc), '[]'::jsonb) from (
    select l.name, l.unit, sum(l.qty - l.returned_qty) qty, sum(l.amount) amount
    from public.bill_lines l join public.bills b on b.id = l.bill_id, s, r
    where l.store_id = s.id and b.status = 'saved' and b.created_at >= r.a and b.created_at < r.z
    group by l.item_id, l.name, l.unit order by sum(l.amount) desc limit least(greatest(coalesce(p_limit,5),1),50)) x
$$;

create or replace function public.ask_slow_items(p_days int default 30, p_limit int default 10) returns jsonb language sql stable security definer set search_path = '' as $$
  with s as (select public._store() id)
  select coalesce(jsonb_agg(x order by x.last_sold asc nulls first), '[]'::jsonb) from (
    select i.name, i.unit, i.stock, (select max(b.created_at) from public.bill_lines l join public.bills b on b.id = l.bill_id where l.item_id = i.id and b.status = 'saved') last_sold
    from public.items i, s where i.store_id = s.id and i.stock_known and i.stock > 0
      and not exists (select 1 from public.bill_lines l join public.bills b on b.id = l.bill_id
        where l.item_id = i.id and b.status = 'saved' and b.created_at > now() - make_interval(days => least(greatest(coalesce(p_days,30),1),365)))
    order by 4 asc nulls first limit least(greatest(coalesce(p_limit,10),1),50)) x
$$;

create or replace function public.ask_low_stock(p_limit int default 10) returns jsonb language sql stable security definer set search_path = '' as $$
  with s as (select public._store() id), sold as (
    select l.item_id, sum(l.qty - l.returned_qty) q from public.bill_lines l join public.bills b on b.id = l.bill_id, s
    where l.store_id = s.id and b.status = 'saved' and b.created_at > now() - interval '14 days' and l.item_id is not null group by l.item_id)
  select coalesce(jsonb_agg(x order by x.days_left asc nulls first), '[]'::jsonb) from (
    select i.name, i.unit, i.stock, case when sold.q > 0 then round(i.stock / (sold.q / 14.0), 1) end days_left
    from public.items i join s on s.id = i.store_id left join sold on sold.item_id = i.id
    where i.stock_known and (i.stock <= 0 or (sold.q > 0 and i.stock / (sold.q / 14.0) <= 3))
    order by 4 asc nulls first limit least(greatest(coalesce(p_limit,10),1),50)) x
$$;

create or replace function public.ask_item_stock(p_query text) returns jsonb language sql stable security definer set search_path = '' as $$
  with s as (select public._store() id), q as (select lower(trim(coalesce(p_query,''))) t)
  select coalesce(jsonb_agg(x), '[]'::jsonb) from (
    select i.name, i.unit, i.stock, i.stock_known, coalesce(i.price, i.learned_price) price,
      (select jsonb_agg(distinct l.variant) from (select variant from public.bill_lines where store_id = i.store_id and item_id = i.id and variant is not null order by id desc limit 30) l) variants
    from public.items i, s, q
    where i.store_id = s.id and length(q.t) >= 2 and (
      lower(i.name) like '%'||q.t||'%' or lower(coalesce(i.name_hi,'')) like '%'||q.t||'%' or extensions.similarity(lower(i.name), q.t) > 0.35
      or exists (select 1 from public.item_aliases a where a.item_id = i.id and a.alias like '%'||q.t||'%')
      or exists (select 1 from public.bill_lines l where l.store_id = i.store_id and l.item_id = i.id and lower(coalesce(l.variant,'')) like '%'||q.t||'%'))
    order by extensions.similarity(lower(i.name), q.t) desc, i.name limit 8) x
$$;

create or replace function public.ask_customer_balance(p_name text) returns jsonb language sql stable security definer set search_path = '' as $$
  with s as (select public._store() id), q as (select lower(trim(coalesce(p_name,''))) t)
  select coalesce(jsonb_agg(x), '[]'::jsonb) from (
    select cb.name, cb.phone, cb.balance, cb.last_at from public.customer_balances cb, s, q
    where cb.store_id = s.id and length(q.t) >= 2 and (lower(cb.name) like '%'||q.t||'%' or extensions.similarity(lower(cb.name), q.t) > 0.35)
    order by extensions.similarity(lower(cb.name), q.t) desc limit 5) x
$$;

create or replace function public.ask_top_debtors(p_limit int default 5) returns jsonb language sql stable security definer set search_path = '' as $$
  with s as (select public._store() id)
  select jsonb_build_object('total', coalesce((select sum(balance) from public.customer_balances cb, s where cb.store_id = s.id and balance > 0),0),
    'list', coalesce((select jsonb_agg(x order by x.balance desc) from (select cb.name, cb.phone, cb.balance, cb.last_at from public.customer_balances cb, s
      where cb.store_id = s.id and cb.balance > 0 order by cb.balance desc limit least(greatest(coalesce(p_limit,5),1),50)) x), '[]'::jsonb))
$$;

create or replace function public.ask_customer_history(p_name text, p_limit int default 10) returns jsonb language sql stable security definer set search_path = '' as $$
  with s as (select public._store() id), q as (select lower(trim(coalesce(p_name,''))) t),
  c as (select cu.id, cu.name from public.customers cu, s, q where cu.store_id = s.id and length(q.t) >= 2
        and (lower(cu.name) like '%'||q.t||'%' or extensions.similarity(lower(cu.name), q.t) > 0.35) order by extensions.similarity(lower(cu.name), q.t) desc limit 1)
  select jsonb_build_object('customer', (select name from c), 'balance', (select balance from public.customer_balances where id = (select id from c)),
    'entries', coalesce((select jsonb_agg(x order by x.at desc) from (
      select u.created_at at, u.kind, u.amount, u.bill_id from public.udhaar_entries u, s where u.store_id = s.id and u.customer_id = (select id from c)
      order by u.created_at desc limit least(greatest(coalesce(p_limit,10),1),50)) x), '[]'::jsonb))
$$;

create or replace function public.ask_supplier_due(p_name text) returns jsonb language sql stable security definer set search_path = '' as $$
  with s as (select public._store() id), q as (select lower(trim(coalesce(p_name,''))) t)
  select coalesce(jsonb_agg(x), '[]'::jsonb) from (
    select sb.name, sb.due from public.supplier_balances sb join public.suppliers su on su.id = sb.id, s, q
    where su.store_id = s.id and (length(q.t) < 2 or lower(sb.name) like '%'||q.t||'%' or extensions.similarity(lower(sb.name), q.t) > 0.35)
    order by sb.due desc limit 8) x
$$;

create or replace function public.ask_last_price(p_query text) returns jsonb language sql stable security definer set search_path = '' as $$
  with s as (select public._store() id), q as (select lower(trim(coalesce(p_query,''))) t)
  select coalesce(jsonb_agg(x), '[]'::jsonb) from (
    select l.name, l.variant, l.unit, l.price, b.created_at at, c.name customer
    from public.bill_lines l join public.bills b on b.id = l.bill_id left join public.customers c on c.id = b.customer_id, s, q
    where l.store_id = s.id and b.status = 'saved' and length(q.t) >= 2
      and (lower(l.name) like '%'||q.t||'%' or lower(coalesce(l.variant,'')) like '%'||q.t||'%' or lower(l.name||' '||coalesce(l.variant,'')) like '%'||q.t||'%')
    order by b.created_at desc limit 3) x
$$;

-- Expected cash in the drawer for a day = cash bills + udhaar payments received that day (payment mode is not stored, so all payments are counted).
create or replace function public.ask_cash_expected(p_date date default null) returns jsonb language sql stable security definer set search_path = '' as $$
  with s as (select public._store() id), r as (select public._ist_from(p_date) a, public._ist_to(p_date) z)
  select jsonb_build_object('date', coalesce(p_date, (now() at time zone 'Asia/Kolkata')::date),
    'cash_sales', coalesce((select sum(b.total) from public.bills b, s, r where b.store_id = s.id and b.status = 'saved' and b.pay = 'cash' and b.created_at >= r.a and b.created_at < r.z),0),
    'udhaar_collected', coalesce((select -sum(u.amount) from public.udhaar_entries u, s, r where u.store_id = s.id and u.kind = 'payment' and u.created_at >= r.a and u.created_at < r.z),0))
  || jsonb_build_object('expected', coalesce((select sum(b.total) from public.bills b, s, r where b.store_id = s.id and b.status = 'saved' and b.pay = 'cash' and b.created_at >= r.a and b.created_at < r.z),0)
    + coalesce((select -sum(u.amount) from public.udhaar_entries u, s, r where u.store_id = s.id and u.kind = 'payment' and u.created_at >= r.a and u.created_at < r.z),0))
$$;

create or replace function public.ask_bill_count(p_from date, p_to date) returns jsonb language sql stable security definer set search_path = '' as $$
  with s as (select public._store() id), r as (select public._ist_from(p_from) a, public._ist_to(coalesce(p_to, p_from)) z)
  select jsonb_build_object('bills', count(*) filter (where b.status = 'saved'), 'undone', count(*) filter (where b.status = 'undone'))
  from public.bills b, s, r where b.store_id = s.id and b.created_at >= r.a and b.created_at < r.z
$$;

create or replace function public.ask_busiest_hour(p_from date, p_to date) returns jsonb language sql stable security definer set search_path = '' as $$
  with s as (select public._store() id), r as (select public._ist_from(p_from) a, public._ist_to(coalesce(p_to, p_from)) z)
  select jsonb_build_object('hours', coalesce(jsonb_agg(x order by x.bills desc), '[]'::jsonb)) from (
    select extract(hour from b.created_at at time zone 'Asia/Kolkata')::int hour, count(*) bills, sum(b.total) sales
    from public.bills b, s, r where b.store_id = s.id and b.status = 'saved' and b.created_at >= r.a and b.created_at < r.z
    group by 1 order by 2 desc limit 3) x
$$;

create or replace function public.ask_udhaar_collected(p_from date, p_to date) returns jsonb language sql stable security definer set search_path = '' as $$
  with s as (select public._store() id), r as (select public._ist_from(p_from) a, public._ist_to(coalesce(p_to, p_from)) z)
  select jsonb_build_object('collected', coalesce(-sum(u.amount),0), 'payments', count(*))
  from public.udhaar_entries u, s, r where u.store_id = s.id and u.kind = 'payment' and u.created_at >= r.a and u.created_at < r.z
$$;

-- No cost price is stored for shop items yet -> null. Replace this body when cost data exists.
create or replace function public.ask_profit_estimate(p_from date, p_to date) returns jsonb language sql stable security definer set search_path = '' as $$
  select null::jsonb where public._store() is not null
$$;

create or replace function public.ask_bill_search(p_text text, p_limit int default 10) returns jsonb language sql stable security definer set search_path = '' as $$
  with s as (select public._store() id), q as (select lower(trim(coalesce(p_text,''))) t)
  select coalesce(jsonb_agg(x order by x.at desc), '[]'::jsonb) from (
    select b.id, b.created_at at, b.total, b.pay, b.status, c.name customer
    from public.bills b left join public.customers c on c.id = b.customer_id, s, q
    where b.store_id = s.id and length(q.t) >= 1 and (
      lower(coalesce(c.name,'')) like '%'||q.t||'%' or b.total::text = q.t or b.total::numeric(12,0)::text = q.t
      or exists (select 1 from public.bill_lines l where l.bill_id = b.id and lower(l.name||' '||coalesce(l.variant,'')) like '%'||q.t||'%'))
    order by b.created_at desc limit least(greatest(coalesce(p_limit,10),1),50)) x
$$;

create or replace function public.ask_online_orders() returns jsonb language sql stable security definer set search_path = '' as $$
  with s as (select public._store() id)
  select jsonb_build_object(
    'by_status', coalesce((select jsonb_object_agg(st, n) from (select o.status st, count(*) n from public.orders o, s where o.store_id = s.id and o.created_at > now() - interval '7 days' group by 1) g), '{}'::jsonb),
    'recent', coalesce((select jsonb_agg(to_jsonb(o) - 'store_id') from (select o.* from public.orders o, s where o.store_id = s.id order by o.created_at desc limit 10) o), '[]'::jsonb))
$$;

do $$ declare f text; begin
  foreach f in array array['ask_sales(date,date)','ask_top_items(date,date,int)','ask_slow_items(int,int)','ask_low_stock(int)','ask_item_stock(text)','ask_customer_balance(text)',
    'ask_top_debtors(int)','ask_customer_history(text,int)','ask_supplier_due(text)','ask_last_price(text)','ask_cash_expected(date)','ask_bill_count(date,date)',
    'ask_busiest_hour(date,date)','ask_udhaar_collected(date,date)','ask_profit_estimate(date,date)','ask_bill_search(text,int)','ask_online_orders()'] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
  revoke execute on function public._ist_from(date), public._ist_to(date) from public, anon;
  grant execute on function public._ist_from(date), public._ist_to(date) to authenticated;
end $$;
