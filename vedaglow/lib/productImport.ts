import { slugify } from "@/lib/data/mappers";
import { unsafe } from "@/lib/csv";
/** Columns of the product CSV (same order as the export). */
export const CSV_COLUMNS = ["id", "name", "slug", "category", "price", "compare_at_price", "stock", "sku", "brand", "short_description", "description", "tags", "is_active", "images", "seo_title", "seo_description", "gtin", "mpn"] as const;
export const TAGS = ["best-seller", "new", "sale", "featured"] as const;
export const MAX_IMPORT_ROWS = 500;
export type ImportRow = Record<string, string>;
export interface Existing { id: string; slug: string; sku?: string | null; hasVariants: boolean }
export interface Patch { name?: string; slug?: string; category?: string; price?: number; compare_at_price?: number | null; stock?: number; sku?: string | null; brand?: string | null; short_description?: string; description?: string | null; tags?: string[]; is_active?: boolean; images?: string[]; seo_title?: string | null; seo_description?: string | null; gtin?: string | null; mpn?: string | null }
export interface RowResult { line: number; name: string; action: "create" | "update" | "skip" | "error"; messages: string[]; patch?: Patch; existingId?: string; note?: string }
/** CSV table (first row = headers) -> rows keyed by column name. Unknown columns are reported, not ignored silently. */
export function tableToRows(table: string[][]): { rows: ImportRow[]; headers: string[]; unknown: string[]; missing: string[] } {
  const headers = (table[0] ?? []).map(h => h.trim().toLowerCase().replace(/[\s-]+/g, "_"));
  const known = new Set<string>(CSV_COLUMNS);
  const rows = table.slice(1).map(r => Object.fromEntries(headers.map((h, i) => [h, unsafe((r[i] ?? "").trim())])));
  return { rows, headers, unknown: headers.filter(h => h && !known.has(h)), missing: ["name", "price", "category"].filter(h => !headers.includes(h)) };
}
const yes = new Set(["yes", "true", "1", "active", "visible", "y"]), no = new Set(["no", "false", "0", "draft", "hidden", "inactive", "archived", "n"]);
const num = (s: string) => (s.trim() === "" ? undefined : Number(s.replace(/[$,\s]/g, "")));
/**
 * Checks every row. Nothing is written here. Rules:
 *  - NEW products need name, price > 0 and a category that exists. Blank "is_active" means HIDDEN (draft), so nothing goes live by accident.
 *  - A product that already exists (same id, slug or SKU) is only changed when "update existing" is switched on, and then ONLY the columns that have a value.
 *  - Duplicates inside the file are rejected. Products with variations cannot have price/stock changed by CSV.
 */
