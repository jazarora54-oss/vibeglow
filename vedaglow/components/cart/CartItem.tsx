"use client";
import { useState } from "react";
import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import type { CartItem as Item } from "@/types";
import { lineKey, useCart } from "@/components/CartProvider";
import QuantitySelector from "@/components/product/QuantitySelector";
import { money } from "@/lib/format";
import CartThumb from "./CartThumb";
export default function CartItem({ item }: { item: Item }) {
  const { setQuantity, removeItem, saveForLater, notify } = useCart(); const [confirm, setConfirm] = useState(false);
  const key = lineKey(item); const max = item.max_stock ?? 99; const out = max <= 0; const over = !out && item.quantity > max;
  return (
    <li className="rounded-2xl border border-forest/10 bg-white p-4 shadow-card sm:p-5">
      <div className="flex gap-4">
        <CartThumb item={item} className="h-20 w-20 sm:h-28 sm:w-28" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-4"><Link href={`/product/${item.slug}`} className="font-semibold text-forest hover:underline">{item.name}</Link><b className="text-forest">{money(item.unit_price * item.quantity)}</b></div>
          {item.variant_label && <p className="mt-0.5 text-sm text-ink/70">Variant: {item.variant_label}</p>}
          {item.sku && <p className="text-xs text-ink/50">SKU: {item.sku}</p>}
          <p className="mt-1 text-sm text-ink/60">{money(item.unit_price)} each</p>
          {out ? <p role="alert" className="mt-2 text-sm font-semibold text-red-700">⚠ OUT OF STOCK. Remove this item to continue.</p> : over ? <p role="alert" className="mt-2 text-sm font-semibold text-red-700">⚠ Only {max} available.</p> : max <= 5 && <p className="mt-1 text-xs font-medium text-gold-dark">Only {max} left in stock</p>}
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            {!out && <QuantitySelector value={item.quantity} max={max} onChange={q => setQuantity(key, q)} />}
            <button type="button" onClick={() => saveForLater(key)} className="flex items-center gap-1.5 text-sm font-medium text-forest hover:underline"><Heart size={15} />Save for Later</button>
            <button type="button" onClick={() => setConfirm(true)} aria-label={`Remove ${item.name}`} className="flex items-center gap-1.5 text-sm font-medium text-ink/60 hover:text-red-700"><Trash2 size={15} />{out ? "REMOVE ITEM" : "Remove"}</button>
          </div>
        </div>
      </div>
      {confirm && <div role="alertdialog" aria-label="Confirm removal" className="fade-in mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-cream-dark p-3 text-sm">
        <span className="font-medium">Remove this item from your cart?</span>
        <span className="flex gap-2"><button type="button" autoFocus onClick={() => setConfirm(false)} className="rounded-md border border-forest/30 px-4 py-2 font-semibold text-forest">Cancel</button>
          <button type="button" onClick={() => { removeItem(key); notify("Item removed."); }} className="rounded-md bg-red-700 px-4 py-2 font-semibold text-white">Remove</button></span></div>}
    </li>
  );
}
