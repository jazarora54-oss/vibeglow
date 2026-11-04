-- VEDAGLOW migration 9 (Phase A: security + database protection).
-- Supabase -> SQL Editor -> New query -> paste ALL -> Run. Safe to run more than once.
-- RUN IT FIRST ON YOUR TEST PROJECT. Only run on production after you approve. TAKE A BACKUP FIRST (see scripts/backup.mjs).
-- This file only ADDS things and tightens permissions. It never deletes products, orders, customers or settings.

-- 0) Migration tracking: a list of which migrations have been run.
create table if not exists public.schema_migrations (
  version text primary key,
  note text,
  applied_at timestamptz not null default now()
);
alter table public.schema_migrations enable row level security;   -- no policies: only the service role / SQL editor can use it
insert into public.schema_migrations (version, note) values
  ('1', 'schema.sql'), ('2', 'migration-2'), ('3', 'migration-3'), ('4', 'migration-4'), ('5', 'migration-5'), ('6', 'migration-6'), ('7', 'migration-7'), ('8', 'migration-8')
on conflict (version) do nothing;   -- 1-8 are recorded as "assumed applied"; check the app works to be sure

-- 1) Private settings (the ship-from address). Nobody except the server (service role) can read this table.
create table if not exists public.private_settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.private_settings enable row level security;
drop policy if exists "private settings admin read" on public.private_settings;
create policy "private settings admin read" on public.private_settings for select to authenticated using (public.is_admin());
revoke all on public.private_settings from anon;
-- COPY (not move) the address that is currently in the public settings row. The old copy is removed later by migration-9-scrub.sql,
-- AFTER the new code is live and you have checked Settings still shows your address.
insert into public.private_settings (id, data)
select 1, coalesce(jsonb_strip_nulls(jsonb_build_object(
  'ship_name', s.data->'ship_name', 'ship_company', s.data->'ship_company', 'ship_street1', s.data->'ship_street1', 'ship_street2', s.data->'ship_street2',
  'ship_city', s.data->'ship_city', 'ship_state', s.data->'ship_state', 'ship_zip', s.data->'ship_zip', 'ship_phone', s.data->'ship_phone')), '{}'::jsonb)
from (select data from public.site_settings where id = 1 union all select '{}'::jsonb where not exists (select 1 from public.site_settings where id = 1)) s limit 1
on conflict (id) do nothing;

-- 2) Safe stock changes: one atomic function. Rows are locked, so two customers can never buy the same last item.
--    p_sign -1 = take stock, +1 = put back. p_strict true = refuse (error 'insufficient_stock') instead of going below zero.
create or replace function public.apply_stock(p_items jsonb, p_sign int, p_strict boolean default false)
returns void language plpgsql security definer set search_path = public as $$
declare it jsonb; prod public.products%rowtype; qty int; vid text; nv jsonb; found_variant boolean;
begin
  if p_sign not in (-1, 1) then raise exception 'bad sign'; end if;
  for it in select value from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) order by value->>'product_id' loop
    qty := greatest(0, coalesce((it->>'quantity')::int, 0)); vid := nullif(it->>'variant_id', '');
    continue when qty = 0;
    select * into prod from public.products where id = it->>'product_id' for update;
    continue when not found;
    if jsonb_typeof(prod.variants) = 'array' and jsonb_array_length(prod.variants) > 0 then
      found_variant := false;
      select coalesce(jsonb_agg(case when v->>'id' = vid then jsonb_set(v, '{stock}', to_jsonb(greatest(0, (coalesce((v->>'stock')::int, 0)) + p_sign * qty))) else v end order by ord), '[]'::jsonb),
             coalesce(bool_or(v->>'id' = vid), false)
        into nv, found_variant from jsonb_array_elements(prod.variants) with ordinality as t(v, ord);
      if p_sign = -1 and p_strict then
        if not found_variant or (select coalesce((v->>'stock')::int, 0) from jsonb_array_elements(prod.variants) v where v->>'id' = vid) < qty then raise exception 'insufficient_stock:%', prod.id; end if;
      end if;
      update public.products set variants = nv, stock = (select coalesce(sum((v->>'stock')::int), 0) from jsonb_array_elements(nv) v), updated_at = now() where id = prod.id;
    else
      if p_sign = -1 and p_strict and prod.stock < qty then raise exception 'insufficient_stock:%', prod.id; end if;
      update public.products set stock = greatest(0, prod.stock + p_sign * qty), updated_at = now() where id = prod.id;
    end if;
  end loop;
end $$;
revoke all on function public.apply_stock(jsonb, int, boolean) from public, anon, authenticated;
grant execute on function public.apply_stock(jsonb, int, boolean) to service_role;

-- 3) Safe coupon use: counts one use only if the limit is not reached yet (atomic, no double use).
create or replace function public.redeem_coupon(p_code text) returns boolean
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.coupons set used_count = used_count + 1
   where upper(code) = upper(trim(p_code)) and is_active and (expires_at is null or expires_at > now()) and (usage_limit is null or used_count < usage_limit);
  get diagnostics n = row_count; return n = 1;
end $$;
revoke all on function public.redeem_coupon(text) from public, anon, authenticated;
grant execute on function public.redeem_coupon(text) to service_role;

-- 4) Database function permissions: functions the website server calls are no longer callable by the public internet directly.
revoke all on function public.get_coupon(text) from public, anon, authenticated;       grant execute on function public.get_coupon(text) to service_role;
revoke all on function public.track_view(text) from public, anon, authenticated;       grant execute on function public.track_view(text) to service_role;
revoke all on function public.adjust_watchers(text, int) from public, anon, authenticated; grant execute on function public.adjust_watchers(text, int) to service_role;
revoke all on function public.product_stats() from public, anon;                      grant execute on function public.product_stats() to authenticated, service_role;
-- is_admin(), get_reviews(), review_stats() stay public on purpose (needed by the security rules / public pages and they reveal nothing private).

-- 5) Newsletter double opt-in. Existing rows stay "not confirmed" until the person confirms (no consent proof = no marketing).
alter table public.newsletter_subscribers add column if not exists confirmed_at timestamptz;
alter table public.newsletter_subscribers add column if not exists confirm_token text;
alter table public.newsletter_subscribers add column if not exists consent_source text;
create unique index if not exists newsletter_confirm_token_uidx on public.newsletter_subscribers (confirm_token) where confirm_token is not null;

-- 6) Upload restrictions at the database level (a second lock behind the admin page): images/videos only, size limits. SVG is not allowed.
update storage.buckets set file_size_limit = 26214400,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm'] where id = 'media';

-- 7) Indexes for speed as the shop grows.
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status, created_at desc);
create index if not exists orders_email_idx on public.orders (lower(email));
create index if not exists products_active_created_idx on public.products (is_active, created_at desc);
create index if not exists products_category_idx on public.products (category);
create index if not exists reviews_status_idx on public.reviews (status, created_at desc);
create index if not exists newsletter_email_idx on public.newsletter_subscribers (lower(email));

insert into public.schema_migrations (version, note) values ('9', 'Phase A: private settings, atomic stock/coupon, function permissions, double opt-in, upload limits, indexes')
on conflict (version) do nothing;
