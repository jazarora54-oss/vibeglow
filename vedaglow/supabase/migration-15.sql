-- VEDAGLOW migration 15 (Phase I): product FAQs + duplicate-photo fingerprint for the AI Product Creator.
-- Additive and safe to run more than once. Nothing is deleted or changed.
alter table public.products add column if not exists faqs jsonb;
alter table public.product_ai_drafts add column if not exists image_hash text;
create index if not exists product_ai_drafts_hash_idx on public.product_ai_drafts (image_hash);
insert into public.schema_migrations (version, note) values ('15', 'Phase I: product FAQs, AI duplicate fingerprint') on conflict (version) do nothing;
