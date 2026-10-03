"use client";
import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { parseQuery, toParams, type ShopQuery } from "@/lib/shop";
/** Single source of truth for filter state: the URL. */
export function useShopUrl() {
  const sp = useSearchParams(); const pathname = usePathname(); const router = useRouter();
  const query = useMemo(() => parseQuery(Object.fromEntries(sp.entries())), [sp]);
  const update = useCallback((patch: Partial<ShopQuery>) => {
    const qs = toParams({ ...query, ...patch }).toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [query, pathname, router]);
  const clear = useCallback(() => { const q = toParams({ ...query, ...parseQuery({}), search: undefined, view: query.view, sort: query.sort }); const s = q.toString(); router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false }); }, [query, pathname, router]);
  return { query, update, clear, pathname };
}
