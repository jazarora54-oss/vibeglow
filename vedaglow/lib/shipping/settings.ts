import type { ShipAddress } from "@/types";
import type { SiteSettings } from "@/lib/data/defaults";
import { DEFAULT_SHIP_CONFIG, stateCode, type ShipConfig } from "./rules";
const num = (v: unknown, d: number) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : d; };
/** Store-wide shipping numbers from admin -> Settings. */
export const shipConfigOf = (s: Pick<SiteSettings, "free_shipping_over" | "default_flat_rate">): ShipConfig => ({ freeOver: num(s.free_shipping_over, DEFAULT_SHIP_CONFIG.freeOver), defaultFlat: num(s.default_flat_rate, DEFAULT_SHIP_CONFIG.defaultFlat) });
/** The "ship from" (return) address, or null while it is not filled in. */
export function shipFromOf(s: SiteSettings): ShipAddress | null {
  const state = stateCode(s.ship_state), zip = (s.ship_zip ?? "").trim();
  if (!s.ship_street1?.trim() || !s.ship_city?.trim() || !state || !/^\d{5}(-\d{4})?$/.test(zip)) return null;
  return { name: (s.ship_name || s.store_name || "VEDAGLOW").trim(), company: s.ship_company?.trim() || undefined, street1: s.ship_street1.trim(), street2: s.ship_street2?.trim() || undefined, city: s.ship_city.trim(), state, zip, country: "US", phone: (s.ship_phone || s.phone || "").trim() || undefined, email: s.email?.trim() || undefined };
}
