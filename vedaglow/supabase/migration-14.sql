-- ============================================================
-- Migration 14 — Phase H: business email (delivery log with retry + no-duplicate keys, inquiry replies)
-- Additive and safe to re-run. Deletes / changes no existing data.
-- ============================================================
alter table public.email_log add column if not exists html text;
alter table public.email_log add column if not exists text_body text;
alter table public.email_log add column if not exists attempts int not null default 1;
alter table public.email_log add column if not exists dedupe_key text;
alter table public.email_log add column if not exists order_id text;
alter table public.email_log add column if not exists has_attachment boolean not null default false;
alter table public.email_log add column if not exists reply_to text;
alter table public.email_log add column if not exists updated_at timestamptz not null default now();
-- One SUCCESSFUL email per key (e.g. order_confirmation:VDG-1) – a repeated event can never mail the customer twice.
create unique index if not exists email_log_dedupe_ok on public.email_log (dedupe_key) where ok and dedupe_key is not null;
create index if not exists email_log_to_idx on public.email_log (lower(to_email));
create index if not exists email_log_order_idx on public.email_log (order_id);

alter table public.messages add column if not exists replied_at timestamptz;
alter table public.messages add column if not exists reply_text text;

insert into public.schema_migrations (version, note) values ('14', 'Phase H: email log retry/dedupe, inquiry replies') on conflict (version) do nothing;
