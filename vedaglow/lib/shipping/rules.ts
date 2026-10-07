import type { CartItem, OrderItem, Parcel, Product, ShipMode, ShippingMethod, ShippingOption } from "@/types";
import { money } from "@/lib/format";

/**
 * Shipping rules (pure functions, safe in the browser AND on the server).
 *
 * Every product has a shipping mode, set when you list it (like eBay):
 *   free        -> you pay the carrier, the customer sees "Free shipping"
 *   flat        -> a fixed charge: price for the first item, optional price for each additional item
 *   calculated  -> the real USPS / UPS / FedEx price from weight + package size (live rates need Shippo)
 * Plus an optional store-wide rule from Settings: "orders over $X ship free".
 */
export const G_PER_OZ = 28.349523125;
export const gToOz = (g: number) => g / G_PER_OZ;
const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;
export function splitLbOz(g?: number | null) { const oz = gToOz(Number(g) || 0); const lb = Math.floor(oz / 16 + 1e-9); return { lb, oz: r1(oz - lb * 16) }; }
export const lbOzToG = (lb: number, oz: number) => Math.round((Math.max(0, lb || 0) * 16 + Math.max(0, oz || 0)) * G_PER_OZ * 10) / 10;
export const weightText = (g?: number | null) => { if (!g || g <= 0) return ""; const { lb, oz } = splitLbOz(g); return [lb ? `${lb} lb` : "", oz || !lb ? `${oz} oz` : ""].filter(Boolean).join(" "); };

export interface ShipConfig { freeOver: number; defaultFlat: number }
/** Used until the real values load from admin -> Settings. Matches the old behaviour ($5.99, free over $49). */
export const DEFAULT_SHIP_CONFIG: ShipConfig = { freeOver: 49, defaultFlat: 5.99 };
export const DEFAULT_HANDLING_DAYS = 2;
export const PACKAGING_OZ = 2;                       // box + padding added to every carrier-rated parcel
export const DEFAULT_PKG: [number, number, number] = [7, 5, 3]; // inches, used when a product has no package size

export interface ShipLine { mode: ShipMode; flat?: number | null; extra?: number | null; weight_g?: number | null; pkg?: [number, number, number] | null; handling_days?: number | null; quantity: number }
const pkgOf = (a?: number | null, b?: number | null, c?: number | null): [number, number, number] | undefined => a && b && c && a > 0 && b > 0 && c > 0 ? [a, b, c] : undefined;
export const MODES: ShipMode[] = ["free", "flat", "calculated"];
export const asMode = (m: unknown): ShipMode => (MODES as unknown[]).includes(m) ? (m as ShipMode) : "flat";

export const lineFromProduct = (p: Product, quantity = 1): ShipLine => ({ mode: asMode(p.shipping_mode), flat: p.shipping_flat_price, extra: p.shipping_extra_price, weight_g: p.weight_g, pkg: pkgOf(p.pkg_length_in, p.pkg_width_in, p.pkg_height_in), handling_days: p.handling_days, quantity });
export const lineFromCart = (i: CartItem): ShipLine => ({ mode: asMode(i.ship_mode), flat: i.ship_flat, extra: i.ship_extra, weight_g: i.weight_g, pkg: i.pkg, handling_days: i.handling_days, quantity: i.quantity });
export const lineFromOrderItem = (i: OrderItem): ShipLine => ({ mode: asMode(i.ship_mode), weight_g: i.weight_g, pkg: i.pkg, quantity: i.quantity });
/** What the cart remembers about an item's shipping (the server re-checks it at checkout). */
export const cartShipFields = (p: Product): Pick<CartItem, "ship_mode" | "ship_flat" | "ship_extra" | "weight_g" | "pkg" | "handling_days"> => ({ ship_mode: asMode(p.shipping_mode), ship_flat: p.shipping_flat_price, ship_extra: p.shipping_extra_price, weight_g: p.weight_g, pkg: pkgOf(p.pkg_length_in, p.pkg_width_in, p.pkg_height_in), handling_days: p.handling_days });

/** Shipping label shown on product cards and product pages. */
export function shippingBadge(p: Pick<Product, "shipping_mode" | "shipping_flat_price" | "weight_g">, cfg: ShipConfig): { text: string; kind: "free" | "paid" | "calc" } {
  const mode = asMode(p.shipping_mode);
  if (mode === "free") return { text: "Free shipping", kind: "free" };
  if (mode === "calculated" && (p.weight_g ?? 0) > 0) return { text: "Shipping calculated at checkout", kind: "calc" };
  const price = p.shipping_flat_price ?? cfg.defaultFlat; // a calculated item without a weight is treated like the store default flat rate
  return price > 0 ? { text: `+${money(price)} shipping`, kind: "paid" } : { text: "Free shipping", kind: "free" };
}

