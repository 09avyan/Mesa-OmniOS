-- S1: stores, who-belongs-to-which-store, admins, usage events. Each store sees only its own rows.
create extension if not exists pg_trgm with schema extensions;

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{4,8}$'),
  name text not null check (length(name) between 2 and 60),
  owner_name text,
  phone text,
  area text,
  language text not null default 'hinglish' check (language in ('hi','hinglish','en')),
  status text not null default 'active' check (status in ('active','paused')),
  created_at timestamptz not null default now()
);

create table public.store_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade
);
create index on public.store_users(store_id);

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table public.usage_events (
  id bigint generated always as identity primary key,
  store_id uuid not null references public.stores(id) on delete cascade,
  kind text not null check (length(kind) <= 40),
  meta jsonb,
  at timestamptz not null default now()
);
create index on public.usage_events(store_id, at desc);

-- The caller's store, only while the store is active (paused store = no data access).
create function public.my_store_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select su.store_id from public.store_users su
  join public.stores s on s.id = su.store_id and s.status = 'active'
  where su.user_id = auth.uid()
$$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;

revoke execute on function public.my_store_id() from public, anon;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.my_store_id() to authenticated;
grant execute on function public.is_admin() to authenticated;

alter table public.stores enable row level security;
alter table public.store_users enable row level security;
alter table public.admins enable row level security;
alter table public.usage_events enable row level security;

-- Anonymous visitors get nothing.
revoke all on all tables in schema public from anon;

create policy stores_read on public.stores for select to authenticated
  using (id = (select public.my_store_id()) or (select public.is_admin()));
-- Owners may change only their own language; everything else goes through the admin function.
revoke update on public.stores from authenticated;
grant update (language) on public.stores to authenticated;
create policy stores_lang on public.stores for update to authenticated
  using (id = (select public.my_store_id())) with check (id = (select public.my_store_id()));

create policy su_read on public.store_users for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy admins_read on public.admins for select to authenticated
  using (user_id = (select auth.uid()));

create policy usage_insert on public.usage_events for insert to authenticated
  with check (store_id = (select public.my_store_id()));
create policy usage_read on public.usage_events for select to authenticated
  using (store_id = (select public.my_store_id()) or (select public.is_admin()));
revoke update, delete on public.usage_events from authenticated;
