-- PIN lockout (login_attempts, used only by the "login" edge function) + logged-in phones.
-- Applied via MCP on 23 Nov 2026; see DECISIONS.md "Login security".
create table if not exists public.login_attempts (code text primary key, fails int not null default 0, locked_until timestamptz, updated_at timestamptz not null default now());
alter table public.login_attempts enable row level security;
create table if not exists public.store_devices (
  id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
  session_id uuid not null unique, label text not null default 'Phone', created_at timestamptz not null default now(),
  last_seen timestamptz not null default now(), revoked boolean not null default false);
create index if not exists store_devices_store on public.store_devices(store_id);
alter table public.store_devices enable row level security;
create policy devices_read on public.store_devices for select to authenticated using (store_id = (select public.my_store_id()) or (select public.is_admin()));
create or replace function public.my_session_id() returns uuid language sql stable set search_path to '' as $$ select nullif(auth.jwt()->>'session_id','')::uuid $$;
create or replace function public.my_store_id() returns uuid language sql stable security definer set search_path to '' as $$
  select su.store_id from public.store_users su join public.stores s on s.id = su.store_id and s.status = 'active'
  where su.user_id = auth.uid() and not exists (select 1 from public.store_devices d where d.session_id = public.my_session_id() and d.revoked) $$;
create or replace function public.device_ping(p_label text) returns boolean language plpgsql security definer set search_path to '' as $$
declare sid uuid := public.my_session_id(); sto uuid; rev boolean;
begin
  select su.store_id into sto from public.store_users su where su.user_id = auth.uid();
  if sto is null or sid is null then return true; end if;
  insert into public.store_devices(store_id, session_id, label) values (sto, sid, left(coalesce(p_label,'Phone'),60))
  on conflict (session_id) do update set last_seen = now() returning revoked into rev;
  return not rev;
end $$;
create or replace function public.device_revoke(p_id uuid) returns void language plpgsql security definer set search_path to '' as $$
begin
  update public.store_devices set revoked = true where id = p_id and (store_id = public.my_store_id() or public.is_admin()) and session_id is distinct from public.my_session_id();
  if not found then raise exception 'not allowed'; end if;
end $$;
revoke all on function public.device_ping(text), public.device_revoke(uuid) from public, anon;
grant execute on function public.device_ping(text), public.device_revoke(uuid) to authenticated;
