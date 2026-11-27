-- 0015: idempotent save_bill (client_key), undo_bill within 30 min + flavour_sales decrement. ADDITIVE.
-- save_bill / public_bill / undo_bill are re-created from the LIVE definitions (0002 + 0012); only the marked lines are new.
alter table public.bills add column if not exists client_key text;
create unique index if not exists bills_store_client_key_uq on public.bills (store_id, client_key) where client_key is not null;
alter table public.bill_lines add column if not exists match_id text;   -- flavour_sales.match_id used when this line was sold (so undo can decrement it exactly)

create or replace function public.save_bill(p jsonb)
 returns jsonb language plpgsql security definer set search_path to '' as $function$
declare
  s uuid := public._store(); c uuid; b uuid; l jsonb; it uuid; sub numeric := 0; disc numeric := coalesce((p->>'discount')::numeric, 0);
  q numeric; pr numeric; known boolean; unrec boolean := false; tok text; tot numeric; fam text;
  ck text := nullif(left(p->>'client_key', 80), '');   -- NEW
  mid text;                                             -- NEW
begin
  -- NEW: same client_key already saved for this shop -> return that bill (same JSON shape), change nothing
  if ck is not null then
    select b0.id, b0.share_token, b0.total, b0.has_unrecorded, b0.customer_id into b, tok, tot, unrec, c
      from public.bills b0 where b0.store_id = s and b0.client_key = ck;
    if b is not null then
      return jsonb_build_object('bill_id', b, 'share_token', tok, 'total', tot, 'has_unrecorded', unrec,
        'balance', (select balance from public.customer_balances where id = c));
    end if;
    unrec := false; c := null; tot := null;   -- no match: reset the variables the lookup overwrote
  end if;
  if jsonb_array_length(coalesce(p->'lines','[]')) = 0 then raise exception 'no_lines'; end if;
  if p->>'pay' not in ('cash','upi','udhaar') then raise exception 'bad_pay'; end if;
  c := public.bill_customer(p);
  if p->>'pay' = 'udhaar' and c is null then raise exception 'udhaar_needs_customer'; end if;
  insert into public.bills (store_id, customer_id, pay, subtotal, discount, total, voice_text, client_key)
  values (s, c, p->>'pay', 0, 0, 0, left(p->>'voice_text', 500), ck)
  on conflict (store_id, client_key) where client_key is not null do nothing
  returning id, share_token into b, tok;
  if b is null then   -- NEW: a parallel request with the same key won the race
    select b0.id, b0.share_token, b0.total, b0.has_unrecorded, b0.customer_id into b, tok, tot, unrec, c
      from public.bills b0 where b0.store_id = s and b0.client_key = ck;
    return jsonb_build_object('bill_id', b, 'share_token', tok, 'total', tot, 'has_unrecorded', unrec,
      'balance', (select balance from public.customer_balances where id = c));
  end if;

  for l in select * from jsonb_array_elements(p->'lines') loop
    q := (l->>'qty')::numeric; pr := (l->>'price')::numeric;
    if q is null or q <= 0 or pr is null or pr < 0 then raise exception 'bad_line'; end if;
    it := public._item(s, l);
    fam := nullif(left(l->>'family', 80), '');
    mid := case when fam is not null then coalesce(nullif(left(l->>'catalog_id', 120), ''), fam) end;   -- NEW
    insert into public.bill_lines (bill_id, store_id, item_id, name, qty, unit, price, amount, variant, variant_hi, family, match_id)
      select b, s, it, i.name, q, i.unit, pr, round(q * pr, 2), nullif(left(l->>'variant', 80), ''), nullif(left(l->>'variant_hi', 80), ''), fam, mid
      from public.items i where i.id = it;
    if fam is not null then
      insert into public.flavour_sales (store_id, family, match_id, n)
      values (s, fam, mid, 1)
      on conflict (store_id, family, match_id) do update set n = public.flavour_sales.n + 1, last_at = now();
    end if;
    sub := sub + round(q * pr, 2);
    select stock_known into known from public.items where id = it;
    if not known then unrec := true; end if;
    update public.items set stock = stock - q where id = it;
    insert into public.stock_moves (store_id, item_id, delta, reason, ref_id) values (s, it, -q, 'bill', b);
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
  if nullif(p->>'order_id','') is not null then update public.orders set status = 'done', bill_id = b, updated_at = now() where id = (p->>'order_id')::uuid and store_id = s; update public.bills set order_id = (p->>'order_id')::uuid where id = b; end if;
  insert into public.usage_events (store_id, kind, meta) values (s, 'bill', jsonb_build_object('voice', p ? 'voice_text'));
  return jsonb_build_object('bill_id', b, 'share_token', tok, 'total', tot, 'has_unrecorded', unrec,
    'balance', (select balance from public.customer_balances where id = c));
