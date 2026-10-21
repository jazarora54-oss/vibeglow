-- VEDAGLOW migration 7: editable categories + "hide from Google" switch for products.
-- Supabase -> SQL Editor -> New query -> paste ALL -> Run.  Safe to run more than once.
-- Run this BEFORE uploading the new code to GitHub. It only ADDS things; nothing existing is changed or deleted.

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  blurb text not null default '',
  image_url text,
  sort_order int not null default 100,
  is_active boolean not null default true,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;
drop policy if exists "categories public read" on public.categories;
create policy "categories public read" on public.categories for select using (is_active or public.is_admin());
drop policy if exists "categories admin write" on public.categories;
create policy "categories admin write" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Per-product switch: tick "Hide this product from Google" in the product page.
alter table public.products add column if not exists seo_noindex boolean not null default false;
