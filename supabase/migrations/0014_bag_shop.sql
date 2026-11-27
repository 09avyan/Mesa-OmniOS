-- 0014: branded carry bags shop. ADDITIVE ONLY (bag_requests untouched). Prices/costs below are ASSUMPTIONS to verify with suppliers; editable by admin.
create table if not exists public.bag_products (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('compostable','cloth','paper')),
  name text not null,
  name_hi text,
  size text,
  pack_qty int not null check (pack_qty > 0),
  price numeric(10,2) not null check (price >= 0),   -- selling price per pack
  cost numeric(10,2) not null default 0 check (cost >= 0), -- our cost per pack (admin only, never returned to shops)
  active boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.bag_orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  status text not null default 'new' check (status in ('new','confirmed','packed','dispatched','delivered','cancelled')),
  total numeric(12,2) not null default 0,
  note text,
  address text,                                      -- snapshot at order time
  shop_name text,                                    -- snapshot
  shop_phone text,                                   -- snapshot
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists bag_orders_store_idx on public.bag_orders (store_id, created_at desc);
create index if not exists bag_orders_status_idx on public.bag_orders (status, created_at desc);
create table if not exists public.bag_order_lines (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.bag_orders(id) on delete cascade,
  product_id uuid references public.bag_products(id) on delete set null,
  name text not null,                                -- snapshot
  kind text not null,                                -- snapshot
  qty int not null check (qty > 0),                  -- packs
  pack_qty int not null,                             -- snapshot
  price numeric(10,2) not null,                      -- snapshot per pack
  cost numeric(10,2) not null                        -- snapshot per pack (admin only)
);
create index if not exists bag_order_lines_order_idx on public.bag_order_lines (order_id);
create index if not exists bag_order_lines_product_idx on public.bag_order_lines (product_id);

alter table public.bag_products enable row level security;
alter table public.bag_orders enable row level security;
alter table public.bag_order_lines enable row level security;
revoke all on public.bag_products, public.bag_orders, public.bag_order_lines from anon, authenticated;
-- bag_products: NO direct access (cost must not leak); shops use list_bag_products(). Admin edge function uses the service role.
-- bag_orders: shop reads own; admins read all. No direct writes.
grant select on public.bag_orders to authenticated;
drop policy if exists bag_orders_read on public.bag_orders;
create policy bag_orders_read on public.bag_orders for select to authenticated
  using (store_id = (select public.my_store_id()) or (select public.is_admin()));
-- lines: shop sees own lines but not cost (column-level grant); admins use the service role for cost.
grant select (id, order_id, product_id, name, kind, qty, pack_qty, price) on public.bag_order_lines to authenticated;
drop policy if exists bag_order_lines_read on public.bag_order_lines;
create policy bag_order_lines_read on public.bag_order_lines for select to authenticated
  using (exists (select 1 from public.bag_orders o where o.id = order_id and (o.store_id = (select public.my_store_id()) or (select public.is_admin()))));

insert into public.bag_products (kind, name, name_hi, size, pack_qty, price, cost, sort)
select * from (values
  ('compostable','Compostable plastic-type bag M (pack of 100)','कंपोस्टेबल प्लास्टिक-टाइप बैग M (100 का पैक)','M',100,199,120,1),
  ('paper','Paper bag M, printed (pack of 50)','पेपर बैग M, प्रिंटेड (50 का पैक)','M',50,249,160,2),
  ('cloth','Cotton cloth bag, printed (pack of 10)','कॉटन कपड़े का बैग, प्रिंटेड (10 का पैक)',null,10,199,110,3)
) v(kind,name,name_hi,size,pack_qty,price,cost,sort)
where not exists (select 1 from public.bag_products);

create or replace function public.list_bag_products() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'kind',kind,'name',name,'name_hi',name_hi,'size',size,'pack_qty',pack_qty,'price',price) order by sort, name), '[]'::jsonb)
  from public.bag_products where active and public.my_store_id() is not null
$$;

-- p = {note, address, lines:[{product_id, qty}]}  (qty = number of packs)
create or replace function public.place_bag_order(p jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare s uuid := public._store(); o uuid; l jsonb; pr record; q int; tot numeric := 0; st record; n int := 0;
begin
  if jsonb_typeof(p->'lines') is distinct from 'array' or jsonb_array_length(p->'lines') = 0 then raise exception 'no_lines'; end if;
  if jsonb_array_length(p->'lines') > 10 then raise exception 'too_many_lines'; end if;
  select name, phone, area into st from public.stores where id = s;
  insert into public.bag_orders (store_id, note, address, shop_name, shop_phone)
  values (s, left(nullif(p->>'note',''), 500), left(coalesce(nullif(p->>'address',''), st.area), 300), st.name, st.phone) returning id into o;
  for l in select * from jsonb_array_elements(p->'lines') loop
    begin q := (l->>'qty')::int; exception when others then raise exception 'bad_qty'; end;
    if q is null or q < 1 or q > 1000 then raise exception 'bad_qty'; end if;
    select * into pr from public.bag_products where id = (l->>'product_id')::uuid and active;
    if pr.id is null then raise exception 'bad_product'; end if;
    insert into public.bag_order_lines (order_id, product_id, name, kind, qty, pack_qty, price, cost)
    values (o, pr.id, pr.name, pr.kind, q, pr.pack_qty, pr.price, pr.cost);
    tot := tot + q * pr.price; n := n + 1;
  end loop;
  update public.bag_orders set total = tot where id = o;
  insert into public.usage_events (store_id, kind, meta) values (s, 'bag_order', jsonb_build_object('lines', n, 'total', tot));
  return o;
end $$;

create or replace function public.my_bag_orders() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'status',o.status,'total',o.total,'note',o.note,'address',o.address,'created_at',o.created_at,'updated_at',o.updated_at,
    'lines',(select coalesce(jsonb_agg(jsonb_build_object('name',l.name,'kind',l.kind,'qty',l.qty,'pack_qty',l.pack_qty,'price',l.price) order by l.id),'[]'::jsonb) from public.bag_order_lines l where l.order_id = o.id)
  ) order by o.created_at desc), '[]'::jsonb)
  from (select * from public.bag_orders where store_id = public.my_store_id() order by created_at desc limit 50) o
$$;

create or replace function public.cancel_bag_order(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare s uuid := public._store();
begin
  update public.bag_orders set status = 'cancelled', updated_at = now() where id = p_id and store_id = s and status = 'new';
  if not found then raise exception 'not_cancellable'; end if;
end $$;

revoke all on function public.list_bag_products(), public.place_bag_order(jsonb), public.my_bag_orders(), public.cancel_bag_order(uuid) from public, anon;
grant execute on function public.list_bag_products(), public.place_bag_order(jsonb), public.my_bag_orders(), public.cancel_bag_order(uuid) to authenticated;
