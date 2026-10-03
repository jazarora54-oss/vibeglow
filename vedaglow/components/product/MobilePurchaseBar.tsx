"use client";
import { useEffect, useState } from "react";
import { money } from "@/lib/format";
import { useSelection } from "./ProductSelection";
/** Shown on phones only (md:hidden) after the customer scrolls down. Uses the shared selection + existing cart. */
export default function MobilePurchaseBar() {
  const { price, out, add } = useSelection(); const [show, setShow] = useState(false);
  useEffect(() => { const on = () => setShow(window.scrollY > 420); on(); window.addEventListener("scroll", on, { passive: true }); return () => window.removeEventListener("scroll", on); }, []);
  if (!show) return null;
  return (
    <div className="fade-in fixed inset-x-0 bottom-0 z-40 border-t border-forest/10 bg-white/95 px-4 py-3 shadow-lift backdrop-blur md:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
      {/* right padding keeps clear of the floating assistant button */}
      <div className="flex items-center gap-4 pr-[4.5rem]"><span className="text-xl font-bold text-forest">{money(price)}</span>
        <button type="button" onClick={add} disabled={out} className="flex-1 rounded-lg bg-forest py-3 text-sm font-semibold tracking-wide text-white disabled:cursor-not-allowed disabled:bg-ink/30">{out ? "OUT OF STOCK" : "ADD TO CART"}</button></div>
    </div>
  );
}
