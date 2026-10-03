"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { CartItem, Coupon, Product, ProductVariant } from "@/types";
import { calculateItemCount, calculateSubtotal, findCoupon } from "@/lib/cart/cartCalculations";
export interface AddOptions { variant?: ProductVariant; quantity?: number; ensure?: boolean } // ensure: line quantity becomes max(existing, quantity) instead of adding on top
type Toast = { id: number; message: string } | null;
interface Ctx {
  items: CartItem[]; count: number; subtotal: number; wishlist: string[]; ready: boolean;
  coupon: Coupon | null; applyCoupon: (code: string) => { ok: boolean; message: string }; removeCoupon: () => void;
  addToCart: (p: Product, opts?: AddOptions) => void; setQuantity: (key: string, q: number) => void; removeItem: (key: string) => void;
  saveForLater: (key: string) => void; syncStock: (stock: Record<string, number>) => void; clearCart: () => void;
  toggleWishlist: (id: string) => void;
  miniOpen: boolean; setMiniOpen: (o: boolean) => void; toast: Toast; notify: (message: string) => void;
}
const C = createContext<Ctx | null>(null);
export const lineKey = (i: Pick<CartItem, "product_id" | "variant_id">) => `${i.product_id}:${i.variant_id ?? "-"}`;
const STORE = "vedaglow:cart:v1"; // cart + wishlist + coupon code (never payment data)
// Persists to localStorage (loaded after mount so server/client HTML match). Later: Supabase for signed-in customers.
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [miniOpen, setMiniOpen] = useState(false);
  const [toast, setToast] = useState<Toast>(null); const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(STORE) ?? "null");
      if (s) { if (Array.isArray(s.items)) setItems(s.items); if (Array.isArray(s.wishlist)) setWishlist(s.wishlist); if (typeof s.coupon === "string") setCouponCode(s.coupon); }
    } catch { /* ignore corrupt storage */ }
    setReady(true);
  }, []);
  useEffect(() => { if (!ready) return; try { localStorage.setItem(STORE, JSON.stringify({ items, wishlist, coupon: couponCode })); } catch { /* storage unavailable */ } }, [items, wishlist, couponCode, ready]);
  useEffect(() => { const on = (e: StorageEvent) => { if (e.key === STORE && e.newValue) { try { const s = JSON.parse(e.newValue); setItems(s.items ?? []); setWishlist(s.wishlist ?? []); setCouponCode(s.coupon ?? null); } catch { /* ignore */ } } }; window.addEventListener("storage", on); return () => window.removeEventListener("storage", on); }, []);
  const notify = useCallback((message: string) => { clearTimeout(timer.current); setToast({ id: Date.now(), message }); timer.current = setTimeout(() => setToast(null), 3200); }, []);
  const addToCart = (p: Product, { variant, quantity = 1, ensure = false }: AddOptions = {}) => {
    const line: CartItem = { product_id: p.id, variant_id: variant?.id, quantity, unit_price: variant?.price ?? p.price, slug: p.slug, name: p.name, image: p.images[0], visual: p.visual, variant_label: variant?.label, sku: variant?.sku ?? p.sku, max_stock: variant?.stock ?? p.stock };
    setItems(prev => {
      const k = lineKey(line); const hit = prev.find(i => lineKey(i) === k);
      if (!hit) return [...prev, { ...line, quantity: Math.min(quantity, line.max_stock ?? quantity) }];
      return prev.map(i => lineKey(i) === k ? { ...i, max_stock: line.max_stock, quantity: Math.min(ensure ? Math.max(i.quantity, quantity) : i.quantity + quantity, line.max_stock ?? Infinity) } : i);
    });
  };
  const setQuantity = (key: string, q: number) => setItems(prev => prev.map(i => lineKey(i) === key ? { ...i, quantity: Math.max(1, Math.min(q, i.max_stock && i.max_stock > 0 ? i.max_stock : 1)) } : i));
  const removeItem = (key: string) => setItems(prev => prev.filter(i => lineKey(i) !== key));
  const saveForLater = (key: string) => {
    const it = items.find(i => lineKey(i) === key); if (!it) return;
    setWishlist(w => w.includes(it.product_id) ? w : [...w, it.product_id]); // wishlist is per product: variant choice is not kept
    removeItem(key); notify("Saved to your wishlist.");
  };
  const syncStock = (stock: Record<string, number>) => setItems(prev => {
    let changed = false;
    const next = prev.map(i => { const s = stock[lineKey(i)]; if (s === undefined || (s === i.max_stock && (s <= 0 || i.quantity <= s))) return i; changed = true; return { ...i, max_stock: s, quantity: s > 0 ? Math.min(i.quantity, s) : i.quantity }; });
    return changed ? next : prev;
  });
  const clearCart = () => { setItems([]); setCouponCode(null); };
  const toggleWishlist = (id: string) => setWishlist(w => w.includes(id) ? w.filter(x => x !== id) : [...w, id]);
  const coupon = couponCode ? findCoupon(couponCode) ?? null : null;
  const subtotal = calculateSubtotal(items); const count = calculateItemCount(items);
  const applyCoupon = (code: string) => {
    const c = findCoupon(code); if (!c) return { ok: false, message: "Invalid coupon code." };
    if (c.min_subtotal && subtotal < c.min_subtotal) return { ok: false, message: `This coupon needs a subtotal of at least $${c.min_subtotal}.` };
    setCouponCode(c.code); notify("Coupon applied."); return { ok: true, message: "Coupon applied." };
  };
  const removeCoupon = () => { setCouponCode(null); notify("Coupon removed."); };
  return <C.Provider value={{ items, count, subtotal, wishlist, ready, coupon, applyCoupon, removeCoupon, addToCart, setQuantity, removeItem, saveForLater, syncStock, clearCart, toggleWishlist, miniOpen, setMiniOpen, toast, notify }}>{children}</C.Provider>;
}
export const useCart = () => { const c = useContext(C); if (!c) throw new Error("useCart outside CartProvider"); return c; };
