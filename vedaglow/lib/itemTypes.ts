/** "What item is this?" Picking one switches on the item-specific rows that fit it (like an eBay listing), so every box that matters is there and SEO gets filled. */
export interface ItemType { id: string; label: string; category: string; type: string; fields: string[] }
const BASE = ["Brand", "Type", "Product Line", "Volume", "Unit Quantity", "Department", "Country of Origin", "Features", "Free from", "Period After Opening", "California Prop 65 Warning"];
const mk = (id: string, label: string, category: string, type: string, extra: string[]): ItemType => ({ id, label, category, type, fields: [...new Set([BASE[0], BASE[1], ...extra, ...BASE.slice(2)])] });
export const ITEM_TYPES: ItemType[] = [
  mk("face-wash", "Face wash / cleanser", "skin-care", "Face Wash", ["Skin Type", "Formulation", "Key Ingredients", "Scent", "Body Area"]),
  mk("face-cream", "Face cream / moisturiser", "skin-care", "Face Cream", ["Skin Type", "Formulation", "Key Ingredients", "SPF", "Body Area"]),
  mk("serum", "Face serum", "skin-care", "Face Serum", ["Skin Type", "Active Ingredients", "Key Ingredients", "Formulation"]),
  mk("sunscreen", "Sunscreen", "skin-care", "Sunscreen", ["SPF", "Skin Type", "Formulation", "Key Ingredients"]),
  mk("face-mask", "Face mask / scrub", "skin-care", "Face Mask", ["Skin Type", "Formulation", "Key Ingredients", "Scent"]),
  mk("shampoo", "Shampoo", "hair-care", "Shampoo", ["Hair Type", "Formulation", "Key Ingredients", "Scent", "Hair Concern"]),
  mk("conditioner", "Conditioner / hair mask", "hair-care", "Conditioner", ["Hair Type", "Formulation", "Key Ingredients", "Scent", "Hair Concern"]),
  mk("hair-oil", "Hair oil", "hair-care", "Hair Oil", ["Hair Type", "Key Ingredients", "Scent", "Hair Concern", "Formulation"]),
  mk("hair-color", "Hair colour / dye", "hair-care", "Hair Color", ["Hair Color Shade", "Hair Type", "Ammonia Free", "Formulation", "Key Ingredients"]),
  mk("hair-serum", "Hair serum", "hair-care", "Hair Serum", ["Hair Type", "Active Ingredients", "Styling Effect", "Formulation"]),
  mk("body-lotion", "Body lotion / butter", "body-care", "Body Lotion", ["Skin Type", "Body Area", "Scent", "Key Ingredients", "Formulation"]),
  mk("body-oil", "Body / massage oil", "body-care", "Body Oil", ["Body Area", "Scent", "Key Ingredients", "Skin Type"]),
  mk("soap", "Soap / body wash", "body-care", "Soap", ["Skin Type", "Scent", "Key Ingredients", "Formulation", "Body Area"]),
  mk("toothpaste", "Toothpaste", "oral-care", "Toothpaste", ["Flavor", "Key Ingredients", "Formulation", "Active Ingredients"]),
  mk("oral-other", "Mouthwash / oral care", "oral-care", "Oral Care", ["Flavor", "Key Ingredients", "Formulation"]),
  mk("wellness", "Supplement / wellness", "health-wellness", "Wellness", ["Active Ingredients", "Form", "Dietary Need", "Key Ingredients", "Suggested Use"]),
  mk("other", "Something else", "skin-care", "", ["Suitable For", "Key Ingredients", "Formulation"]),
];
export const itemTypeById = (id: string) => ITEM_TYPES.find(t => t.id === id);
/** Keeps what is already typed, adds this type's rows (empty), puts the type's own rows first. */
export function applyItemType(current: { name: string; value: string }[], t: ItemType): { name: string; value: string }[] {
  const have = new Map(current.map(x => [x.name.trim().toLowerCase(), x])); const out = t.fields.map(f => have.get(f.toLowerCase()) ?? { name: f, value: "" });
  const used = new Set(t.fields.map(f => f.toLowerCase())); for (const x of current) if (!used.has(x.name.trim().toLowerCase()) && x.value.trim()) out.push(x);
  return out;
}
