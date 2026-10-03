import { SHIPPING_METHODS } from "@/lib/cart/config";
import { calculateShipping } from "@/lib/cart/cartCalculations";
import { money } from "@/lib/format";
export default function DeliveryMethod({ subtotal, value, onChange }: { subtotal: number; value: string; onChange: (id: string) => void }) {
  return <fieldset className="rounded-2xl border border-forest/10 bg-white p-5 shadow-card"><legend className="sr-only">Delivery method</legend>
    <h2 className="mb-4 font-display text-2xl font-semibold text-forest">DELIVERY METHOD</h2>
    <div className="space-y-3">{SHIPPING_METHODS.map(m => { const p = calculateShipping(subtotal, m); const on = value === m.id;
      return <label key={m.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 ${on ? "border-forest bg-forest-100" : "border-forest/15"}`}>
        <input type="radio" name="delivery" checked={on} onChange={() => onChange(m.id)} className="h-4 w-4 accent-forest" />
        <span className="flex-1"><b className="block text-sm">{m.name}</b><span className="text-xs text-ink/60">Estimated delivery: {m.eta}. {m.description}</span></span>
        <b className="text-sm">{p === 0 ? "FREE" : money(p)}</b></label>; })}</div></fieldset>;
}
