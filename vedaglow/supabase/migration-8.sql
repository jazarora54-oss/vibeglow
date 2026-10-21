-- VEDAGLOW migration 8: real customer reviews, real newsletter list, banner scheduling, URL redirects, real best-seller counts.
-- Supabase -> SQL Editor -> New query -> paste ALL -> Run.  Safe to run more than once.
-- Run migration-5, 6 and 7 first. Run this BEFORE uploading the new code. It only ADDS things.

-- 1) Reviews. Only approved reviews are public, and the reviewer's email is never exposed.
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id text not null,
  customer_name text not null,
  email text not null,
  rating int not null check (rating between 1 and 5),
  body text not null,
  verified boolean not null default false,          -- true = the email has a (non-cancelled) order containing this product
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_reply text,
  created_at timestamptz not null default now(),
  unique (product_id, email)
);
create index if not exists reviews_product_idx on public.reviews (product_id, status);
alter table public.reviews enable row level security;
drop policy if exists "reviews admin all" on public.reviews;
create policy "reviews admin all" on public.reviews for all to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.get_reviews(p_product_id text)
returns table (id uuid, customer_name text, rating int, body text, verified boolean, admin_reply text, created_at timestamptz)
language sql security definer stable set search_path = public as
$$ select r.id, r.customer_name, r.rating, r.body, r.verified, r.admin_reply, r.created_at
   from public.reviews r where r.product_id = p_product_id and r.status = 'approved' order by r.created_at desc limit 50 $$;
grant execute on function public.get_reviews(text) to anon, authenticated;

create or replace function public.review_stats()
returns table (product_id text, avg_rating numeric, review_count bigint)
language sql security definer stable set search_path = public as
$$ select r.product_id, round(avg(r.rating)::numeric, 2), count(*)::bigint from public.reviews r where r.status = 'approved' group by r.product_id $$;
grant execute on function public.review_stats() to anon, authenticated;

-- 2) Real sales counts (units ordered, not cancelled, not test orders) for "Best Selling". Server only.
create or replace function public.product_sales()
returns table (product_id text, units bigint)
language sql security definer stable set search_path = public as
$$ select (i->>'product_id')::text, sum(coalesce((i->>'quantity')::int, 0))::bigint
   from public.orders o, jsonb_array_elements(o.data->'items') i
   where o.status <> 'cancelled' and coalesce(o.is_test, false) = false group by 1 $$;
revoke all on function public.product_sales() from public, anon, authenticated;
grant execute on function public.product_sales() to service_role;

-- 3) Newsletter list (people who typed their email in the homepage box). Admin can read it; nobody else.
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  token text not null default replace(gen_random_uuid()::text, '-', ''),
  unsubscribed boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.newsletter_subscribers enable row level security;
drop policy if exists "newsletter admin read" on public.newsletter_subscribers;
create policy "newsletter admin read" on public.newsletter_subscribers for select to authenticated using (public.is_admin());

-- 4) Banners: schedule, separate phone image, image description for screen readers / Google.
alter table public.banners add column if not exists starts_at timestamptz;
alter table public.banners add column if not exists ends_at timestamptz;
alter table public.banners add column if not exists mobile_image_url text;
alter table public.banners add column if not exists image_alt text;

-- 5) Redirects: when you change a product or category URL name the old address forwards to the new one.
create table if not exists public.redirects (
  from_path text primary key,
  to_path text not null,
  created_at timestamptz not null default now()
);
alter table public.redirects enable row level security;
drop policy if exists "redirects public read" on public.redirects;
create policy "redirects public read" on public.redirects for select using (true);
drop policy if exists "redirects admin write" on public.redirects;
create policy "redirects admin write" on public.redirects for all to authenticated using (public.is_admin()) with check (public.is_admin());
