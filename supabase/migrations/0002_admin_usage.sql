-- Per-store usage numbers for the admin dashboard. Admin only.
create or replace function admin_usage() returns table (
  code text, name text, area text, status text, created_at timestamptz,
  bills bigint, bills_per_day numeric, receipts bigint, voice bigint, orders bigint, udhaar bigint, active_days bigint, last_active timestamptz
) language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  return query
  select s.code, s.name, s.area, s.status, s.created_at,
    (select count(*) from bills b where b.store_id = s.id),
    round((select count(*) from bills b where b.store_id = s.id)::numeric / greatest(1, (now()::date - s.created_at::date) + 1), 1),
    (select count(*) from receipts r where r.store_id = s.id and r.status = 'confirmed'),
    (select count(*) from usage_events e where e.store_id = s.id and e.kind = 'voice'),
    (select count(*) from usage_events e where e.store_id = s.id and e.kind = 'order'),
    (select count(*) from udhaar_entries x where x.store_id = s.id),
    (select count(distinct e.created_at::date) from usage_events e where e.store_id = s.id),
    (select max(e.created_at) from usage_events e where e.store_id = s.id)
  from stores s order by s.created_at;
end $$;
revoke execute on function admin_usage() from anon, public;
grant execute on function admin_usage() to authenticated;
