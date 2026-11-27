-- S2/S3/S4 core: the shop's items + stock, customers, bills, udhaar. All writes go through functions below,
-- so a bill, its stock changes and its udhaar entry are saved together or not at all.

create table public.items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  catalog_id text,                       -- id in supabase/seed/catalog.json, null for shop-only items
  name text not null,                    -- Hinglish display name
  name_hi text,
  unit text not null default 'pc' check (unit in ('kg','g','l','ml','pc','pack')),
  loose boolean not null default false,
  price numeric(10,2),                   -- owner's own price (wins)
  learned_price numeric(10,2),           -- set after 3 bills at the same price (decision 5)
  stock numeric(12,3) not null default 0,
  stock_known boolean not null default false, -- false until opening stock / maal aaya / count
  hidden_online boolean not null default false,
  created_at timestamptz not null default now(),
  unique (store_id, catalog_id)
);
create index on public.items(store_id);

create table public.item_aliases (       -- names the owner used that we learned ("asks once, remembers")
  store_id uuid not null references public.stores(id) on delete cascade,
  alias text not null,
  item_id uuid not null references public.items(id) on delete cascade,
  primary key (store_id, alias)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  phone text,
  lang text not null default 'hi' check (lang in ('hi','en')),
  created_at timestamptz not null default now()
);
create unique index customers_name on public.customers(store_id, lower(name));

create table public.bills (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  pay text not null check (pay in ('cash','upi','udhaar')),
  subtotal numeric(12,2) not null,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  status text not null default 'saved' check (status in ('saved','undone')),
  has_unrecorded boolean not null default false, -- sold something we had no stock record for
  voice_text text,
  share_token text not null unique default translate(encode(extensions.gen_random_bytes(9), 'base64'), '+/', '-_'),
  created_at timestamptz not null default now()
);
create index on public.bills(store_id, created_at desc);

