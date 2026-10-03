"use client";
import type { ShopLock } from "@/lib/shop";
import ProductFilters from "./ProductFilters";
import { useShopUrl } from "./useShopUrl";
export default function FilterSidebar({ lock }: { lock?: ShopLock }) {
  const { query, update, clear } = useShopUrl();
  return <aside aria-label="Filters" className="hidden w-64 shrink-0 lg:block"><div className="sticky top-32 rounded-2xl border border-forest/10 bg-white p-5 shadow-card"><ProductFilters query={query} onChange={update} onClear={clear} lock={lock} /></div></aside>;
}
