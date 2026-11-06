# VEDAGLOW – Windows PC par safe setup (8 GB RAM)

Goal: apni PC par shop chalana aur test karna, **bina live site ya live database ko chhue**.

## Rules (zaroor padho)
1. PC par sirf **TEST Supabase project** (`vedaglow-test`) use hoga. Live project ki keys kabhi `.env.local` mein nahi.
2. Stripe sirf **test keys** (`sk_test_...`). `sk_live_...` kabhi nahi.
3. Local server sirf `127.0.0.1` par chalta hai (`npm run dev:local`). Isko internet par **expose mat karo**: ngrok / Cloudflare tunnel / router port-forwarding / "Public" share bilkul nahi.
4. Windows Firewall mein Node.js ke liye "Public network" allow mat karna. Agar popup aaye to **Cancel / Private only** (aur wo bhi zaroori nahi).
5. Docker / local Supabase ki zaroorat **nahi**. 8 GB PC par bhari padta hai. Cloud ka free TEST project hi kaafi hai.
6. `.env.local` kabhi GitHub par upload mat karo (`.gitignore` ise rokta hai). Keys kisi ko mat bhejo.

## One-time install (free)
1. Node.js **22 LTS**: https://nodejs.org  → install (Next, Next).
2. Git: https://git-scm.com → install.
3. (Optional) VS Code: https://code.visualstudio.com

## Project laana
1. GitHub par repo → branch **dev** → Code → Download ZIP (ya `git clone -b dev <repo url>`).
2. ZIP ko `C:\vedaglow` jaisi chhoti jagah extract karo. Andar `vedaglow` folder kholo (jahan `package.json` hai).

## Setup
1. Us folder mein address bar mein `powershell` likho → Enter.
2. Chalao:
   `powershell -ExecutionPolicy Bypass -File scripts\setup-windows.ps1`
   (packages install honge, 3-6 minute; `.env.local` ban jayegi.)
3. Notepad se `.env.local` kholo. TEST project ki values bharo:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` → Supabase (test project) → Settings → API Keys
   - `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
   - Safety ke liye ek line aur: `PROD_SUPABASE_URL=<live project ka URL>` (sirf check ke liye, ye URL app use nahi karti)
4. Check: `npm run check-env`  → "All good" ya "OK" aana chahiye. Red ✗ aaye to pehle theek karo.
5. Chalao: `npm run dev:local`  → browser mein http://localhost:3000
6. Band karna: terminal mein `Ctrl + C`.

## Kam RAM par tips
- Browser ke extra tabs band karo; ek waqt mein ek hi `npm run dev:local`.
- Slow ho to: `set NODE_OPTIONS=--max-old-space-size=2048` phir `npm run dev:local`.
- Final check ke liye `npm run build` (2-4 minute) – dev server band karke chalao.

## Roz ke kaam
| Kaam | Command |
|---|---|
| Site chalana (sirf aapki PC) | `npm run dev:local` |
| Galti check (types) | `npm run typecheck` |
| Keys safe hain? | `npm run check-env` |
| Backup (read-only) | `npm run backup` |
| Backup sahi hai? | `npm run verify-backup -- backups/<folder>` |

## Kuch galat ho jaye
- "npm not found" → Node install ke baad PowerShell naya kholo.
- "Port 3000 in use" → purana terminal band karo.
- Login nahi ho raha → `.env.local` ki Supabase values aur test project mein migrations (HANDOVER.md) check karo.
