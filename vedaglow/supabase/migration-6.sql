-- VEDAGLOW migration 6: security + reporting (test-order flag, activity log, rate limiting, duplicate-order protection).
-- Supabase -> SQL Editor -> New query -> paste ALL -> Run.  Safe to run more than once.
-- Run this BEFORE uploading the new code to GitHub. It only ADDS things; nothing existing is changed or deleted.

-- 1) Test orders: mark an order as "test" in admin so it is left out of sales numbers.
alter table public.orders add column if not exists is_test boolean not null default false;

-- 2) Duplicate-order protection: the checkout sends a one-time key per attempt; the same key can create only ONE order.
create unique index if not exists orders_idem_uidx on public.orders ((data->>'idem')) where data->>'idem' is not null;

-- 3) Activity log: who changed what in admin. Admins can add and read rows; nobody can edit or delete them.
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id uuid,
  user_email text,
  action text not null,
  detail text
);
alter table public.audit_log enable row level security;
drop policy if exists "audit admin read" on public.audit_log;
create policy "audit admin read" on public.audit_log for select to authenticated using (public.is_admin());
drop policy if exists "audit admin insert" on public.audit_log;
create policy "audit admin insert" on public.audit_log for insert to authenticated with check (public.is_admin() and user_id = auth.uid());

-- 4) Rate limiting for public forms (coupon checks, order tracking, contact form, checkout...). Only the server (service key) can use it.
create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits int not null default 0
);
alter table public.rate_limits enable row level security;   -- no policies: the browser can never read or write it

create or replace function public.rate_hit(p_key text, p_window_sec int, p_max int) returns boolean
language plpgsql security definer set search_path = public as $$
declare h int;
begin
  insert into public.rate_limits as r (key, window_start, hits) values (p_key, now(), 1)
  on conflict (key) do update set
    hits = case when r.window_start < now() - make_interval(secs => p_window_sec) then 1 else r.hits + 1 end,
    window_start = case when r.window_start < now() - make_interval(secs => p_window_sec) then now() else r.window_start end
  returning r.hits into h;
  if random() < 0.01 then delete from public.rate_limits where window_start < now() - interval '1 day'; end if;
  return h <= p_max;
end $$;
revoke all on function public.rate_hit(text, int, int) from public, anon, authenticated;
grant execute on function public.rate_hit(text, int, int) to service_role;
