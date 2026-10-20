-- VEDAGLOW migration 5: Deals (Buy 2 Get 1 Free, Buy 1 Get 1 Half Price, % off sales).
-- Supabase -> SQL Editor -> New query -> paste ALL -> Run.  Safe to run more than once.
-- Run this BEFORE uploading the new code to GitHub. It only ADDS a new table; nothing existing is changed.
-- (The top-bar message and the pop-up are saved in the existing site_settings table, so they need no SQL.)

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('buy_get', 'percent')),   -- buy_get = "buy X get Y at Z% off"; percent = "Z% off"
  buy_qty int not null default 1 check (buy_qty between 1 and 20),
  get_qty int not null default 1 check (get_qty between 1 and 20),
  percent_off numeric not null check (percent_off > 0 and percent_off <= 100), -- 100 = free, 50 = half price
  product_ids text[] not null default '{}',                    -- empty = all products
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.deals enable row level security;
drop policy if exists "deals public read" on public.deals;
create policy "deals public read" on public.deals for select using (is_active or public.is_admin());
drop policy if exists "deals admin write" on public.deals;
create policy "deals admin write" on public.deals for all to authenticated using (public.is_admin()) with check (public.is_admin());
