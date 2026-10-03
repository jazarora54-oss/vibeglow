"use client";
import { X } from "lucide-react";
import type { ShopLock } from "@/lib/shop";
import ProductFilters from "./ProductFilters";
import { useShopUrl } from "./useShopUrl";
export default function MobileFilterDrawer({ open, onClose, count, lock }: { open: boolean; onClose: () => void; count: number; lock?: ShopLock }) {
  const { query, update, clear } = useShopUrl();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filter and sort">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col bg-cream">
        <div className="flex items-center justify-between bg-forest px-5 py-4 text-white"><b className="font-display text-xl">Filter &amp; Sort</b><button onClick={onClose} aria-label="Close filters"><X /></button></div>
        <div className="flex-1 overflow-y-auto p-5"><ProductFilters query={query} onChange={update} onClear={clear} lock={lock} /></div>
        <div className="border-t border-forest/10 bg-white p-4"><button onClick={onClose} className="w-full rounded-md bg-forest py-3 text-sm font-semibold text-white">SHOW {count} PRODUCT{count === 1 ? "" : "S"}</button></div>
      </div>
    </div>
  );
}
