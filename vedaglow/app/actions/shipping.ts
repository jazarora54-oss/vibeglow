"use server";
import type { Address, ShippingOption } from "@/types";
import { getProducts } from "@/lib/data/products";
import { getSiteSettings } from "@/lib/data/site";
import { lineFromProduct } from "@/lib/shipping/rules";
import { shipConfigOf, shipFromOf } from "@/lib/shipping/settings";
import { quoteShipping } from "@/lib/shipping/quote";

type Line = { product_id: string; variant_id?: string; quantity: number };
export type ShippingQuote = { ok: boolean; options: ShippingOption[]; message?: string; needsAddress?: boolean };

/**
 * Checkout asks this for the shipping choices. Prices and weights come from the database here,
 * never from the browser, so a customer cannot change what they pay for shipping.
 */
export async function getShippingQuote(input: { items: Line[]; address?: Address; contact?: { email?: string; phone?: string } }): Promise<ShippingQuote> {
  try {
    const wanted = (input?.items ?? []).filter(l => l && typeof l.product_id === "string" && Number.isInteger(l.quantity) && l.quantity >= 1 && l.quantity <= 99).slice(0, 50);
    const [all, settings] = await Promise.all([getProducts(), getSiteSettings()]);
    const byId = new Map(all.map(p => [p.id, p]));
    let subtotal = 0; const lines = [];
    for (const w of wanted) {
      const p = byId.get(w.product_id); if (!p) continue;
      const v = w.variant_id ? p.variants?.find(x => x.id === w.variant_id) : undefined;
      subtotal += (v?.price ?? p.price) * w.quantity; lines.push(lineFromProduct(p, w.quantity));
    }
    const q = await quoteShipping({ lines, subtotal: Math.round(subtotal * 100) / 100, to: input.address, contact: input.contact, cfg: shipConfigOf(settings), from: shipFromOf(settings) });
    return { ok: q.ok, options: q.options, message: q.message, needsAddress: q.needsAddress };
  } catch (e) {
    console.error("getShippingQuote failed:", e instanceof Error ? e.message : e);
    return { ok: false, options: [], message: "We could not work out shipping right now. Please try again." };
  }
}
