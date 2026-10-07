-- VEDAGLOW migration 3: shipping (free / flat / calculated per product, package size, labels + tracking on orders).
-- Supabase -> SQL Editor -> New query -> paste ALL -> Run.  Safe to run more than once.
-- RUN THIS BEFORE uploading the new code to GitHub.
-- Only "add column if not exists": no existing data is changed or deleted.

-- Per-product shipping (like eBay listings)
--   shipping_mode: 'free'       = seller pays, customer sees "Free shipping"
--                  'flat'       = fixed charge (shipping_flat_price; empty = store default from Settings)
--                  'calculated' = real USPS / UPS / FedEx rate from weight + package size
alter table public.products add column if not exists shipping_mode text not null default 'flat';
alter table public.products add column if not exists shipping_flat_price numeric(10,2);   -- first item
alter table public.products add column if not exists shipping_extra_price numeric(10,2);  -- each additional item (empty = 0)
alter table public.products add column if not exists handling_days int;                    -- days to pack and hand to the carrier
alter table public.products add column if not exists pkg_length_in numeric(6,2);
alter table public.products add column if not exists pkg_width_in numeric(6,2);
alter table public.products add column if not exists pkg_height_in numeric(6,2);
-- (weight is the existing weight_g column)

-- Shipping label + tracking on orders
alter table public.orders add column if not exists carrier text;            -- USPS | UPS | FedEx | other
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists tracking_url text;
alter table public.orders add column if not exists label_url text;          -- PDF of the label you bought
alter table public.orders add column if not exists label_cost numeric(10,2); -- what YOU paid the carrier
alter table public.orders add column if not exists shipped_at timestamptz;

do $$ begin
  alter table public.products add constraint products_shipping_mode_chk check (shipping_mode in ('free','flat','calculated'));
exception when duplicate_object then null; end $$;
