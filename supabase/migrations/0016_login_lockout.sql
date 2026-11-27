-- 0016: per-device login lockout + "someone tried your PIN" alerts. Used by the login edge function (service role). ADDITIVE.
create table if not exists public.login_fails (
  id bigint generated always as identity primary key,
  code text not null,
  device text not null,           -- short hash of ip + label, computed in the edge function (raw ip never stored)
  at timestamptz not null default now()
);
create index if not exists login_fails_code_at_idx on public.login_fails (code, at desc);
create index if not exists login_fails_dev_idx on public.login_fails (code, device, at desc);
alter table public.login_fails enable row level security;   -- no policies: service role only
revoke all on public.login_fails from anon, authenticated;

create table if not exists public.login_alerts (
  id bigint generated always as identity primary key,
  store_id uuid not null references public.stores(id) on delete cascade,
  kind text not null check (kind in ('device_locked','shop_locked')),
  device_label text,
  fails int,
  at timestamptz not null default now()
);
create index if not exists login_alerts_store_idx on public.login_alerts (store_id, at desc);
alter table public.login_alerts enable row level security;
revoke all on public.login_alerts from anon, authenticated;

create or replace function public.recent_login_alerts() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',a.id,'kind',a.kind,'device',a.device_label,'fails',a.fails,'at',a.at) order by a.at desc), '[]'::jsonb)
  from (select * from public.login_alerts where store_id = public.my_store_id() and at > now() - interval '30 days' order by at desc limit 20) a
$$;
revoke all on function public.recent_login_alerts() from public, anon;
grant execute on function public.recent_login_alerts() to authenticated;
