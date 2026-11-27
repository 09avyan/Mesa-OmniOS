-- 0019: one phone = one row. The app sends a stable per-browser key; a new session from the same browser replaces the old row
-- (a refresh / re-login no longer shows as a new device). Revoked rows are never merged.
alter table public.store_devices add column if not exists device_key text;
drop function if exists public.device_ping(text);
create or replace function public.device_ping(p_label text, p_key text default null) returns boolean language plpgsql security definer set search_path to '' as $$
declare sid uuid := public.my_session_id(); sto uuid; rev boolean; k text := nullif(left(coalesce(p_key,''),64),'');
begin
  select su.store_id into sto from public.store_users su where su.user_id = auth.uid();
  if sto is null or sid is null then return true; end if;
  insert into public.store_devices(store_id, session_id, label, device_key) values (sto, sid, left(coalesce(p_label,'Phone'),60), k)
  on conflict (session_id) do update set last_seen = now(), device_key = coalesce(excluded.device_key, public.store_devices.device_key) returning revoked into rev;
  if k is not null and not rev then
    delete from public.store_devices where store_id = sto and device_key = k and session_id <> sid and not revoked;
  end if;
  return not rev;
end $$;
revoke all on function public.device_ping(text, text) from public, anon;
grant execute on function public.device_ping(text, text) to authenticated;
