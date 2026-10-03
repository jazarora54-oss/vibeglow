"use client";
import { SORT_OPTIONS, type SortKey } from "@/lib/shop";
import { useShopUrl } from "./useShopUrl";
export default function SortSelect() {
  const { query, update } = useShopUrl();
  return (
    <label className="flex items-center gap-2 text-sm"><span className="hidden text-ink/60 sm:inline">Sort by</span>
      <select value={query.sort} onChange={e => update({ sort: e.target.value as SortKey })} className="rounded-md border border-forest/20 bg-white py-2 pl-3 pr-8 text-sm font-medium">
        {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
  );
}
