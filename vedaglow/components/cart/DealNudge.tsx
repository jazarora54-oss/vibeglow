"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Gift, X } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { dealNudges } from "@/lib/cart/deals";
/** Pop-up that opens when the cart gets one step away from a "Buy X Get Y" sale (admin -> Deals): "Add 1 more and get it FREE". */
export default function DealNudge() {
  const { items, deals, ready, setQuantity } = useCart(); const [open, setOpen] = useState(false); const seen = useRef<string | null>(null);
  const n = dealNudges(items, deals)[0]; const sig = n ? `${n.title}|${n.key}|${n.need}|${items.reduce((s, i) => s + i.quantity, 0)}` : "";
  useEffect(() => {
    if (!ready) return;
    if (seen.current === null) { seen.current = sig; return; } // what was already in the cart when the page opened does not pop up
    if (sig && sig !== seen.current) setOpen(true); else if (!sig) setOpen(false);
    seen.current = sig;
  }, [sig, ready]);
  if (!open || !n) return null;
  const line = items.find(i => `${i.product_id}:${i.variant_id ?? "-"}` === n.key);
  return <div role="dialog" aria-label="Sale offer" className="fixed inset-x-3 bottom-24 z-[70] mx-auto max-w-sm overflow-hidden rounded-2xl bg-cream shadow-lift md:bottom-6 md:left-auto md:right-6 md:mx-0">
    <div className="flex items-start gap-3 bg-forest px-4 py-3 text-onforest"><Gift className="mt-0.5 shrink-0 text-goldonforest" size={22} />
      <div className="flex-1"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-goldonforest">{n.title}</p><p className="font-display text-xl font-semibold leading-tight">{n.text}!</p></div>
      <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="rounded p-1 hover:bg-white/10"><X size={18} /></button></div>
    <div className="flex flex-wrap gap-2 px-4 py-3">
      {n.canAdd && line && <button type="button" className="flex-1 rounded-lg bg-forest px-4 py-2.5 text-sm font-semibold text-onforest hover:bg-forest-500" onClick={() => { setQuantity(n.key, line.quantity + n.need); setOpen(false); }}>Yes, add {n.need} more</button>}
      <Link href="/shop" onClick={() => setOpen(false)} className="flex-1 rounded-lg border border-forest/30 px-4 py-2.5 text-center text-sm font-semibold text-forest">{n.canAdd ? "Choose another" : "Shop more"}</Link>
      <button type="button" onClick={() => setOpen(false)} className="w-full text-center text-xs text-ink/50 underline">No thanks</button></div></div>;
}
