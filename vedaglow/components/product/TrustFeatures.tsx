import { BadgeCheck, Lock, RotateCcw, Truck } from "lucide-react";
import { getSiteSettings } from "@/lib/data/site";
import { shipConfigOf } from "@/lib/shipping/settings";
import { money } from "@/lib/format";
export default async function TrustFeatures() {
  const { freeOver } = shipConfigOf(await getSiteSettings());
  const items = [[BadgeCheck, "Authentic Products"], [Lock, "Secure Checkout"], [RotateCcw, "Easy Returns"], [Truck, freeOver > 0 ? `Free Shipping on ${money(freeOver)}+` : "Tracked Shipping"]] as const;
  return <ul className="mx-auto mt-10 grid max-w-7xl grid-cols-2 gap-x-4 gap-y-3 rounded-3xl border border-gold/30 bg-gradient-to-r from-cream-dark via-white to-cream-dark px-6 py-5 text-sm font-medium text-forest shadow-sm lg:grid-cols-4">
    {items.map(([I, t]) => <li key={t} className="flex items-center gap-2"><I size={18} strokeWidth={1.6} className="shrink-0 text-gold-dark" />{t}</li>)}</ul>;
}
