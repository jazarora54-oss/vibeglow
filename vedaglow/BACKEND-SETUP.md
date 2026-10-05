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
