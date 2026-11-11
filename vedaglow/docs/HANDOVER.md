# VEDAGLOW – Handover (kya bana hai, kaise chalana hai)

## Stack
Next.js 15 (App Router) · Supabase (Postgres + Auth + Storage) · Netlify hosting · Stripe Checkout (cards) · Shippo (labels, test mode) · Resend (email, optional) · GA4 / Meta Pixel (optional, consent ke baad).

## Branches / environments
| | Live | Test |
|---|---|---|
| GitHub branch | `main` | `dev` |
| Netlify | Production (auto-deploy from main) | Branch deploy `dev` (private, team login) |
| Supabase | live project | `vedaglow-test` |
| Stripe | live (abhi connect nahi) | test keys, sirf dev scope |
Rule: pehle `dev` + test project par check → phir approval → tab hi `main`.

## Environment variables (Netlify → Site configuration → Environment variables; scope alag rakho)
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (secret), SHIPPO_API_KEY (test), STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, EMAIL_FROM, ORDER_NOTIFY_EMAIL, ADMIN_REQUIRE_2FA (true = sab admins ko 2-step), MARKETING_EMAILS_ENABLED (default band; sirf verified domain + consent ke baad "true"), NEXT_PUBLIC_SITE_URL.

## Database migrations – order (Supabase → SQL Editor, ek ek karke)
schema.sql, migration-2 … migration-8, **migration-9** (security), **10** (invoices, customer notes), **11** (email log), **12** (inventory history, first-order coupons).
Optional: `migration-9-require-2fa.sql` (jab 2FA enrol ho chuka ho), `migration-9-scrub.sql` (sabse last, live code chalne ke baad).
Sab files dobara chalane par safe hain (kuch delete nahi karti).

## Admin sections
Dashboard · Products · Inventory · Orders (search, CSV, invoice PDF) · Customers (CRM) · Coupons · Deals · Offers · Emails · Subscribers · Google & Analytics · Payments · Settings · Security (2FA) · Activity.

## Security summary
Admin 2FA · ship-from address private table · atomic stock/coupon (race-safe) · function permissions locked · newsletter double opt-in · upload allow-list · CSP + noindex on admin/api · secrets sirf Netlify/.env.local · promotional email default OFF · cookies/tracking sirf Accept ke baad.

## Backups
`npm run backup` (read-only) → `backups/<date>/`; `npm run verify-backup -- backups/<folder>` (checksum); `--restore-to-test` sirf TEST project par (live par refuse karta hai). Live par koi migration chalane se **pehle** backup + verify.

## Go-live checklist (sirf aapki final approval ke baad)
1. Live Supabase ka backup + verify.
2. Live Supabase mein migration-9, 10, 11, 12 (order se). Pehle test project par sab chal chuka ho.
3. Stripe test-mode full flow pass (checkout, webhook, cancel, refund) → tab live keys, sirf production scope mein.
4. `dev` → `main` merge (Netlify auto-deploy).
5. Live site check: home, shop, checkout, admin login + 2FA, Settings save.
6. `migration-9-scrub.sql`.
Rollback: Netlify → Deploys → pichla Production deploy → "Publish deploy". Database data kabhi delete nahi hota; migrations additive hain.

## Abhi band / baaki
Promotional emails (domain + consent chahiye) · custom domain/email (paid, approval ke baad) · Stripe test flow · AI Product Creator (Phase G).

## Paid cheezein
Abhi koi nahi. Aage: custom domain, sending domain/email service paid tier, Stripe fees (sirf real sales par) – bina aapki approval ke kuch nahi kharida jayega.
