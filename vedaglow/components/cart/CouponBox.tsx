"use client";
import { useState } from "react";
import { Tag, X } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { COUPON_HINT } from "@/lib/cart/config";
export default function CouponBox({ idPrefix = "cpn" }: { idPrefix?: string }) {
  const { coupon, applyCoupon, removeCoupon } = useCart(); const [code, setCode] = useState(""); const [err, setErr] = useState("");
  if (coupon) return <div className="flex items-center justify-between rounded-lg bg-forest-100 px-4 py-3 text-sm"><span className="flex items-center gap-2 font-semibold text-forest"><Tag size={16} />{coupon.code} applied</span>
    <button type="button" onClick={removeCoupon} className="flex items-center gap-1 font-medium text-forest underline-offset-4 hover:underline"><X size={14} />Remove coupon</button></div>;
  return <form noValidate onSubmit={async e => { e.preventDefault(); if (!code.trim()) { setErr("Please enter a coupon code."); return; } const r = await applyCoupon(code); setErr(r.ok ? "" : r.message); if (r.ok) setCode(""); }}>
    <label htmlFor={`${idPrefix}-code`} className="text-sm font-semibold">Have a coupon?</label>
    <div className="mt-2 flex gap-2"><input id={`${idPrefix}-code`} value={code} onChange={e => { setCode(e.target.value); setErr(""); }} placeholder="Enter coupon code" autoComplete="off" aria-invalid={!!err} aria-describedby={`${idPrefix}-msg`} className="min-w-0 flex-1 rounded-lg border border-forest/20 bg-white px-3 py-3 text-sm uppercase placeholder:normal-case" />
      <button type="submit" className="rounded-lg bg-gold px-5 text-sm font-semibold text-white hover:bg-gold-dark">APPLY</button></div>
    <p id={`${idPrefix}-msg`} className={`mt-1.5 text-xs ${err ? "font-medium text-red-700" : "text-ink/50"}`}>{err ? `⚠ ${err}` : COUPON_HINT}</p>
  </form>;
}
