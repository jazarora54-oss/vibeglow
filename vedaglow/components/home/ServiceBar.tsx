import { Truck, RotateCcw, ShieldCheck, Headset } from "lucide-react";
import { getSiteSettings } from "@/lib/data/site";
import { shipConfigOf } from "@/lib/shipping/settings";
import { money } from "@/lib/format";
const items = (freeOver: number) => [freeOver > 0 ? { i: Truck, t: "Fast & Free Shipping", s: `On orders over ${money(freeOver)}` } : { i: Truck, t: "Fast Shipping", s: "USPS, UPS & FedEx" }, { i: RotateCcw, t: "Easy Returns", s: "30 days return policy" }, { i: ShieldCheck, t: "Secure Payment", s: "100% secure checkout" }, { i: Headset, t: "24/7 Customer Support", s: "We're here to help" }];
export default async function ServiceBar() {
  const { freeOver } = shipConfigOf(await getSiteSettings());
  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6"><ul className="grid grid-cols-2 gap-5 rounded-2xl bg-cream-dark px-6 py-5 lg:grid-cols-4">
      {items(freeOver).map(({ i: I, t, s }) => <li key={t} className="flex items-center gap-3"><I size={30} strokeWidth={1.4} className="shrink-0 text-forest" /><span className="text-sm"><b className="block">{t}</b><span className="text-ink/60">{s}</span></span></li>)}
    </ul></section>
  );
}
