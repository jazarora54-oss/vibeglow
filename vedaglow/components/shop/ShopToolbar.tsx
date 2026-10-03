"use client";
import { useState } from "react";
import { LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { activeFilterCount, type ShopLock } from "@/lib/shop";
import SortSelect from "./SortSelect";
import MobileFilterDrawer from "./MobileFilterDrawer";
import { useShopUrl } from "./useShopUrl";
export default function ShopToolbar({ count, lock }: { count: number; lock?: ShopLock }) {
  const [open, setOpen] = useState(false);
  const { query, update } = useShopUrl(); const n = activeFilterCount(query);
  const vb = (on: boolean) => `grid h-9 w-9 place-items-center rounded-md ${on ? "bg-forest text-white" : "text-forest hover:bg-forest-100"}`;
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-forest/10 bg-white px-4 py-3">
      <p className="text-sm" aria-live="polite"><b className="text-forest">{count}</b> product{count === 1 ? "" : "s"}</p>
      <div className="flex items-center gap-3">
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-md border border-forest px-3 py-2 text-xs font-semibold tracking-wide text-forest lg:hidden"><SlidersHorizontal size={15} />FILTER &amp; SORT{n > 0 && <span className="rounded-full bg-forest px-1.5 text-white">{n}</span>}</button>
        <SortSelect />
        <div className="hidden gap-1 sm:flex" role="group" aria-label="View">
          <button aria-label="Grid view" aria-pressed={query.view === "grid"} onClick={() => update({ view: "grid" })} className={vb(query.view === "grid")}><LayoutGrid size={17} /></button>
          <button aria-label="List view" aria-pressed={query.view === "list"} onClick={() => update({ view: "list" })} className={vb(query.view === "list")}><List size={17} /></button>
        </div>
      </div>
      <MobileFilterDrawer open={open} onClose={() => setOpen(false)} count={count} lock={lock} />
    </div>
  );
}
