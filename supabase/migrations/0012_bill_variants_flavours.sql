-- 0012: flavour / pack size on bills + per-store flavour learning. ADDITIVE ONLY. APPLIED to production 25 Nov 2026.
--
-- 1. bill_lines.variant / variant_hi / family : "Masala 70g" / "मसाला 70 ग्राम" / "u:maggi-70" (family = the product the flavour belongs to).
--    Old lines stay NULL (they have no variant). bill_lines.name keeps the item name as before; the app shows name + variant.
-- 2. flavour_sales(store_id, family, match_id, n, last_at): how many times each flavour of a product was sold by this store.
--    The app also keeps the last 30 sales per product on the phone; this table lets a new phone / cleared browser know the favourite.
-- 3. save_bill() writes both (lines may carry variant, variant_hi, family); public_bill() returns variant + variant_hi per line.

alter table public.bill_lines add column if not exists variant text;
alter table public.bill_lines add column if not exists variant_hi text;
alter table public.bill_lines add column if not exists family text;

create table if not exists public.flavour_sales (
  store_id uuid not null references public.stores(id) on delete cascade,
  family text not null,
  match_id text not null,
  n integer not null default 0 check (n >= 0),
  last_at timestamptz not null default now(),
  primary key (store_id, family, match_id)
);
alter table public.flavour_sales enable row level security;
revoke all on public.flavour_sales from anon, authenticated;
grant select on public.flavour_sales to authenticated;
drop policy if exists flavour_sales_read on public.flavour_sales;
create policy flavour_sales_read on public.flavour_sales for select to authenticated
  using (store_id = (select public.my_store_id()) or (select public.is_admin()));

create or replace function public.save_bill(p jsonb)
 returns jsonb language plpgsql security definer set search_path to '' as $function$
declare
  s uuid := public._store(); c uuid; b uuid; l jsonb; it uuid; sub numeric := 0; disc numeric := coalesce((p->>'discount')::numeric, 0);
  q numeric; pr numeric; known boolean; unrec boolean := false; tok text; tot numeric; fam text;
begin
  if jsonb_array_length(coalesce(p->'lines','[]')) = 0 then raise exception 'no_lines'; end if;
  if p->>'pay' not in ('cash','upi','udhaar') then raise exception 'bad_pay'; end if;
  c := public.bill_customer(p);
  if p->>'pay' = 'udhaar' and c is null then raise exception 'udhaar_needs_customer'; end if;
  insert into public.bills (store_id, customer_id, pay, subtotal, discount, total, voice_text)
  values (s, c, p->>'pay', 0, 0, 0, left(p->>'voice_text', 500)) returning id, share_token into b, tok;

  for l in select * from jsonb_array_elements(p->'lines') loop
    q := (l->>'qty')::numeric; pr := (l->>'price')::numeric;
    if q is null or q <= 0 or pr is null or pr < 0 then raise exception 'bad_line'; end if;
    it := public._item(s, l);
    fam := nullif(left(l->>'family', 80), '');
    insert into public.bill_lines (bill_id, store_id, item_id, name, qty, unit, price, amount, variant, variant_hi, family)
      select b, s, it, i.name, q, i.unit, pr, round(q * pr, 2), nullif(left(l->>'variant', 80), ''), nullif(left(l->>'variant_hi', 80), ''), fam
      from public.items i where i.id = it;
    if fam is not null then
      insert into public.flavour_sales (store_id, family, match_id, n)
      values (s, fam, coalesce(nullif(left(l->>'catalog_id', 120), ''), fam), 1)
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
