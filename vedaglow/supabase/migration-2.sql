-- VEDAGLOW migration 2: SEO + eBay-style product details, ranking, editable pages, FAQs, settings, contact inbox, order tracking.
-- Supabase -> SQL Editor -> New query -> paste ALL -> Run.  Safe to run more than once.
-- RUN THIS BEFORE uploading the new code to GitHub.

alter table public.products add column if not exists seo_title text;
alter table public.products add column if not exists seo_description text;
alter table public.products add column if not exists seo_keywords text;
alter table public.products add column if not exists specifics jsonb not null default '[]';
alter table public.products add column if not exists sort_priority int not null default 0;
alter table public.products add column if not exists gtin text;
alter table public.products add column if not exists mpn text;
alter table public.products add column if not exists condition text default 'New';
alter table public.products add column if not exists weight_g numeric;
alter table public.products add column if not exists dimensions text;
alter table public.products add column if not exists country_of_origin text;
alter table public.products add column if not exists shelf_life text;
create index if not exists products_priority_idx on public.products (sort_priority desc, created_at desc);

alter table public.orders add column if not exists tracking_info text;   -- shown to the customer on Track Order

create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'
);
create table if not exists public.pages (
  slug text primary key,
  title text not null,
  body text not null default '',
  updated_at timestamptz not null default now()
);
create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  keywords text not null default '',
  sort_order int not null default 0,
  is_active boolean not null default true
);
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
alter table public.pages enable row level security;
alter table public.faqs enable row level security;
alter table public.messages enable row level security;

drop policy if exists "settings public read" on public.site_settings;
create policy "settings public read" on public.site_settings for select using (true);
drop policy if exists "settings admin write" on public.site_settings;
create policy "settings admin write" on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "pages public read" on public.pages;
create policy "pages public read" on public.pages for select using (true);
drop policy if exists "pages admin write" on public.pages;
create policy "pages admin write" on public.pages for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "faqs public read" on public.faqs;
create policy "faqs public read" on public.faqs for select using (is_active or public.is_admin());
drop policy if exists "faqs admin write" on public.faqs;
create policy "faqs admin write" on public.faqs for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Contact messages: customers cannot read them; the website saves them on the server (service key). Only admins read.
drop policy if exists "messages admin all" on public.messages;
create policy "messages admin all" on public.messages for all to authenticated using (public.is_admin()) with check (public.is_admin());
