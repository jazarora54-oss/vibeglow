import { calculateFreeShippingProgress } from "@/lib/cart/cartCalculations";
import { money } from "@/lib/format";
export default function ShippingProgress({ subtotal }: { subtotal: number }) {
  if (subtotal <= 0) return null; const p = calculateFreeShippingProgress(subtotal);
  return <div className="rounded-xl border border-gold/40 bg-white p-4">
    <p className="text-sm font-semibold text-forest">{p.qualifies ? "🎉 You qualify for FREE SHIPPING!" : <>You&apos;re {money(p.remaining)} away from FREE SHIPPING</>}</p>
    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-forest-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p.percent} aria-label="Progress to free shipping"><div className="h-full rounded-full bg-gold transition-all" style={{ width: `${p.percent}%` }} /></div>
  </div>;
}