export interface ShipPlan {
  freeByThreshold: boolean;
  flatPart: number;            // total of all flat-rate charges
  calcLines: ShipLine[];       // lines that need a carrier rate
  parcel: Parcel | null;       // parcel for the carrier-rated lines
  handlingDays: number;
}
export function buildParcel(lines: ShipLine[]): Parcel | null {
  const L = lines.filter(x => (x.weight_g ?? 0) > 0 && x.quantity > 0); if (!L.length) return null;
  let oz = PACKAGING_OZ, l = 1, w = 1, h = 0;
  for (const x of L) { const [a, b, c] = [...(x.pkg ?? DEFAULT_PKG)].sort((p, q) => q - p); oz += gToOz(x.weight_g!) * x.quantity; l = Math.max(l, a); w = Math.max(w, b); h += c * x.quantity; }
  return { weight_oz: r1(Math.max(oz, 1)), l: r1(l), w: r1(w), h: r1(Math.min(Math.max(h, 1), 36)) };
}
export function planShipping(lines: ShipLine[], subtotal: number, cfg: ShipConfig): ShipPlan {
  const freeByThreshold = cfg.freeOver > 0 && subtotal >= cfg.freeOver;
  const units: { first: number; extra: number }[] = [];
  const calcLines: ShipLine[] = [];
  for (const l of lines) {
    if (l.mode === "free") continue;
    if (l.mode === "calculated" && (l.weight_g ?? 0) > 0) { calcLines.push(l); continue; }
    for (let k = 0; k < l.quantity; k++) units.push({ first: Math.max(0, l.flat ?? cfg.defaultFlat), extra: Math.max(0, l.extra ?? 0) });
  }
  units.sort((a, b) => b.first - a.first); // the most expensive "first item" is charged once, every other unit only adds its "additional item" price
  const flatPart = units.length ? r2(units[0].first + units.slice(1).reduce((s, u) => s + u.extra, 0)) : 0;
  return { freeByThreshold, flatPart, calcLines, parcel: buildParcel(calcLines), handlingDays: Math.max(0, ...lines.map(l => l.handling_days ?? DEFAULT_HANDLING_DAYS), 0) };
}
/** Cart page estimate (before the customer enters an address). pending = a carrier rate is added at checkout. */
export function estimateShipping(lines: ShipLine[], subtotal: number, cfg: ShipConfig): { amount: number; pending: boolean } {
  if (subtotal <= 0) return { amount: 0, pending: false };
  const p = planShipping(lines, subtotal, cfg);
  if (p.freeByThreshold) return { amount: 0, pending: false };
  return { amount: p.flatPart, pending: p.calcLines.length > 0 };
}
export const allShipFree = (lines: ShipLine[]) => lines.length > 0 && lines.every(l => l.mode === "free");

/** Placeholder price table, used only when live carrier rates are not available (no Shippo key, or Shippo is down). */
const TABLE: [number, number][] = [[4, 4.5], [8, 5.25], [16, 6.5], [32, 8.75], [80, 12.5], [160, 17.5], [Infinity, 24]];
export const fallbackPrice = (oz: number) => TABLE.find(([max]) => oz <= max)![1];
export const fallbackOption = (oz: number): ShippingOption => ({ id: "standard", name: "Standard Shipping", carrier: "", service: "Standard", price: fallbackPrice(oz), days_min: 3, days_max: 7, estimated: true });

export function addBusinessDays(from: Date, n: number) {
  const d = new Date(from); let left = Math.max(0, Math.round(n));
  while (left > 0) { d.setDate(d.getDate() + 1); const wd = d.getDay(); if (wd !== 0 && wd !== 6) left--; }
  return d;
}
const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
/** "Oct 9 – Oct 14" counted in business days, handling time included. */
export function deliveryRange(handlingDays: number, min: number, max: number, now = new Date()) { return `${fmt(addBusinessDays(now, handlingDays + min))} – ${fmt(addBusinessDays(now, handlingDays + max))}`; }
export const etaText = (min: number, max: number) => min === max ? `${min} business day${min === 1 ? "" : "s"}` : `${min}–${max} business days`;

export const US_STATES: Record<string, string> = { AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", PR: "Puerto Rico" };
/** "California", "ca" or "CA" -> "CA". Returns "" when it is not a US state. */
export function stateCode(input: string): string {
  const t = (input ?? "").trim(); if (!t) return ""; const up = t.toUpperCase();
  if (US_STATES[up]) return up;
  const hit = Object.entries(US_STATES).find(([, n]) => n.toUpperCase() === up); return hit ? hit[0] : "";
}
/** The shipping option the customer picked, in the shape saved on the order. */
export const toShippingMethod = (o: ShippingOption): ShippingMethod => ({ id: o.id, name: o.name, description: o.estimated ? "Estimated shipping" : o.service, eta: etaText(o.days_min, o.days_max), price: o.price, carrier: o.carrier || undefined, days_min: o.days_min, days_max: o.days_max, estimated: o.estimated });

export const CARRIERS = ["USPS", "UPS", "FedEx", "DHL", "Other"] as const;
/** Public tracking page for a tracking number ("" when the carrier is unknown). */
export function trackingUrl(carrier: string, num: string): string {
  const n = encodeURIComponent((num ?? "").trim()); const c = (carrier ?? "").toLowerCase(); if (!n) return "";
  if (c.includes("usps")) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${n}`;
  if (c.includes("ups")) return `https://www.ups.com/track?tracknum=${n}`;
  if (c.includes("fedex")) return `https://www.fedex.com/fedextrack/?trknbr=${n}`;
  if (c.includes("dhl")) return `https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=${n}`;
  return "";
}
