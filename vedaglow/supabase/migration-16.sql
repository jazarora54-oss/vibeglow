-- VEDAGLOW migration 16 (Phase K): Social Media Manager (Facebook Page + Instagram via the official Meta Graph API).
-- Additive and safe to run more than once. Tokens are readable ONLY by the server (no policy for anyone else).
create table if not exists public.social_tokens (
  id int primary key default 1 check (id = 1),
  page_id text, page_name text, page_token text, ig_user_id text, ig_username text,
  updated_at timestamptz not null default now()
);
alter table public.social_tokens enable row level security;            -- no policies on purpose: only the service role can touch it

create table if not exists public.social_posts (
  id bigint generated always as identity primary key,
  product_id text,
  platform text not null check (platform in ('facebook','instagram')),
  status text not null default 'queued' check (status in ('queued','posting','posted','failed','cancelled')),
  caption text not null default '',
  image_url text,
  scheduled_at timestamptz,
  attempts int not null default 0,
  last_error text,
  platform_post_id text,
  permalink text,
  dedupe_key text,
  source text not null default 'manual',          -- manual | auto | backlog
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  posted_at timestamptz
);
-- one live/posted entry per product+platform unless the owner deliberately reposts (repost uses a different key)
create unique index if not exists social_posts_dedupe_uidx on public.social_posts (dedupe_key) where status in ('queued','posting','posted') and dedupe_key is not null;
create index if not exists social_posts_status_idx on public.social_posts (status, scheduled_at);
create index if not exists social_posts_product_idx on public.social_posts (product_id);
alter table public.social_posts enable row level security;
drop policy if exists "social posts admin read" on public.social_posts;
create policy "social posts admin read" on public.social_posts for select using (public.is_admin());
revoke all on public.social_tokens from anon, authenticated;
revoke insert, update, delete on public.social_posts from anon, authenticated;

insert into public.schema_migrations (version, note) values ('16', 'Phase K: social posts queue + tokens') on conflict (version) do nothing;
