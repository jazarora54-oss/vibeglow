-- VEDAGLOW migration 3: auto-restock on cancel, product views + watchers, offers, product-specific coupons.
-- Supabase -> SQL Editor -> New query -> paste ALL -> Run.  Safe to run more than once.
-- Run this BEFORE uploading the new code to GitHub.

alter table public.orders  add column if not exists stock_restored boolean not null default false;
alter table public.coupons add column if not exists product_id text;   -- set for "offer" coupons that apply to ONE product

-- Customers asking for a product-specific coupon: function now also returns product_id
drop function if exists public.get_coupon(text);
create or replace function public.get_coupon(p_code text)
returns table (code text, percent_off numeric, amount_off numeric, min_subtotal numeric, product_id text)
language sql security definer stable set search_path = public as
$$ select c.code, c.percent_off, c.amount_off, c.min_subtotal, c.product_id
   from public.coupons c
   where upper(c.code) = upper(trim(p_code)) and c.is_active
     and (c.expires_at is null or c.expires_at > now())
     and (c.usage_limit is null or c.used_count < c.usage_limit)
   limit 1 $$;
grant execute on function public.get_coupon(text) to anon, authenticated;

-- ---------- Views + watchers (counts only, no personal data) ----------
create table if not exists public.product_views (
  product_id text not null, day date not null default current_date, views int not null default 0,
  primary key (product_id, day)
);
create table if not exists public.product_watch (product_id text primary key, watchers int not null default 0);
alter table public.product_views enable row level security;
alter table public.product_watch enable row level security;
drop policy if exists "views admin read" on public.product_views;
create policy "views admin read" on public.product_views for select to authenticated using (public.is_admin());
drop policy if exists "watch admin read" on public.product_watch;
create policy "watch admin read" on public.product_watch for select to authenticated using (public.is_admin());

create or replace function public.track_view(p_product_id text) returns void
language sql security definer set search_path = public as
$$ insert into public.product_views (product_id, day, views)
   select p_product_id, current_date, 1 where exists (select 1 from public.products where id = p_product_id and is_active)
   on conflict (product_id, day) do update set views = public.product_views.views + 1 $$;
grant execute on function public.track_view(text) to anon, authenticated;

create or replace function public.adjust_watchers(p_product_id text, p_delta int) returns void
language sql security definer set search_path = public as
$$ insert into public.product_watch (product_id, watchers)
   select p_product_id, greatest(0, least(1, p_delta)) where exists (select 1 from public.products where id = p_product_id)
   on conflict (product_id) do update set watchers = greatest(0, public.product_watch.watchers + greatest(-1, least(1, p_delta))) $$;
grant execute on function public.adjust_watchers(text, int) to anon, authenticated;

-- One call for the admin product list (returns nothing unless you are an admin)
create or replace function public.product_stats() returns table (product_id text, views_30d bigint, watchers int)
language sql security definer stable set search_path = public as
$$ select p.id,
          coalesce((select sum(v.views) from public.product_views v where v.product_id = p.id and v.day >= current_date - 29), 0)::bigint,
          coalesce(w.watchers, 0)
   from public.products p left join public.product_watch w on w.product_id = p.id
   where public.is_admin() $$;
grant execute on function public.product_stats() to authenticated;

-- ---------- Offers ----------
create table if not exists public.offer_subscribers (
  id uuid primary key default gen_random_uuid(),
  product_id text not null, email text not null,
  token text not null default replace(gen_random_uuid()::text, '-', ''),
  unsubscribed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (product_id, email)
);
create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  product_id text not null, kind text not null, value numeric not null, days int not null,
  message text, sent_count int not null default 0, created_at timestamptz not null default now()
);
alter table public.offer_subscribers enable row level security;
alter table public.offers enable row level security;
drop policy if exists "subscribers admin all" on public.offer_subscribers;
create policy "subscribers admin all" on public.offer_subscribers for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "offers admin all" on public.offers;
create policy "offers admin all" on public.offers for all to authenticated using (public.is_admin()) with check (public.is_admin());
