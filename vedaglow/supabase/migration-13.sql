-- ============================================================
-- Migration 13 — Phase G: AI Product Creator (usage limits + draft history)
-- Additive and safe to re-run. Deletes / changes no existing data.
-- ============================================================
create table if not exists public.ai_usage (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  provider text not null,
  model text not null,
  ok boolean not null,
  input_tokens int,
  output_tokens int,
  error text,
  by_email text
);
create index if not exists ai_usage_created_idx on public.ai_usage (created_at desc);
alter table public.ai_usage enable row level security;
drop policy if exists "ai usage admin" on public.ai_usage;
create policy "ai usage admin" on public.ai_usage for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.ai_usage from anon;

-- What the AI suggested, what was verified, and the owner's own reference links (kept for your records).
create table if not exists public.product_ai_drafts (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  product_id text,
  provider text,
  model text,
  price numeric(10,2),
  notes text,
  source_urls text[] not null default '{}',
  suggestion jsonb not null default '{}',
  needs_verification text[] not null default '{}',
  published boolean not null default false,
  by_email text
);
create index if not exists product_ai_drafts_created_idx on public.product_ai_drafts (created_at desc);
alter table public.product_ai_drafts enable row level security;
drop policy if exists "ai drafts admin" on public.product_ai_drafts;
create policy "ai drafts admin" on public.product_ai_drafts for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.product_ai_drafts from anon;

insert into public.schema_migrations (version, note) values ('13', 'Phase G: AI Product Creator usage + drafts') on conflict (version) do nothing;
