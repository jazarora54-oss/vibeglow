// VEDAGLOW backup: saves ALL business data + uploaded images from Supabase to a local folder. Read-only: it never changes or deletes anything.
// Usage (Windows PowerShell or any OS, Node 20+):
//   $env:SUPABASE_URL="https://xxxx.supabase.co"; $env:SUPABASE_SERVICE_ROLE_KEY="..."; node scripts/backup.mjs
// Output: backups/<date-time>/<table>.json, media/<files>, manifest.json (row counts + file counts + SHA-256 checksums).
// The service key is a SECRET: never put it in a file inside the repo and never share it.
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
const URL_ = (process.env.SUPABASE_URL || "").replace(/\/$/, ""), KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!URL_ || !KEY) { console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first."); process.exit(1); }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const TABLES = ["products", "banners", "coupons", "orders", "admins", "site_settings", "private_settings", "pages", "faqs", "messages", "product_views", "product_watch", "offer_subscribers", "offers", "deals", "audit_log", "categories", "reviews", "newsletter_subscribers", "redirects", "schema_migrations"];
const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19), out = path.join("backups", stamp);
await mkdir(path.join(out, "media"), { recursive: true });
const manifest = { created_at: new Date().toISOString(), source: URL_, tables: {}, media: { files: 0, bytes: 0, sha256: {} } };
for (const t of TABLES) {
  const rows = []; let from = 0;
  for (;;) {
    const r = await fetch(`${URL_}/rest/v1/${t}?select=*`, { headers: { ...H, Range: `${from}-${from + 999}`, "Range-Unit": "items" } });
    if (r.status === 404 || (r.status === 400 && t !== "products")) { manifest.tables[t] = { skipped: `table not found (${r.status})` }; break; }
    if (!r.ok) { console.error(`FAILED ${t}: ${r.status} ${await r.text()}`); process.exit(2); }
    const page = await r.json(); rows.push(...page); if (page.length < 1000) break; from += 1000;
  }
  if (manifest.tables[t]?.skipped) { console.log(`- ${t}: skipped`); continue; }
  const body = JSON.stringify(rows, null, 1); await writeFile(path.join(out, `${t}.json`), body);
  manifest.tables[t] = { rows: rows.length, sha256: createHash("sha256").update(body).digest("hex") }; console.log(`✓ ${t}: ${rows.length} rows`);
}
// uploaded images/videos (bucket "media"), walking folders
async function list(prefix) {
  const files = []; let offset = 0;
  for (;;) {
    const r = await fetch(`${URL_}/storage/v1/object/list/media`, { method: "POST", headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify({ prefix, limit: 100, offset, sortBy: { column: "name", order: "asc" } }) });
    if (!r.ok) { console.error(`FAILED listing media: ${r.status}`); process.exit(3); }
    const page = await r.json();
    for (const e of page) { if (e.id === null) files.push(...await list(prefix ? `${prefix}/${e.name}` : e.name)); else files.push(prefix ? `${prefix}/${e.name}` : e.name); }
    if (page.length < 100) break; offset += 100;
  }
  return files;
}
for (const f of await list("")) {
  const r = await fetch(`${URL_}/storage/v1/object/media/${f.split("/").map(encodeURIComponent).join("/")}`, { headers: H });
  if (!r.ok) { console.error(`FAILED download ${f}: ${r.status}`); process.exit(4); }
  const buf = Buffer.from(await r.arrayBuffer()); const dest = path.join(out, "media", ...f.split("/")); await mkdir(path.dirname(dest), { recursive: true }); await writeFile(dest, buf);
  manifest.media.files++; manifest.media.bytes += buf.length; manifest.media.sha256[f] = createHash("sha256").update(buf).digest("hex");
}
console.log(`✓ media: ${manifest.media.files} files`);
await writeFile(path.join(out, "manifest.json"), JSON.stringify(manifest, null, 1));
console.log(`\nBackup complete: ${out}\nNext: verify it with  node scripts/verify-backup.mjs ${out}`);
