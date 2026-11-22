-- Public bill page (/b/<token>): anyone with the WhatsApp link sees that one bill, nothing else.
create function public.public_bill(p_token text) returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'store', s.name, 'area', s.area, 'customer', c.name, 'pay', b.pay, 'subtotal', b.subtotal, 'discount', b.discount,
    'total', b.total, 'status', b.status, 'at', b.created_at, 'lang', coalesce(c.lang, 'hi'),
    'lines', (select coalesce(jsonb_agg(jsonb_build_object('name', l.name, 'name_hi', i.name_hi, 'qty', l.qty - l.returned_qty, 'unit', l.unit, 'price', l.price, 'amount', l.amount) order by l.id), '[]')
              from public.bill_lines l left join public.items i on i.id = l.item_id where l.bill_id = b.id))
  from public.bills b join public.stores s on s.id = b.store_id left join public.customers c on c.id = b.customer_id
  where b.share_token = p_token and length(p_token) >= 10
$$;
-- Remember the customer's language choice for their next bill (brief: defaults to last choice, Hindi if new).
create function public.set_bill_lang(p_token text, p_lang text) returns void language sql security definer set search_path = '' as $$
  update public.customers c set lang = p_lang from public.bills b
  where b.share_token = p_token and length(p_token) >= 10 and c.id = b.customer_id and p_lang in ('hi','en')
$$;
revoke execute on function public.public_bill(text) from public;
revoke execute on function public.set_bill_lang(text,text) from public;
grant execute on function public.public_bill(text) to anon, authenticated;
grant execute on function public.set_bill_lang(text,text) to anon, authenticated;
