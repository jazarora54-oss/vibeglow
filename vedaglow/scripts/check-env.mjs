// Safety check before running the shop on your own PC.  Usage: npm run check-env
// Reads .env.local (never prints secret values) and stops you from mixing up TEST and LIVE.
import fs from "node:fs";
const file = ".env.local";
if (!fs.existsSync(file)) { console.error("✗ .env.local not found. Copy .env.example to .env.local and fill in the TEST project values."); process.exit(1); }
const env = Object.fromEntries(fs.readFileSync(file, "utf8").split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith("#") && l.includes("=")).map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; }));
let bad = 0, warn = 0; const fail = m => { console.error("✗ " + m); bad++; }, note = m => { console.warn("! " + m); warn++; }, ok = m => console.log("✓ " + m);
const url = env.NEXT_PUBLIC_SUPABASE_URL || "";
if (!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url)) fail("NEXT_PUBLIC_SUPABASE_URL missing or not like https://xxxx.supabase.co"); else ok("Supabase URL set (" + url.replace("https://", "").split(".")[0].slice(0, 4) + "…)");
if (env.PROD_SUPABASE_URL && env.PROD_SUPABASE_URL === url) fail("This is your LIVE Supabase project. Use the separate TEST project on your PC.");
else if (!env.PROD_SUPABASE_URL) note("Tip: add PROD_SUPABASE_URL=<your live project url> to .env.local so this check can stop you using live by mistake. (It is only used by this check.)");
if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) fail("NEXT_PUBLIC_SUPABASE_ANON_KEY is empty."); else ok("Anon key set");
if (!env.SUPABASE_SERVICE_ROLE_KEY) note("SUPABASE_SERVICE_ROLE_KEY is empty: orders, stock and invoices will not work locally."); else ok("Service key set (keep it secret, never commit)");
for (const k of ["STRIPE_SECRET_KEY"]) { const v = env[k] || ""; if (/^(sk|rk)_live_/.test(v)) fail(k + " is a LIVE Stripe key. Use sk_test_… on your PC."); else if (v) ok(k + " is a test key"); else note(k + " empty: card payments will not work locally."); }
if (/pk_live_|whsec_.*live/i.test(fs.readFileSync(file, "utf8"))) fail("A live Stripe value was found in .env.local.");
if (env.NEXT_PUBLIC_SITE_URL && !/^http:\/\/(localhost|127\.0\.0\.1)/.test(env.NEXT_PUBLIC_SITE_URL)) note("NEXT_PUBLIC_SITE_URL is not localhost. That is fine only if you know why.");
try { const ig = fs.readFileSync(".gitignore", "utf8") + (fs.existsSync("../.gitignore") ? fs.readFileSync("../.gitignore", "utf8") : ""); if (!/\.env/.test(ig)) fail(".env files are not in .gitignore – real keys could be uploaded to GitHub."); else ok(".env.local is ignored by git"); } catch { note("Could not read .gitignore"); }
console.log(bad ? `\n${bad} problem(s). Fix them before running.` : warn ? `\nOK with ${warn} note(s).` : "\nAll good.");
process.exit(bad ? 1 : 0);