create table public.bill_lines (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.bills(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  item_id uuid references public.items(id) on delete set null,
  name text not null,
  qty numeric(12,3) not null check (qty > 0),
  unit text not null,
  price numeric(10,2) not null check (price >= 0),
  amount numeric(12,2) not null,
  returned_qty numeric(12,3) not null default 0
);
create index on public.bill_lines(store_id, item_id);

create table public.stock_moves (
  id bigint generated always as identity primary key,
  store_id uuid not null references public.stores(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  delta numeric(12,3) not null,
  reason text not null check (reason in ('opening','stock_in','bill','undo','return','count')),
  ref_id uuid,
  created_at timestamptz not null default now()
);
create index on public.stock_moves(store_id, item_id, created_at desc);

create table public.udhaar_entries (
  id bigint generated always as identity primary key,
  store_id uuid not null references public.stores(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  amount numeric(12,2) not null,          -- + credit given, - payment received
  kind text not null check (kind in ('bill','payment','undo','return')),
  bill_id uuid references public.bills(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.udhaar_entries(store_id, customer_id);

-- Read access: own store only. No direct writes; everything goes through the functions.
do $$ declare t text; begin
  foreach t in array array['items','item_aliases','customers','bills','bill_lines','stock_moves','udhaar_entries'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
    execute format('create policy %I on public.%I for select to authenticated using (store_id = (select public.my_store_id()) or (select public.is_admin()))', t || '_read', t);
  end loop;
end $$;
-- Owner may hide items from the store site and set their own price directly.
grant update (hidden_online, price, name, name_hi) on public.items to authenticated;
create policy items_owner_update on public.items for update to authenticated
  using (store_id = (select public.my_store_id())) with check (store_id = (select public.my_store_id()));

create view public.customer_balances with (security_invoker = true) as
  select c.id, c.store_id, c.name, c.phone, coalesce(sum(u.amount), 0)::numeric(12,2) as balance, max(u.created_at) as last_at
  from public.customers c left join public.udhaar_entries u on u.customer_id = c.id
  group by c.id;
grant select on public.customer_balances to authenticated;

-- ---------- helpers ----------
create function public._store() returns uuid language plpgsql stable security definer set search_path = '' as $$
declare s uuid := public.my_store_id();
begin if s is null then raise exception 'no_store' using errcode = '42501'; end if; return s; end $$;

create function public._item(p_store uuid, l jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare v uuid;
begin
  if l ? 'item_id' and nullif(l->>'item_id','') is not null then
    select id into v from public.items where id = (l->>'item_id')::uuid and store_id = p_store;
    if v is null then raise exception 'bad_item'; end if;
    return v;
  end if;
  if nullif(l->>'catalog_id','') is not null then
    select id into v from public.items where store_id = p_store and catalog_id = l->>'catalog_id';
  end if;
  if v is null then
    select id into v from public.items where store_id = p_store and lower(name) = lower(l->>'name') limit 1;
  end if;
  if v is null then
    insert into public.items (store_id, catalog_id, name, name_hi, unit, loose)
    values (p_store, nullif(l->>'catalog_id',''), l->>'name', l->>'name_hi', coalesce(nullif(l->>'unit',''),'pc'), coalesce((l->>'loose')::boolean,false))
    returning id into v;
  end if;
  -- remember the words the owner used, so next time it matches without asking
  if nullif(trim(lower(l->>'said')),'') is not null then
    insert into public.item_aliases (store_id, alias, item_id) values (p_store, trim(lower(l->>'said')), v)
    on conflict (store_id, alias) do update set item_id = excluded.item_id;
  end if;
  return v;
end $$;

create function public._customer(p_store uuid, p_name text) returns uuid language plpgsql security definer set search_path = '' as $$
declare v uuid;
begin
  if nullif(trim(p_name),'') is null then return null; end if;
  select id into v from public.customers where store_id = p_store and lower(name) = lower(trim(p_name));
  if v is null then insert into public.customers (store_id, name) values (p_store, trim(p_name)) returning id into v; end if;
  return v;
end $$;

-- ---------- save a bill ----------
-- p = {customer, pay, discount, voice_text, lines:[{item_id|catalog_id, name, name_hi, unit, loose, said, qty, price}]}
create function public.save_bill(p jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  s uuid := public._store(); c uuid; b uuid; l jsonb; it uuid; sub numeric := 0; disc numeric := coalesce((p->>'discount')::numeric, 0);
  q numeric; pr numeric; known boolean; unrec boolean := false; tok text; tot numeric;
begin
  if jsonb_array_length(coalesce(p->'lines','[]')) = 0 then raise exception 'no_lines'; end if;
  if p->>'pay' not in ('cash','upi','udhaar') then raise exception 'bad_pay'; end if;
  c := public._customer(s, p->>'customer');
  if p->>'pay' = 'udhaar' and c is null then raise exception 'udhaar_needs_customer'; end if;
  insert into public.bills (store_id, customer_id, pay, subtotal, discount, total, voice_text)
  values (s, c, p->>'pay', 0, 0, 0, left(p->>'voice_text', 500)) returning id, share_token into b, tok;

  for l in select * from jsonb_array_elements(p->'lines') loop
    q := (l->>'qty')::numeric; pr := (l->>'price')::numeric;
    if q is null or q <= 0 or pr is null or pr < 0 then raise exception 'bad_line'; end if;
    it := public._item(s, l);
    insert into public.bill_lines (bill_id, store_id, item_id, name, qty, unit, price, amount)
      select b, s, it, i.name, q, i.unit, pr, round(q * pr, 2) from public.items i where i.id = it;
    sub := sub + round(q * pr, 2);
    select stock_known into known from public.items where id = it;
    if not known then unrec := true; end if;
    update public.items set stock = stock - q where id = it;
    insert into public.stock_moves (store_id, item_id, delta, reason, ref_id) values (s, it, -q, 'bill', b);
    -- decision 5: learn the price once the last 3 bills of this item used the same price
    update public.items set learned_price = pr
      where id = it and price is null and 3 = (
        select count(*) from (select bl.price from public.bill_lines bl join public.bills bb on bb.id = bl.bill_id
          where bl.item_id = it and bb.status = 'saved' order by bb.created_at desc limit 3) x where x.price = pr);
  end loop;

  if disc < 0 or disc > sub then raise exception 'bad_discount'; end if;
  tot := sub - disc;
  update public.bills set subtotal = sub, discount = disc, total = tot, has_unrecorded = unrec where id = b;
  if p->>'pay' = 'udhaar' then
    insert into public.udhaar_entries (store_id, customer_id, amount, kind, bill_id) values (s, c, tot, 'bill', b);
  end if;
  insert into public.usage_events (store_id, kind, meta) values (s, 'bill', jsonb_build_object('voice', p ? 'voice_text'));
  return jsonb_build_object('bill_id', b, 'share_token', tok, 'total', tot, 'has_unrecorded', unrec,
    'balance', (select balance from public.customer_balances where id = c));
end $$;

-- ---------- undo a bill (the Undo right after saving) ----------
create function public.undo_bill(p_bill uuid) returns void language plpgsql security definer set search_path = '' as $$
declare s uuid := public._store(); r record; bb record;
begin
  select * into bb from public.bills where id = p_bill and store_id = s for update;
  if bb is null or bb.status <> 'saved' then raise exception 'not_found'; end if;
  for r in select item_id, qty - returned_qty as q from public.bill_lines where bill_id = p_bill and item_id is not null loop
    update public.items set stock = stock + r.q where id = r.item_id;
    insert into public.stock_moves (store_id, item_id, delta, reason, ref_id) values (s, r.item_id, r.q, 'undo', p_bill);
  end loop;
  if bb.pay = 'udhaar' then
    insert into public.udhaar_entries (store_id, customer_id, amount, kind, bill_id)
      select s, bb.customer_id, -coalesce(sum(amount),0), 'undo', p_bill from public.udhaar_entries where bill_id = p_bill;
  end if;
  update public.bills set status = 'undone' where id = p_bill;
end $$;

-- ---------- maal aaya / opening stock ----------
-- p = {reason:'stock_in'|'opening', lines:[{item_id|catalog_id, name, name_hi, unit, loose, said, qty}]}
create function public.add_stock(p jsonb) returns int language plpgsql security definer set search_path = '' as $$
declare s uuid := public._store(); l jsonb; it uuid; q numeric; n int := 0; rsn text := coalesce(p->>'reason','stock_in');
begin
  if rsn not in ('stock_in','opening') then raise exception 'bad_reason'; end if;
  for l in select * from jsonb_array_elements(coalesce(p->'lines','[]')) loop
    q := (l->>'qty')::numeric;
    if q is null or q <= 0 then raise exception 'bad_line'; end if;
    it := public._item(s, l);
    update public.items set stock = stock + q, stock_known = true where id = it;
    insert into public.stock_moves (store_id, item_id, delta, reason) values (s, it, q, rsn);
    n := n + 1;
  end loop;
  insert into public.usage_events (store_id, kind) values (s, rsn);
  return n;
end $$;

-- ---------- udhaar payment ("Gupta ji ne 500 diye") ----------
create function public.log_payment(p_customer uuid, p_amount numeric) returns numeric language plpgsql security definer set search_path = '' as $$
declare s uuid := public._store();
begin
  if p_amount is null or p_amount <= 0 then raise exception 'bad_amount'; end if;
  if not exists (select 1 from public.customers where id = p_customer and store_id = s) then raise exception 'not_found'; end if;
  insert into public.udhaar_entries (store_id, customer_id, amount, kind) values (s, p_customer, -p_amount, 'payment');
  insert into public.usage_events (store_id, kind) values (s, 'payment');
  return (select balance from public.customer_balances where id = p_customer);
end $$;

-- ---------- today at a glance (India time) ----------
create function public.today_summary() returns jsonb language sql stable security definer set search_path = '' as $$
  with s as (select public._store() as id),
  b as (select * from public.bills, s where store_id = s.id and status = 'saved'
        and (created_at at time zone 'Asia/Kolkata')::date = (now() at time zone 'Asia/Kolkata')::date)
  select jsonb_build_object(
    'sales', coalesce((select sum(total) from b), 0),
    'cash', coalesce((select sum(total) from b where pay = 'cash'), 0),
    'upi', coalesce((select sum(total) from b where pay = 'upi'), 0),
    'udhaar_given', coalesce((select sum(total) from b where pay = 'udhaar'), 0),
    'udhaar_collected', coalesce((select -sum(amount) from public.udhaar_entries u, s where u.store_id = s.id and kind = 'payment'
        and (u.created_at at time zone 'Asia/Kolkata')::date = (now() at time zone 'Asia/Kolkata')::date), 0),
    'bills', (select count(*) from b))
$$;

do $$ declare f text; begin
  foreach f in array array['_store()','_item(uuid,jsonb)','_customer(uuid,text)'] loop
    execute format('revoke execute on function public.%s from public, anon, authenticated', f);
  end loop;
  foreach f in array array['save_bill(jsonb)','undo_bill(uuid)','add_stock(jsonb)','log_payment(uuid,numeric)','today_summary()'] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
