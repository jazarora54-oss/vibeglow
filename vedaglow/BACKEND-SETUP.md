# VEDAGLOW backend setup (about 15 minutes, one time)

After this you manage the whole store from **yourwebsite.com/admin**: products, prices, stock, photos, banners, coupons and orders. No code editing.

## 1. Create the Supabase project
1. supabase.com → sign up (free) → **New project**. Pick any name and a strong database password (save it). Wait ~2 minutes.

## 2. Create the tables
1. Left menu → **SQL Editor** → **New query**.
2. Open `supabase/schema.sql` from this project, copy everything, paste, press **Run**. It should say "Success".

## 3. Create your admin login
1. Left menu → **Authentication → Users → Add user → Create new user**. Enter your email + a strong password. Tick **Auto Confirm User**.
2. Back in **SQL Editor**, run this (use YOUR email):
   ```sql
   insert into public.admins (user_id, email)
   select id, email from auth.users where email = 'YOUR-EMAIL@example.com'
   on conflict do nothing;
   ```
   Only people in this table can enter /admin.

## 4. Copy your keys
**Project Settings → API** (or "API Keys"):
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`  ← SECRET. Never share it with anyone, never put it in GitHub or in a chat.

## 5. Add them to Vercel
Vercel → your project → **Settings → Environment Variables**. Add the 3 names above (all environments). Then **Deployments → ⋯ → Redeploy**.

## 6. First login
1. Open `yourwebsite.com/admin` → sign in.
2. **Products → Import demo products** (copies the 12 sample products into your database), or add your own with **+ Add product**.
3. Done. Edit anything and it is live immediately.

## What you can do in /admin
| Page | What it does |
|---|---|
| Dashboard | Order counts, paid revenue, low-stock list |
| Products | Add / edit / hide / delete, photos upload, price, old price, stock, variants (sizes/shades), badges (New, Best seller, Sale, Featured) |
| Banners | Homepage slider images with headline + button. No active banner = original hero |
| Coupons | % or $ off, minimum order, max uses, expiry date |
| Orders | Every order with items + address. Set status (pending → shipped → delivered) and payment (paid / unpaid) and add tracking notes |

## Good to know
- Orders are saved in the database. Prices, stock and coupons are re-checked on the server, so customers cannot tamper with prices. Stock reduces automatically after each order.
- **Payment is NOT connected yet.** Orders arrive as "unpaid". Stripe is the next step. Until then, collect payment manually (or don't go live with selling).
- No confirmation emails are sent yet (next step with payments).
- Categories (Skin Care, Hair Care …) are fixed in code for now. Everything else is editable.
- Photo limit: 5 MB each (JPG/PNG/WebP). Supabase free plan includes 1 GB of storage.
- If the database is unreachable, the site falls back to the built-in demo products so it never shows a blank page.

---
## Update 2: new features (run migration-2 first!)
1. Supabase → SQL Editor → New query → paste `supabase/migration-2.sql` → Run. **Do this BEFORE uploading the new code to GitHub.**
2. Upload the new code to GitHub, Netlify redeploys by itself.
3. Optional: in Netlify → Environment variables add `NEXT_PUBLIC_SITE_URL` = your final website address (for Google/SEO links).
4. In /admin: **Settings** (contact + social links), **Pages**, **FAQs & Chat**, **Messages**.

---
## Update 3: emails, offers, views, auto-restock (run migration-3 first!)
1. Supabase → SQL Editor → New query → paste `supabase/migration-3.sql` → Run. **Before** uploading the new code.
2. Upload the new code to GitHub (Netlify redeploys by itself).

### Email (order confirmation, status/tracking updates, offers)
Emails use **Resend** (free plan: 3,000/month, 100/day). Nothing breaks until you set it up; the site simply sends no email.
1. resend.com → sign up → **API Keys → Create API key** → copy it.
2. Netlify → Environment variables → add:
   - `RESEND_API_KEY` = your key (mark it secret)
   - `EMAIL_FROM` = `VEDAGLOW <orders@yourdomain.com>` (only after step 3)
   - `ORDER_NOTIFY_EMAIL` = the email where YOU want a "new order" alert (optional; defaults to Settings → Support email)
3. **To email customers you must own a domain** and verify it in Resend (Domains → Add domain → add the DNS records). Until then Resend only delivers to YOUR OWN email (the one you signed up with), so you can test, but customers will not receive anything.
4. Redeploy. /admin → Settings → Email should say "connected".

### What happens automatically
- Customer places an order → confirmation email to the customer + alert email to you.
- You change an order to processing / shipped (add Tracking info) / delivered / cancelled → the customer gets an email.
- You cancel an order that has NOT shipped → its quantities go back into stock automatically. (Already-shipped orders are not restocked automatically.)
- Product page views (per browser session) and hearts (watchers) are counted: /admin → Products and Dashboard.
- Customers who click "Notify me" on a product appear in /admin → Offers. You choose % or $ off, days and a message; each person gets their own single-use code for that product.
