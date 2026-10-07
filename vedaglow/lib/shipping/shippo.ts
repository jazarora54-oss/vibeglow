import type { Parcel, RateOption, ShipAddress } from "@/types";

/**
 * Server only (never import this from a client component).
 * Shippo connection (one account -> USPS, UPS, FedEx rates and labels).
 * Needs the secret env var SHIPPO_API_KEY (Netlify -> Environment variables).
 *   shippo_test_...  = test mode (free, labels are NOT real)
 *   shippo_live_...  = real labels, real money
 */
const BASE = "https://api.goshippo.com";
export const shippoMode = (): "off" | "test" | "live" => { const k = process.env.SHIPPO_API_KEY ?? ""; return !k ? "off" : k.startsWith("shippo_test_") ? "test" : "live"; };
export const shippoConfigured = () => shippoMode() !== "off";

const errText = (j: any): string => {
  if (!j) return "";
  const parts: string[] = [];
  if (typeof j.detail === "string") parts.push(j.detail);
  if (Array.isArray(j.messages)) j.messages.forEach((m: any) => m?.text && parts.push(String(m.text)));
  if (typeof j === "object") for (const [k, v] of Object.entries(j)) if (Array.isArray(v) && v.every(x => typeof x === "string") && !["messages", "rates"].includes(k)) parts.push(`${k}: ${(v as string[]).join(" ")}`);
  return [...new Set(parts)].join(" ").slice(0, 400);
};
async function shippo(path: string, body?: unknown): Promise<any> {
  const key = process.env.SHIPPO_API_KEY; if (!key) throw new Error("Shippo is not connected yet (SHIPPO_API_KEY is missing).");
  const res = await fetch(BASE + path, { method: body ? "POST" : "GET", headers: { Authorization: `ShippoToken ${key}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, cache: "no-store", signal: AbortSignal.timeout(20000) });
  const text = await res.text(); let json: any = null; try { json = JSON.parse(text); } catch { /* not JSON */ }
  if (!res.ok) throw new Error(errText(json) || `Shippo returned an error (${res.status}).`);
  return json;
}
const addr = (a: ShipAddress) => ({ name: a.name, company: a.company || undefined, street1: a.street1, street2: a.street2 || undefined, city: a.city, state: a.state, zip: a.zip, country: a.country || "US", phone: a.phone || undefined, email: a.email || undefined });
const niceService = (provider: string, name: string) => { const n = String(name ?? "").replace(/®|™/g, "").trim(); return n.toLowerCase().startsWith(provider.toLowerCase()) ? n.slice(provider.length).trim() || n : n; };

/** All carrier prices for one parcel, cheapest first. Throws a readable message when Shippo refuses. */
export async function getShippoRates(from: ShipAddress, to: ShipAddress, parcel: Parcel): Promise<RateOption[]> {
  const sh = await shippo("/shipments/", { address_from: addr(from), address_to: addr(to), parcels: [{ length: String(parcel.l), width: String(parcel.w), height: String(parcel.h), distance_unit: "in", weight: String(parcel.weight_oz), mass_unit: "oz" }], async: false });
  const rates: any[] = Array.isArray(sh?.rates) ? sh.rates : [];
  const out: RateOption[] = rates.filter(r => r && (r.currency ?? "USD") === "USD" && Number(r.amount) > 0).map(r => {
    const provider = String(r.provider ?? "").trim();
    return { rate_id: String(r.object_id), carrier: provider, service: niceService(provider, r.servicelevel?.name ?? ""), amount: Math.round(Number(r.amount) * 100) / 100, days: r.estimated_days != null ? Number(r.estimated_days) : undefined, terms: r.duration_terms ? String(r.duration_terms) : undefined };
  });
  if (!out.length) throw new Error(errText(sh) || "No carrier rates came back for this address and parcel. Check the addresses and the package size.");
  return out.sort((a, b) => a.amount - b.amount);
}
/** The stable id for a carrier service (the same service gets the same id on every quote, unlike Shippo's one-time rate ids). */
export const rateKey = (r: RateOption) => `${r.carrier}:${r.service}`.toLowerCase().replace(/[^a-z0-9:]+/g, "-");

/** Re-reads one rate from Shippo (price + service) so the amount we record is Shippo's, not the browser's. */
export async function getShippoRate(rateId: string): Promise<RateOption> {
  const r = await shippo(`/rates/${encodeURIComponent(rateId)}`);
  const provider = String(r?.provider ?? ""); return { rate_id: String(r.object_id), carrier: provider, service: niceService(provider, r?.servicelevel?.name ?? ""), amount: Math.round(Number(r.amount) * 100) / 100, days: r.estimated_days != null ? Number(r.estimated_days) : undefined };
}
export interface BoughtLabel { transaction_id: string; tracking_number: string; tracking_url: string; label_url: string }
/** Buys the label (this charges your Shippo account in live mode). */
export async function buyShippoLabel(rateId: string): Promise<BoughtLabel> {
  let t = await shippo("/transactions/", { rate: rateId, label_file_type: "PDF_4x6", async: false });
  for (let i = 0; i < 6 && t && (t.status === "QUEUED" || t.status === "WAITING"); i++) { await new Promise(r => setTimeout(r, 1200)); t = await shippo(`/transactions/${t.object_id}`); }
  if (!t || t.status !== "SUCCESS") throw new Error(errText(t) || "Shippo could not create the label.");
  return { transaction_id: String(t.object_id), tracking_number: String(t.tracking_number ?? ""), tracking_url: String(t.tracking_url_provider ?? ""), label_url: String(t.label_url ?? "") };
}
