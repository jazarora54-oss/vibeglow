-- VEDAGLOW backend schema.
-- Supabase Dashboard -> SQL Editor -> New query -> paste ALL of this -> Run.
-- Safe to run more than once.

-- ---------- Tables ----------
create table if not exists public.products (
  id text primary key,
  slug text unique not null,
  name text not null,
  brand text,
  short_description text not null default '',
  description text, ingredients text, benefits text, how_to_use text, size_quantity text,
  shipping_info text, return_info text, suitable_for text, sku text, product_type text, size text,
  category text not null,
  price numeric(10,2) not null check (price >= 0),
  compare_at_price numeric(10,2),
  rating numeric(3,2) not null default 0,
  review_count int not null default 0,
  images text[] not null default '{}',
  visual jsonb not null default '{"kind":"bottle","label":"","color":"#E9D2B4"}',
  tags text[] not null default '{}',
  variants jsonb not null default '[]',
  stock int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  subtitle text not null default '',
  button_text text not null default '',
  button_link text not null default '/shop',
  image_url text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.coupons (
  code text primary key,
  percent_off numeric(5,2),
  amount_off numeric(10,2),
  min_subtotal numeric(10,2),
  usage_limit int,
  used_count int not null default 0,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  created_at timestamptz not null default now(),
  status text not null default 'pending',          -- pending | processing | shipped | delivered | cancelled
  payment_status text not null default 'unpaid',   -- unpaid | paid | refunded
  email text not null,
  phone text,
  customer_name text,
  total numeric(10,2) not null,
  data jsonb not null,                              -- full order: items, addresses, summary
  notes text
);

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text
);

-- ---------- Helper functions ----------
create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as
$$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;
grant execute on function public.is_admin() to anon, authenticated;

-- Customers can validate a coupon code without being able to list all coupons.
create or replace function public.get_coupon(p_code text)
returns table (code text, percent_off numeric, amount_off numeric, min_subtotal numeric)
language sql security definer stable set search_path = public as
$$ select c.code, c.percent_off, c.amount_off, c.min_subtotal
   from public.coupons c
   where upper(c.code) = upper(trim(p_code)) and c.is_active
     and (c.expires_at is null or c.expires_at > now())
     and (c.usage_limit is null or c.used_count < c.usage_limit)
   limit 1 $$;
grant execute on function public.get_coupon(text) to anon, authenticated;

-- ---------- Row Level Security ----------
alter table public.products enable row level security;
alter table public.banners  enable row level security;
alter table public.coupons  enable row level security;
alter table public.orders   enable row level security;
alter table public.admins   enable row level security;

drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products for select using (is_active or public.is_admin());
drop policy if exists "products admin write" on public.products;
create policy "products admin write" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "banners public read" on public.banners;
create policy "banners public read" on public.banners for select using (is_active or public.is_admin());
drop policy if exists "banners admin write" on public.banners;
create policy "banners admin write" on public.banners for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "coupons admin all" on public.coupons;
create policy "coupons admin all" on public.coupons for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Orders: customers cannot read or write directly. The website creates orders on the server (service role).
drop policy if exists "orders admin read" on public.orders;
create policy "orders admin read" on public.orders for select to authenticated using (public.is_admin());
drop policy if exists "orders admin update" on public.orders;
create policy "orders admin update" on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins read self" on public.admins;
create policy "admins read self" on public.admins for select to authenticated using (user_id = auth.uid());

-- ---------- Image storage (public read, admin write) ----------
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;
drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects for select using (bucket_id = 'media');
drop policy if exists "media admin insert" on storage.objects;
create policy "media admin insert" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "media admin update" on storage.objects;
create policy "media admin update" on storage.objects for update to authenticated using (bucket_id = 'media' and public.is_admin());
drop policy if exists "media admin delete" on storage.objects;
create policy "media admin delete" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_admin());

-- ---------- Make yourself the admin (run AFTER creating your user in Authentication -> Users) ----------
-- Replace the email, then run just this line:
-- insert into public.admins (user_id, email) select id, email from auth.users where email = 'YOUR-EMAIL@example.com' on conflict do nothing;
