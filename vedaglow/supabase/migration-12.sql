-- ============================================================
-- Migration 12 — Phase E: inventory history + "first order only" coupons
-- Additive and safe to re-run. Deletes / changes no existing data.
-- ============================================================
alter table public.coupons add column if not exists first_order_only boolean not null default false;

create table if not exists public.stock_movements (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  product_id text not null,
  variant_id text,
  label text not null,
  qty_before int not null,
  qty_after int not null,
  reason text not null default '',
  by_email text
);
create index if not exists stock_movements_created_idx on public.stock_movements (created_at desc);
create index if not exists stock_movements_product_idx on public.stock_movements (product_id);
alter table public.stock_movements enable row level security;
drop policy if exists "stock movements admin read" on public.stock_movements;
create policy "stock movements admin read" on public.stock_movements for select to authenticated using (public.is_admin());
revoke all on public.stock_movements from anon;

-- Admin sets the real count for a product (or one variant). Row-locked, so it cannot clash with a sale; every change is logged.
create or replace function public.set_stock(p_product text, p_variant text, p_qty int, p_reason text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare prod public.products%rowtype; before_q int; nv jsonb; lbl text; who text;
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  if p_qty is null or p_qty < 0 or p_qty > 100000 then raise exception 'bad_quantity'; end if;
  select * into prod from public.products where id = p_product for update;
  if not found then raise exception 'unknown_product'; end if;
  who := nullif(auth.jwt() ->> 'email', '');
  if jsonb_typeof(prod.variants) = 'array' and jsonb_array_length(prod.variants) > 0 then
    if p_variant is null or p_variant = '' then raise exception 'variant_required'; end if;
    select (v->>'stock')::int, prod.name || ' - ' || coalesce(v->>'label', p_variant) into before_q, lbl from jsonb_array_elements(prod.variants) v where v->>'id' = p_variant;
    if before_q is null then raise exception 'unknown_variant'; end if;
    select jsonb_agg(case when v->>'id' = p_variant then jsonb_set(v, '{stock}', to_jsonb(p_qty)) else v end order by ord) into nv from jsonb_array_elements(prod.variants) with ordinality as t(v, ord);
    update public.products set variants = nv, stock = (select coalesce(sum((v->>'stock')::int), 0) from jsonb_array_elements(nv) v), updated_at = now() where id = prod.id;
  else
    before_q := prod.stock; lbl := prod.name;
    update public.products set stock = p_qty, updated_at = now() where id = prod.id;
  end if;
  insert into public.stock_movements (product_id, variant_id, label, qty_before, qty_after, reason, by_email)
    values (prod.id, nullif(p_variant, ''), lbl, before_q, p_qty, left(coalesce(p_reason, ''), 200), who);
  return jsonb_build_object('before', before_q, 'after', p_qty);
end $$;
revoke all on function public.set_stock(text, text, int, text) from public, anon;
grant execute on function public.set_stock(text, text, int, text) to authenticated;

insert into public.schema_migrations (version, note) values ('12', 'Phase E: stock history, set_stock, first-order-only coupons') on conflict (version) do nothing;
