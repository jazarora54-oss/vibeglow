// Checks a backup folder is complete and uncorrupted (row counts + SHA-256 checksums), WITHOUT touching any database.
// With --restore-to-test it also loads the data into a TEST Supabase project (never use your live project here):
//   $env:TEST_SUPABASE_URL=...; $env:TEST_SUPABASE_SERVICE_ROLE_KEY=...; node scripts/verify-backup.mjs backups/<folder> --restore-to-test
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
const dir = process.argv[2]; if (!dir) { console.error("Usage: node scripts/verify-backup.mjs backups/<folder> [--restore-to-test]"); process.exit(1); }
const m = JSON.parse(await readFile(path.join(dir, "manifest.json"), "utf8")); let bad = 0;
for (const [t, info] of Object.entries(m.tables)) {
  if (info.skipped) continue;
  const body = await readFile(path.join(dir, `${t}.json`), "utf8"); const ok = createHash("sha256").update(body).digest("hex") === info.sha256 && JSON.parse(body).length === info.rows;
  console.log(`${ok ? "✓" : "✗ CORRUPT"} ${t}: ${info.rows} rows`); if (!ok) bad++;
}
for (const [f, sum] of Object.entries(m.media.sha256)) { const b = await readFile(path.join(dir, "media", ...f.split("/"))).catch(() => null); if (!b || createHash("sha256").update(b).digest("hex") !== sum) { console.log(`✗ media ${f}`); bad++; } }
console.log(`${m.media.files} media files checked`);
if (process.argv.includes("--restore-to-test")) {
  const U = (process.env.TEST_SUPABASE_URL || "").replace(/\/$/, ""), K = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY || "";
  if (!U || !K) { console.error("Set TEST_SUPABASE_URL and TEST_SUPABASE_SERVICE_ROLE_KEY (a TEST project)."); process.exit(1); }
  if (U === m.source) { console.error("REFUSED: the restore target is the same project the backup came from."); process.exit(1); }
  const H = { apikey: K, Authorization: `Bearer ${K}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" };
  const ORDER = ["products", "banners", "coupons", "categories", "site_settings", "private_settings", "pages", "faqs", "messages", "deals", "reviews", "newsletter_subscribers", "redirects", "offer_subscribers", "offers", "orders", "product_views", "product_watch", "audit_log"];
  for (const t of ORDER) { const info = m.tables[t]; if (!info || info.skipped || !info.rows) continue;
    const rows = JSON.parse(await readFile(path.join(dir, `${t}.json`), "utf8"));
    for (let i = 0; i < rows.length; i += 200) { const r = await fetch(`${U}/rest/v1/${t}`, { method: "POST", headers: H, body: JSON.stringify(rows.slice(i, i + 200)) }); if (!r.ok) { console.error(`✗ restore ${t}: ${r.status} ${await r.text()}`); bad++; break; } }
    const c = await fetch(`${U}/rest/v1/${t}?select=*`, { headers: { ...H, Prefer: "count=exact", Range: "0-0" } }); const total = Number((c.headers.get("content-range") || "").split("/")[1]);
    console.log(`${total >= info.rows ? "✓" : "✗"} restored ${t}: ${total} rows in test project (backup had ${info.rows})`); if (total < info.rows) bad++; }
}
console.log(bad ? `\n${bad} PROBLEM(S) FOUND` : "\nBackup verified OK."); process.exit(bad ? 2 : 0);
