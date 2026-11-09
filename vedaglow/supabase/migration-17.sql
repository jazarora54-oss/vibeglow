-- VEDAGLOW migration 17: Category banners (one banner per category, with version history).
-- Additive and safe to run more than once. Nothing existing is changed or deleted.
create table if not exists public.category_banners (
  id uuid primary key default gen_random_uuid(),
  category_slug text not null check (category_slug ~ '^[a-z0-9][a-z0-9-]{0,59}$'),
  version int not null default 1,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  desktop_image text,
  mobile_image text,
  heading text not null default '',
  subtitle text not null default '',
  button_text text not null default '',
  button_link text not null default '',
  image_alt text not null default '',
  template text not null default 'upload' check (template in ('upload','auto')),
  mood text not null default 'auto',
  ai_prompt text not null default '',
  starts_at timestamptz,
  ends_at timestamptz,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_slug, version)
);
-- only ONE live banner per category; other categories are never touched
create unique index if not exists category_banners_one_live on public.category_banners (category_slug) where status = 'published';
create index if not exists category_banners_slug_idx on public.category_banners (category_slug, version desc);
alter table public.category_banners enable row level security;
drop policy if exists "category banners public read" on public.category_banners;
create policy "category banners public read" on public.category_banners for select using (status = 'published' or public.is_admin());
drop policy if exists "category banners admin write" on public.category_banners;
create policy "category banners admin write" on public.category_banners for all to authenticated using (public.is_admin()) with check (public.is_admin());
insert into public.schema_migrations (version, note) values ('17', 'Category banners with versions') on conflict (version) do nothing;