end $function$;

-- public_bill: re-created from 0012 UNCHANGED (client_key is never exposed).
create or replace function public.public_bill(p_token text)
 returns jsonb language sql stable security definer set search_path to '' as $function$
  select jsonb_build_object(
    'store', s.name, 'slug', s.public_slug, 'area', s.area, 'phone', s.phone, 'upi', s.upi_id, 'customer', c.name, 'khata', c.share_token,
    'pay', b.pay, 'subtotal', b.subtotal, 'discount', b.discount,
    'total', b.total, 'status', b.status, 'at', b.created_at, 'lang', coalesce(c.lang, 'hi'),
    'no', (select count(*) from public.bills x where x.store_id = b.store_id and x.created_at <= b.created_at),
    'lines', (select coalesce(jsonb_agg(jsonb_build_object('name', l.name, 'name_hi', i.name_hi, 'catalog_id', i.catalog_id, 'variant', l.variant, 'variant_hi', l.variant_hi, 'qty', l.qty - l.returned_qty, 'unit', l.unit, 'price', l.price, 'amount', l.amount) order by l.id), '[]')
              from public.bill_lines l left join public.items i on i.id = l.item_id where l.bill_id = b.id))
  from public.bills b join public.stores s on s.id = b.store_id left join public.customers c on c.id = b.customer_id
  where b.share_token = p_token and length(p_token) >= 10
$function$;

-- undo_bill: from 0002 + (30 min window, flavour_sales decrement)
create or replace function public.undo_bill(p_bill uuid) returns void language plpgsql security definer set search_path = '' as $$
declare s uuid := public._store(); r record; bb record;
begin
  select * into bb from public.bills where id = p_bill and store_id = s for update;
  if bb is null or bb.status <> 'saved' then raise exception 'not_found'; end if;
  if bb.created_at < now() - interval '30 minutes' then raise exception 'too_old'; end if;   -- NEW
  for r in select item_id, qty - returned_qty as q from public.bill_lines where bill_id = p_bill and item_id is not null loop
    update public.items set stock = stock + r.q where id = r.item_id;
    insert into public.stock_moves (store_id, item_id, delta, reason, ref_id) values (s, r.item_id, r.q, 'undo', p_bill);
  end loop;
  -- NEW: take back this bill's flavour counts (never below 0). Lines saved before 0015 have no match_id: fall back to the item's catalog_id, then the family.
  for r in select bl.family, coalesce(bl.match_id, nullif(i.catalog_id,''), bl.family) as mid
           from public.bill_lines bl left join public.items i on i.id = bl.item_id
           where bl.bill_id = p_bill and bl.family is not null loop
    update public.flavour_sales set n = greatest(n - 1, 0) where store_id = s and family = r.family and match_id = r.mid;
  end loop;
  if bb.pay = 'udhaar' then
    insert into public.udhaar_entries (store_id, customer_id, amount, kind, bill_id)
      select s, bb.customer_id, -coalesce(sum(amount),0), 'undo', p_bill from public.udhaar_entries where bill_id = p_bill;
  end if;
  update public.bills set status = 'undone' where id = p_bill;
  -- bill made from an online order: order goes back to Ready so it can be billed again (from the live definition)
  update public.orders set status = 'ready', bill_id = null, updated_at = now() where bill_id = p_bill and store_id = s;
end $$;

revoke execute on function public.save_bill(jsonb), public.undo_bill(uuid) from public, anon;
grant execute on function public.save_bill(jsonb), public.undo_bill(uuid) to authenticated;
revoke execute on function public.public_bill(text) from public;
grant execute on function public.public_bill(text) to anon, authenticated;
