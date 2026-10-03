"use client";
import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Product, ProductVariant } from "@/types";
import { percentOff } from "@/lib/format";
import { useCart } from "@/components/CartProvider";
/** One shared selection (variant + quantity) for the panel, product details and mobile bar. Uses the existing cart. */
interface Sel {
  product: Product; variant?: ProductVariant; price: number; compare?: number; pct: number; stock: number; sku?: string; out: boolean;
  qty: number; setQty: (n: number) => void; sizes: string[]; colors: string[]; choose: (kind: "size" | "color", v: string) => void;
  added: boolean; add: () => void; buyNow: () => void;
}
const Ctx = createContext<Sel | null>(null);
export const useSelection = () => { const c = useContext(Ctx); if (!c) throw new Error("useSelection outside provider"); return c; };
export function ProductSelectionProvider({ product, children }: { product: Product; children: ReactNode }) {
  const vs = product.variants ?? [];
  const [vid, setVid] = useState(vs.find(v => v.stock > 0)?.id ?? vs[0]?.id);
  const [rawQty, setRawQty] = useState(1); const [added, setAdded] = useState(false);
  const busy = useRef(false); const { addToCart } = useCart(); const router = useRouter();
  const variant = vs.find(v => v.id === vid);
  const stock = variant ? variant.stock : product.stock; const out = stock <= 0;
  const qty = out ? 0 : Math.max(1, Math.min(rawQty, stock)); // never exceeds the selected variant's stock
  const price = variant?.price ?? product.price; const compare = variant ? variant.compare_at_price : product.compare_at_price;
  const sizes = [...new Set(vs.map(v => v.size).filter(Boolean))] as string[];
  const colors = [...new Set(vs.map(v => v.color).filter(Boolean))] as string[];
  const choose = (kind: "size" | "color", val: string) => {
    const size = kind === "size" ? val : variant?.size, color = kind === "color" ? val : variant?.color;
    const pool = vs.filter(v => v[kind] === val); if (!pool.length) return;
    setVid((pool.find(v => v.size === size && v.color === color) ?? pool[0]).id); setAdded(false);
  };
  const add = () => { if (out) return; addToCart(product, { variant, quantity: qty }); setAdded(true); };
  const buyNow = () => { if (out || busy.current) return; busy.current = true; addToCart(product, { variant, quantity: qty, ensure: true }); router.push("/checkout"); setTimeout(() => { busy.current = false; }, 1500); };
  return <Ctx.Provider value={{ product, variant, price, compare, pct: percentOff(price, compare), stock, sku: variant?.sku ?? product.sku, out, qty, setQty: setRawQty, sizes, colors, choose, added, add, buyNow }}>{children}</Ctx.Provider>;
}
