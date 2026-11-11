"use client";
import { useEffect } from "react";
import { track } from "@/lib/analytics";
/** Tells Analytics / Pixel that a product page was viewed (only if the visitor accepted cookies). */
export default function TrackViewItem({ id, name, price }: { id: string; name: string; price: number }) {
  useEffect(() => { track("view_item", { value: price, items: [{ id, name, price }] }); }, [id, name, price]);
  return null;
}
