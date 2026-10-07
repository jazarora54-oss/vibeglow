import type { Address, ShipAddress, ShippingDetail, ShippingOption } from "@/types";
import { fallbackPrice, planShipping, stateCode, type ShipConfig, type ShipLine, type ShipPlan } from "./rules";
import { getShippoRates, rateKey, shippoConfigured } from "./shippo";

/** Server only. Works out what shipping to offer a customer for a cart + address. */
export interface QuoteResult { ok: boolean; options: ShippingOption[]; message?: string; needsAddress?: boolean; plan: ShipPlan }
const r2 = (n: number) => Math.round(n * 100) / 100;
const STANDARD_DAYS: [number, number] = [3, 7];

/** Is the address complete enough to ask a carrier for a price? */
export const addressReady = (a?: Partial<Address> | null) => Boolean(a && a.address1?.trim() && a.city?.trim() && stateCode(a.state ?? "") && /^\d{5}(-\d{4})?$/.test((a.zip ?? "").trim()));

export async function quoteShipping(input: { lines: ShipLine[]; subtotal: number; to?: Address | null; contact?: { email?: string; phone?: string }; cfg: ShipConfig; from: ShipAddress | null }): Promise<QuoteResult> {
  const { lines, subtotal, to, cfg, from } = input;
  const plan = planShipping(lines, subtotal, cfg);
  const none = (message: string, needsAddress = false): QuoteResult => ({ ok: false, options: [], message, needsAddress, plan });
  if (!lines.length) return none("Your cart is empty.");
  if (to && to.country && to.country !== "United States") return none("Sorry, we currently ship within the United States only.");

  if (plan.freeByThreshold) return { ok: true, options: [{ id: "free", name: "Free Shipping", carrier: "", service: "Free", price: 0, days_min: STANDARD_DAYS[0], days_max: STANDARD_DAYS[1], estimated: false }], plan };
  if (!plan.calcLines.length) {
    const price = plan.flatPart;
    return { ok: true, options: [{ id: "standard", name: price === 0 ? "Free Shipping" : "Standard Shipping", carrier: "", service: "Standard", price, days_min: STANDARD_DAYS[0], days_max: STANDARD_DAYS[1], estimated: false }], plan };
  }
  // Some items need a real carrier price: that needs the delivery address.
  if (!addressReady(to)) return { ok: true, options: [], needsAddress: true, message: "Enter your shipping address to see USPS, UPS and FedEx prices.", plan };
  const parcel = plan.parcel!;
  const fallback = (note: string): QuoteResult => ({ ok: true, options: [{ id: "standard", name: "Standard Shipping", carrier: "", service: "Standard", price: r2(fallbackPrice(parcel.weight_oz) + plan.flatPart), days_min: STANDARD_DAYS[0], days_max: STANDARD_DAYS[1], estimated: true, note }], plan });

  if (!shippoConfigured() || !from) {
    if (shippoConfigured() && !from) console.error("shipping: Shippo is on but the ship-from address is missing in admin -> Settings. Using the estimate table.");
    return fallback("Estimated shipping");
  }
  try {
    const dest: ShipAddress = { name: `${to!.first_name} ${to!.last_name}`.trim() || "Customer", street1: to!.address1.trim(), street2: to!.address2?.trim() || undefined, city: to!.city.trim(), state: stateCode(to!.state), zip: to!.zip.trim(), country: "US", phone: input.contact?.phone, email: input.contact?.email };
    const rates = await getShippoRates(from, dest, parcel);
    const best = new Map<string, (typeof rates)[number]>();
    for (const r of rates) { const k = rateKey(r); const cur = best.get(k); if (!cur || r.amount < cur.amount) best.set(k, r); }
    const list = [...best.values()].sort((a, b) => a.amount - b.amount);
    const fastest = [...list].sort((a, b) => (a.days ?? 99) - (b.days ?? 99))[0];
    const shown = list.slice(0, 4); if (fastest && !shown.includes(fastest)) shown.push(fastest);
    const options: ShippingOption[] = shown.sort((a, b) => a.amount - b.amount).map(r => { const d = Math.max(1, Math.round(r.days ?? 5)); return { id: rateKey(r), name: `${r.carrier} ${r.service}`.trim(), carrier: r.carrier, service: r.service, price: r2(r.amount + plan.flatPart), days_min: d, days_max: d + 1, estimated: false, note: r.terms }; });
    return { ok: true, options, plan };
  } catch (e) {
    console.error("shipping: carrier rates failed, using the estimate table:", e instanceof Error ? e.message : e);
    return fallback("Estimated shipping");
  }
}
export const detailFor = (q: QuoteResult, o: ShippingOption): ShippingDetail => ({ charged: o.price, flat_part: q.plan.freeByThreshold ? 0 : q.plan.flatPart, carrier_part: q.plan.freeByThreshold ? 0 : r2(Math.max(0, o.price - q.plan.flatPart)), free_by_threshold: q.plan.freeByThreshold, weight_oz: q.plan.parcel?.weight_oz ?? 0, parcel: q.plan.parcel ? { l: q.plan.parcel.l, w: q.plan.parcel.w, h: q.plan.parcel.h } : undefined, handling_days: q.plan.handlingDays });
