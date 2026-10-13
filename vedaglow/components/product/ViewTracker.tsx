"use client";
import { useEffect } from "react";
import { trackView } from "@/app/actions/store";
/** Counts one view per product per browser session (refreshing does not inflate the number). */
export default function ViewTracker({ productId }: { productId: string }) {
  useEffect(() => { try { const k = `vg:viewed:${productId}`; if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, "1"); } catch { /* storage blocked: count anyway */ } trackView(productId).catch(() => {}); }, [productId]);
  return null;
}
