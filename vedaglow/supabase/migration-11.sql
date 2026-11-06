-- ============================================================
-- Migration 11 — Phase C: email log (what was sent, did it work)
-- Additive and safe to re-run. Deletes / changes no existing data.
-- ============================================================
create table if not exists public.email_log (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  kind text not null default 'other',      -- order_confirmation | admin_new_order | order_status | refund | test | ...
  to_email text not null,
  subject text not null,
  ok boolean not null,
  error text
);
create index if not exists email_log_created_idx on public.email_log (created_at desc);
alter table public.email_log enable row level security;
drop policy if exists "email log admin read" on public.email_log;
create policy "email log admin read" on public.email_log for select to authenticated using (public.is_admin());
revoke all on public.email_log from anon;
insert into public.schema_migrations (version, note) values ('11', 'Phase C: email log') on conflict (version) do nothing;
