import type { ShippingOption } from "@/types";
import { deliveryRange } from "@/lib/shipping/rules";
import { money } from "@/lib/format";
export type QuoteState = { status: "idle" | "loading" | "ready" | "error"; message?: string; needsAddress?: boolean };
/** Shipping choices. Prices come from the server (carrier rates for the customer's address, or the product's free / flat setting). */
export default function DeliveryMethod({ state, options, value, onChange, handlingDays }: { state: QuoteState; options: ShippingOption[]; value: string; onChange: (id: string) => void; handlingDays: number }) {
  return <fieldset className="rounded-2xl border border-forest/10 bg-white p-5 shadow-card"><legend className="sr-only">Delivery method</legend>
    <h2 className="mb-4 font-display text-2xl font-semibold text-forest">DELIVERY METHOD</h2>
    <div aria-live="polite">
      {state.status === "loading" && !options.length && <p className="text-sm text-ink/60">Getting shipping prices…</p>}
      {state.status === "error" && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">⚠ {state.message}</p>}
      {state.status !== "error" && !options.length && state.status !== "loading" && <p className="rounded-lg bg-cream p-3 text-sm text-ink/70">{state.message ?? "Enter your shipping address above to see your shipping options."}</p>}
    </div>
    {options.length > 0 && <div className="space-y-3">{options.map(o => { const on = value === o.id;
      return <label key={o.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 ${on ? "border-forest bg-forest-100" : "border-forest/15"}`}>
        <input type="radio" name="delivery" checked={on} onChange={() => onChange(o.id)} className="h-4 w-4 accent-forest" />
        <span className="flex-1"><b className="block text-sm">{o.name}</b><span className="text-xs text-ink/60">Estimated delivery: {deliveryRange(handlingDays, o.days_min, o.days_max)}{o.estimated ? " · estimated rate" : ""}</span></span>
        <b className="text-sm">{o.price === 0 ? "FREE" : money(o.price)}</b></label>; })}</div>}
    {options.length > 0 && <p className="mt-3 text-xs text-ink/50">Delivery dates are estimates and include {handlingDays} business day{handlingDays === 1 ? "" : "s"} to pack your order.</p>}
  </fieldset>;
}
