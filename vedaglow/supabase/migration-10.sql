-- ============================================================
-- Migration 10 — Phase B: invoices + customer notes (CRM)
-- Additive and safe to re-run. Deletes / changes no existing data.
-- ============================================================
-- ---------- Invoices ----------
alter table public.orders add column if not exists invoice_no text;
alter table public.orders add column if not exists invoice_date timestamptz;
create unique index if not exists orders_invoice_no_key on public.orders (invoice_no) where invoice_no is not null;
create sequence if not exists public.invoice_seq start 1;

-- Gives an order its invoice number the first time it is asked for; later calls return the same number.
create or replace function public.assign_invoice(p_id text) returns text
language plpgsql security definer set search_path = public as $$
declare v text; begin
  select invoice_no into v from orders where id = p_id for update;
  if not found then return null; end if;
  if v is not null then return v; end if;
  v := 'INV-' || to_char(now() at time zone 'UTC', 'YYYY') || '-' || lpad(nextval('public.invoice_seq')::text, 6, '0');
  update orders set invoice_no = v, invoice_date = now() where id = p_id;
  return v;
end $$;
revoke all on function public.assign_invoice(text) from public, anon, authenticated;
grant execute on function public.assign_invoice(text) to service_role;

-- ---------- Customer notes (private, admin only) ----------
create table if not exists public.customer_notes (
  email text primary key,
  note text not null default '',
  tags text[] not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.customer_notes enable row level security;
drop policy if exists "customer notes admin" on public.customer_notes;
create policy "customer notes admin" on public.customer_notes for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.customer_notes from anon;

create index if not exists orders_email_lower_idx on public.orders (lower(email));

insert into public.schema_migrations (version, note) values ('10', 'Phase B: invoice numbers, customer notes (CRM)') on conflict do nothing;
