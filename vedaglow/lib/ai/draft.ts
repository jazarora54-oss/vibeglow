/** Prompt + safe parsing for the AI Product Creator. The AI only SUGGESTS; nothing here publishes anything. */
export const SENSITIVE = ["ingredients", "how_to_use", "benefits", "size_quantity", "suitable_for"] as const;
export type Sensitive = (typeof SENSITIVE)[number];
export interface AiDraft { name: string; brand: string; product_type: string; category: string; short_description: string; description: string; ingredients: string; how_to_use: string; benefits: string; size_quantity: string; suitable_for: string; seo_title: string; seo_description: string; seo_keywords: string }
export interface DraftResult { ok: boolean; error?: string; draft?: AiDraft; /** fields the owner must check/fill before publishing */ needs: string[]; /** risky wording found (health / certification claims) */ warnings: string[] }

export const SYSTEM_PROMPT = `You write product-listing drafts for a small Ayurvedic / natural skin- and hair-care web shop in the USA, from ONE product photo.
STRICT RULES:
- Describe only what you can actually see in the photo (shape, colour, label text, brand name, product type) or what the owner wrote in the notes.
- NEVER invent ingredients, quantities, sizes, certifications, awards, results, medical or health claims, "clinically proven", "FDA", "organic", "dermatologist tested", or usage instructions. If it is not legible on the label or in the owner's notes, return null for that field.
- Do not promise results. Use calm, honest, plain marketing language. No cure / treat / heal / prevent claims.
- "from_label" must list exactly which of these fields you copied from the label or the owner's notes: ingredients, how_to_use, benefits, size_quantity, suitable_for. Leave out any field you are unsure about.
- The owner sets the price. Never mention a price.
- Reply with ONE JSON object only, no other text, with keys: name, brand, product_type, category, short_description (max 160 chars), description (max 900 chars, 2 short paragraphs), ingredients, how_to_use, benefits, size_quantity, suitable_for, seo_title (max 60), seo_description (max 155), seo_keywords (comma separated, max 8), from_label (array), uncertain (array of anything else you were unsure about).`;

export const userPrompt = (p: { categories: string[]; notes?: string; urls?: string[] }) =>
  `Allowed category values: ${p.categories.join(", ")}. Pick the closest one.\n` +
  (p.notes?.trim() ? `Owner's notes (trusted):\n${p.notes.trim().slice(0, 1200)}\n` : "No owner notes.\n") +
  (p.urls?.length ? `Reference links the owner gave (you cannot open them; do not guess what is on them):\n${p.urls.slice(0, 5).join("\n")}\n` : "") + "Write the JSON now.";

const CLAIMS: [RegExp, string][] = [
  [/\b(cures?|cured|curing)\b/i, "cure"], [/\b(treats?|treating|treatment of)\b/i, "treat"], [/\bheals?\b|\bhealing\b/i, "heal"], [/\bprevents?\b/i, "prevent"],
  [/\bclinically (proven|tested)\b/i, "clinically proven"], [/\bFDA\b/, "FDA"], [/\b(guarantee[sd]?|100% (safe|natural|pure|effective))\b/i, "guarantee / 100%"],
  [/\bdermatologist[- ](tested|approved|recommended)\b/i, "dermatologist tested"], [/\b(organic|vegan|cruelty[- ]free|non[- ]toxic|chemical[- ]free|hypoallergenic)\b/i, "certification-style claim"],
  [/\b(anti[- ]?(aging|ageing)|wrinkles? (gone|removed)|removes? (acne|scars?|dandruff)|hair (regrowth|growth) guaranteed)\b/i, "results claim"], [/\b(acne|eczema|psoriasis|diabetes|cancer|arthritis|infection)\b/i, "medical condition"],
];
const clip = (v: unknown, n: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, n) : "");
const clipLong = (v: unknown, n: number) => (typeof v === "string" ? v.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, n) : "");

export function scanClaims(text: string): string[] { return [...new Set(CLAIMS.filter(([re]) => re.test(text)).map(([, label]) => label))]; }

export function parseDraft(raw: string, categories: string[]): DraftResult {
  const none = (error: string): DraftResult => ({ ok: false, error, needs: [], warnings: [] });
  let j: any = null; const s = String(raw ?? "").replace(/```(?:json)?/gi, "");
  const a = s.indexOf("{"), b = s.lastIndexOf("}"); if (a < 0 || b <= a) return none("The AI did not return a usable answer. Please try again.");
  try { j = JSON.parse(s.slice(a, b + 1)); } catch { return none("The AI answer could not be read. Please try again."); }
  if (!j || typeof j !== "object" || Array.isArray(j)) return none("The AI answer could not be read. Please try again.");
  const fromLabel = new Set((Array.isArray(j.from_label) ? j.from_label : []).map((x: unknown) => String(x)));
  const name = clip(j.name, 120); if (!name) return none("The AI could not tell what the product is. Add a note (product name) and try again, or fill the form by hand.");
  const cat = categories.includes(String(j.category)) ? String(j.category) : categories[0] ?? "skin-care";
  const d: AiDraft = { name, brand: clip(j.brand, 80), product_type: clip(j.product_type, 80), category: cat, short_description: clip(j.short_description, 200), description: clipLong(j.description, 1500),
    ingredients: "", how_to_use: "", benefits: "", size_quantity: "", suitable_for: "", seo_title: clip(j.seo_title, 70), seo_description: clip(j.seo_description, 160), seo_keywords: clip(j.seo_keywords, 200) };
  const needs: string[] = [];
  for (const f of SENSITIVE) { const v = f === "ingredients" || f === "how_to_use" ? clipLong(j[f], 1200) : clip(j[f], 600); if (v && fromLabel.has(f)) d[f] = v; else needs.push(f); } // not on the label / notes = NOT kept, must be verified by the owner
  const warnings: string[] = []; const text = [d.name, d.short_description, d.description, d.benefits, d.seo_title, d.seo_description].join(" \n ");
  for (const w of scanClaims(text)) warnings.push(`Wording check: “${w}” – remove it unless you can prove it.`);
  for (const u of Array.isArray(j.uncertain) ? j.uncertain.slice(0, 6) : []) { const t = clip(u, 120); if (t) warnings.push(`AI was unsure: ${t}`); }
  return { ok: true, draft: d, needs, warnings };
}
export const dailyLeft = (limit: number, usedToday: number) => Math.max(0, limit - usedToday);
export const cleanUrls = (raw: string): string[] => [...new Set(String(raw ?? "").split(/[\s,]+/).map(u => u.trim()).filter(u => /^https?:\/\/[^\s<>"']{3,300}$/i.test(u)))].slice(0, 5);