export function validateImport(table: string[][], existing: Existing[], categorySlugs: string[], updateExisting: boolean): { results: RowResult[]; fileError?: string; unknown: string[] } {
  const { rows, headers, unknown, missing } = tableToRows(table);
  if (!headers.length) return { results: [], fileError: "The file is empty.", unknown };
  if (rows.length === 0) return { results: [], fileError: "The file has a header row but no products.", unknown };
  if (rows.length > MAX_IMPORT_ROWS) return { results: [], fileError: `Too many rows (${rows.length}). Import up to ${MAX_IMPORT_ROWS} products at a time.`, unknown };
  const has = (h: string) => headers.includes(h);
  const byId = new Map(existing.map(e => [e.id, e])), bySlug = new Map(existing.map(e => [e.slug, e])), bySku = new Map(existing.filter(e => e.sku).map(e => [String(e.sku).toLowerCase(), e]));
  const cats = new Map<string, string>(); for (const c of categorySlugs) cats.set(c.toLowerCase(), c);
  const seenSlug = new Set<string>(), seenSku = new Set<string>(), seenId = new Set<string>(); const results: RowResult[] = [];
  rows.forEach((r, i) => {
    const line = i + 2, m: string[] = [], res: RowResult = { line, name: r.name || r.slug || r.sku || "(no name)", action: "create", messages: m };
    const slugIn = r.slug ? slugify(r.slug) : "";
    // Which existing product (if any) is this?
    const hit = (r.id && byId.get(r.id)) || (slugIn && bySlug.get(slugIn)) || (!slugIn && r.name && bySlug.get(slugify(r.name))) || (r.sku && bySku.get(r.sku.toLowerCase())) || undefined;
    const slug = slugIn || (r.name ? slugify(r.name) : "");
    const sku = r.sku?.toLowerCase();
    if (r.id && seenId.has(r.id)) m.push(`ID "${r.id}" appears twice in this file.`); if (r.id) seenId.add(r.id);
    if (slug && seenSlug.has(slug)) m.push(`The URL name "${slug}" appears twice in this file.`); if (slug) seenSlug.add(slug);
    if (sku && seenSku.has(sku)) m.push(`SKU "${r.sku}" appears twice in this file.`); if (sku) seenSku.add(sku);
    const patch: Patch = {}; const isNew = !hit;
    const need = (h: string) => isNew || (updateExisting && has(h) && r[h] !== "");
    if (need("name")) { if (!r.name) m.push("Name is missing."); else if (r.name.length > 140) m.push("Name is longer than 140 characters."); else patch.name = r.name; }
    if (need("price") || (isNew && !has("price"))) { const p = num(r.price ?? ""); if (p === undefined || !Number.isFinite(p) || p <= 0) m.push("Price must be a number above 0."); else patch.price = Math.round(p * 100) / 100; }
    if (need("category") || (isNew && !has("category"))) { const c = cats.get((r.category ?? "").toLowerCase()) ?? cats.get(slugify(r.category ?? "")); if (!c) m.push(`Category "${r.category ?? ""}" does not exist. Create it in admin → Categories first. (Existing: ${categorySlugs.join(", ")})`); else patch.category = c; }
    if (has("compare_at_price") && r.compare_at_price !== "") { const c = num(r.compare_at_price); if (c === undefined || !Number.isFinite(c) || c <= 0) m.push("Compare-at price must be a number above 0 (or empty)."); else patch.compare_at_price = Math.round(c * 100) / 100; }
    else if (updateExisting && has("compare_at_price") && !isNew) { /* empty = leave unchanged */ }
    if (patch.compare_at_price != null && patch.price != null && patch.compare_at_price <= patch.price) m.push("Compare-at price must be higher than the price (otherwise leave it empty).");
    if (has("stock") && r.stock !== "") { const s = num(r.stock); if (s === undefined || !Number.isInteger(s) || s < 0) m.push("Stock must be a whole number, 0 or more."); else patch.stock = s; } else if (isNew) patch.stock = 0;
    // an existing product's URL name is only changed when the row names it by ID
    if (slug && (isNew || (updateExisting && has("slug") && r.slug && r.id && r.id === hit?.id))) { if (slug.length > 120) m.push("URL name is too long."); else patch.slug = slug; }
    if (has("sku") && r.sku !== "") patch.sku = r.sku.slice(0, 60); if (has("brand") && r.brand !== "") patch.brand = r.brand.slice(0, 80);
    if (has("short_description") && r.short_description !== "") patch.short_description = r.short_description.slice(0, 300);
    if (has("description") && r.description !== "") patch.description = r.description.slice(0, 8000);
    if (has("seo_title") && r.seo_title !== "") patch.seo_title = r.seo_title.slice(0, 120); if (has("seo_description") && r.seo_description !== "") patch.seo_description = r.seo_description.slice(0, 320);
    if (has("gtin") && r.gtin !== "") { if (!/^\d{8,14}$/.test(r.gtin)) m.push("Barcode (GTIN) must be 8 to 14 digits."); else patch.gtin = r.gtin; }
    if (has("mpn") && r.mpn !== "") patch.mpn = r.mpn.slice(0, 60);
    if (has("tags") && r.tags !== "") { const t = r.tags.split(/[;|]/).map(x => x.trim().toLowerCase()).filter(Boolean); const bad = t.filter(x => !(TAGS as readonly string[]).includes(x)); if (bad.length) m.push(`Unknown tag: ${bad.join(", ")}. Allowed: ${TAGS.join(", ")}.`); else patch.tags = [...new Set(t)]; }
    if (has("images") && r.images !== "") { const u = r.images.split(/[;|]/).map(x => x.trim()).filter(Boolean); const bad = u.filter(x => !/^https:\/\/\S+$/i.test(x)); if (bad.length) m.push("Images must be full https:// links (upload photos in the product page, then paste their links)."); else patch.images = u.slice(0, 12); }
    if (has("is_active") && r.is_active !== "") { const v = r.is_active.toLowerCase(); if (yes.has(v)) patch.is_active = true; else if (no.has(v)) patch.is_active = false; else m.push(`is_active "${r.is_active}" is not understood. Use yes or no.`); } else if (isNew) patch.is_active = false;
    if (hit) {
      res.existingId = hit.id; res.name = r.name || hit.slug;
      res.note = `Matches your product “${hit.slug}” by ${r.id && byId.get(r.id) ? "ID" : (slugIn || (!slugIn && r.name && bySlug.get(slugify(r.name)))) && bySlug.get(slugIn || slugify(r.name)) ? "URL name" : "SKU"}.`;
      if (!updateExisting) { res.action = "skip"; m.push("Already in your shop (same ID, URL name or SKU). Not changed. Switch on “update existing” to change it."); }
      else {
        if (hit.hasVariants && (patch.price !== undefined || patch.stock !== undefined)) m.push("This product has variations. Change its price/stock in the product page, not by CSV.");
        // changing the URL name or SKU to one used by ANOTHER product is not allowed
        const other = patch.slug ? bySlug.get(patch.slug) : undefined; if (other && other.id !== hit.id) m.push(`URL name "${patch.slug}" is already used by another product.`);
        const so = patch.sku ? bySku.get(patch.sku.toLowerCase()) : undefined; if (so && so.id !== hit.id) m.push(`SKU "${patch.sku}" is already used by another product.`);
        res.action = "update";
      }
    } else {
      if (patch.slug && bySlug.has(patch.slug)) m.push(`URL name "${patch.slug}" is already used.`);
      if (patch.sku && bySku.has(patch.sku.toLowerCase())) m.push(`SKU "${patch.sku}" is already used.`);
    }
    if (m.length && res.action !== "skip") res.action = "error"; else if (res.action === "skip") { /* keep skip */ }
    else res.patch = patch;
    if (res.action === "update" || res.action === "create") { res.patch = patch; if (res.action === "update" && Object.keys(patch).length === 0) { res.action = "skip"; m.push("Nothing to change in this row."); } }
    results.push(res);
  });
  void missing; return { results, unknown, ...(missing.length ? { fileError: `The file is missing the column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}.` } : {}) };
}
export const summarize = (r: RowResult[]) => ({ create: r.filter(x => x.action === "create").length, update: r.filter(x => x.action === "update").length, skip: r.filter(x => x.action === "skip").length, error: r.filter(x => x.action === "error").length });
