-- Prices: manual (owner) or learned (same item billed >= 3 times). No cost-price questions.
alter table items add column if not exists price_source text check (price_source in ('manual','learned'));
alter table items add column if not exists bill_count int not null default 0;
create table if not exists price_observations (
  id bigserial primary key,
  store_id uuid not null references stores(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  price numeric not null,
  bill_id uuid references bills(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table price_observations enable row level security;
create policy store_all on price_observations for all to authenticated using (store_id = my_store_id()) with check (store_id = my_store_id());
create policy admin_read on price_observations for select to authenticated using (is_admin());

-- Whole-bill discount for regulars.
alter table bills add column if not exists discount numeric not null default 0 check (discount >= 0);
alter table bills add column if not exists subtotal numeric not null default 0;

-- Add stock for many lines at once (opening stock / adjustments). Creates items as needed.
-- lines: [{item_id?: uuid, catalog_id?: int, name: text, name_hi?: text, unit: text, qty: numeric, alias?: text}]
create or replace function add_stock(lines jsonb, why text default 'opening') returns bigint[]
language plpgsql security invoker set search_path = public as $$
declare s uuid := my_store_id(); l jsonb; iid uuid; mid bigint; ids bigint[] := '{}';
begin
  if s is null then raise exception 'no store'; end if;
  if why not in ('opening','adjust') then raise exception 'bad reason'; end if;
  for l in select * from jsonb_array_elements(lines) loop
    iid := nullif(l->>'item_id','')::uuid;
    if iid is null and l ? 'catalog_id' then
      select id into iid from items where store_id = s and catalog_id = (l->>'catalog_id')::int limit 1;
    end if;
    if iid is null then
      insert into items(store_id, catalog_id, name, name_hi, category, unit)
      values (s, (l->>'catalog_id')::int, l->>'name', l->>'name_hi',
              (select category from catalog_items where id = (l->>'catalog_id')::int), l->>'unit')
      returning id into iid;
    end if;
    if coalesce(l->>'alias','') <> '' then
      insert into item_aliases(store_id, alias, item_id) values (s, lower(l->>'alias'), iid)
      on conflict (store_id, alias) do update set item_id = excluded.item_id;
    end if;
    update items set stock = stock + (l->>'qty')::numeric where id = iid and store_id = s;
    insert into stock_moves(store_id, item_id, qty_change, reason) values (s, iid, (l->>'qty')::numeric, why) returning id into mid;
    ids := ids || mid;
  end loop;
  insert into usage_events(store_id, kind) values (s, 'voice');
  return ids;
end $$;

-- Undo a batch of stock moves (owner's Undo button).
create or replace function undo_moves(ids bigint[]) returns void
language plpgsql security invoker set search_path = public as $$
declare s uuid := my_store_id(); m record;
begin
  for m in select * from stock_moves where id = any(ids) and store_id = s loop
    update items set stock = stock - m.qty_change where id = m.item_id and store_id = s;
    delete from stock_moves where id = m.id;
  end loop;
end $$;

revoke execute on function add_stock(jsonb, text), undo_moves(bigint[]) from anon, public;
grant execute on function add_stock(jsonb, text), undo_moves(bigint[]) to authenticated;
revoke execute on function is_admin(), my_store_id() from anon, public;
grant execute on function is_admin(), my_store_id() to authenticated;
