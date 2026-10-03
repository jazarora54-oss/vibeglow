import { BadgeCheck, Lock, RotateCcw, Truck } from "lucide-react";
const items = [[BadgeCheck, "Authentic Products"], [Lock, "Secure Checkout"], [RotateCcw, "Easy Returns"], [Truck, "Free Shipping on $49+"]] as const;
export default function TrustFeatures() {
  return <ul className="mx-auto mt-10 grid max-w-7xl grid-cols-2 gap-x-4 gap-y-3 rounded-2xl bg-cream-dark px-5 py-4 text-sm text-forest lg:grid-cols-4">
    {items.map(([I, t]) => <li key={t} className="flex items-center gap-2"><I size={18} strokeWidth={1.6} className="shrink-0 text-gold-dark" />{t}</li>)}</ul>;
}
