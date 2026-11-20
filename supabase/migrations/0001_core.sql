-- OmniOS core schema. Every store table carries store_id; RLS limits a store login to its own rows.
create extension if not exists pg_trgm;

create table admins (email text primary key);

create table stores (
  id uuid primary key default gen_random_uuid(),
  code text unique not null check (code ~ '^[a-z0-9]{3,12}$'),
  name text not null,
  owner_name text,
  phone text,
  area text,
  status text not null default 'active' check (status in ('active','paused')),
  user_id uuid unique references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create or replace function is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from admins where email = lower(auth.jwt()->>'email'));
$$;
create or replace function my_store_id() returns uuid language sql stable security definer set search_path = public as $$
  select id from stores where user_id = auth.uid() and status = 'active';
$$;

-- Shared Indore kirana catalogue (read-only for stores)
create table catalog_items (
  id serial primary key,
  name_en text not null,
  name_hi text not null,
  category text not null,
  unit text not null,            -- kg, g, l, ml, pc, packet
  pack_size numeric,             -- e.g. 1 for 1kg pack
  brand text,
  synonyms text[] not null default '{}',
  typical_mrp numeric
);

create table items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  catalog_id int references catalog_items(id),
  name text not null,
  name_hi text,
  category text,
  unit text not null default 'pc',
  stock numeric not null default 0,
  buy_price numeric,
  sell_price numeric,
  mrp numeric,
  hidden boolean not null default false,
  needs_receipt boolean not null default false,
  created_at timestamptz not null default now()
);
create index on items(store_id);

create table item_aliases (
  store_id uuid not null references stores(id) on delete cascade,
  alias text not null,
  item_id uuid not null references items(id) on delete cascade,
  primary key (store_id, alias)
);

create table suppliers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  name text not null,
  phone text,
  created_at timestamptz not null default now()
);

create table receipts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  supplier_id uuid references suppliers(id),
  photo_path text,
  total numeric,
  status text not null default 'draft' check (status in ('draft','confirmed')),
  paid boolean not null default true,
  due_date date,
  paid_at timestamptz,
  raw jsonb,
  received_at timestamptz not null default now()
);
create index on receipts(store_id);

create table receipt_lines (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references receipts(id) on delete cascade,
  store_id uuid not null references stores(id) on delete cascade,
  item_id uuid references items(id),
  raw_text text,
  qty numeric,
  unit text,
  buy_price numeric,
  mrp numeric,
  expiry_date date,              -- reserved for decision 7
  unclear boolean not null default false
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  name text not null,
  phone text,
  lang text not null default 'hi',
  created_at timestamptz not null default now()
);

create table bills (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  customer_id uuid references customers(id),
  total numeric not null default 0,
  pay_mode text not null default 'cash' check (pay_mode in ('cash','upi','udhaar')),
  public_token text unique not null default replace(replace(encode(extensions.gen_random_bytes(9),'base64'),'/','_'),'+','-'),
  by_voice boolean not null default false,
  created_at timestamptz not null default now()
);
create index on bills(store_id, created_at);

create table bill_lines (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills(id) on delete cascade,
  store_id uuid not null references stores(id) on delete cascade,
  item_id uuid references items(id),
  name text not null,
  qty numeric not null,
  unit text,
  price numeric not null default 0
);

create table stock_moves (
  id bigserial primary key,
  store_id uuid not null references stores(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  qty_change numeric not null,
  reason text not null check (reason in ('opening','receipt','sale','adjust','return')),
  ref_id uuid,
  created_at timestamptz not null default now()
);
create index on stock_moves(store_id, item_id, created_at);

create table udhaar_entries (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  amount numeric not null,       -- + credit given, - payment received
  note text,
  bill_id uuid references bills(id),
  created_at timestamptz not null default now()
);

create table usage_events (
  id bigserial primary key,
  store_id uuid not null references stores(id) on delete cascade,
  kind text not null,            -- login, bill, receipt, voice, order, udhaar
  created_at timestamptz not null default now()
);
create index on usage_events(store_id, created_at);

-- RLS: store sees own rows (read+write); admin reads everything.
do $$
declare t text;
begin
  foreach t in array array['items','item_aliases','suppliers','receipts','receipt_lines','customers','bills','bill_lines','stock_moves','udhaar_entries','usage_events'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy store_all on %I for all to authenticated using (store_id = my_store_id()) with check (store_id = my_store_id())', t);
    execute format('create policy admin_read on %I for select to authenticated using (is_admin())', t);
  end loop;
end $$;

alter table stores enable row level security;
create policy own_store on stores for select to authenticated using (user_id = auth.uid() or is_admin());
alter table admins enable row level security;
create policy admin_self on admins for select to authenticated using (is_admin());
alter table catalog_items enable row level security;
create policy catalog_read on catalog_items for select to authenticated using (true);
