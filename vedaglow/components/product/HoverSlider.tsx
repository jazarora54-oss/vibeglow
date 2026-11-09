"use client";
import { useEffect, useRef, useState } from "react";
import type { Product } from "@/types";
import ProductImage from "./ProductImage";
/** Product picture for cards. With 2+ photos, the pictures slide by themselves while the mouse (or keyboard focus) is on the card; they return to the first picture when it leaves. Respects "reduce motion". */
export default function HoverSlider({ product, className = "" }: { product: Product; className?: string }) {
  const imgs = (product.images ?? []).filter(Boolean).slice(0, 5); const n = imgs.length; const [i, setI] = useState(0); const [on, setOn] = useState(false); const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stop = () => { if (timer.current) clearInterval(timer.current); timer.current = null; setOn(false); setI(0); };
  const start = () => { if (n < 2 || timer.current) return; if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setI(1); setOn(true); return; }
    setOn(true); setI(1); timer.current = setInterval(() => setI(x => (x + 1) % n), 1300); };
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);
  if (n < 2) return <div className="overflow-hidden"><ProductImage product={product} className={`${className} transition-transform duration-500 ease-out group-hover:scale-105`} /></div>;
  return (<div className={`relative overflow-hidden ${className}`} onMouseEnter={start} onMouseLeave={stop} onFocus={start} onBlur={stop} data-sliding={on}>
    <div className="flex h-full w-full transition-transform duration-700 ease-out motion-reduce:transition-none" style={{ transform: `translateX(-${i * 100}%)` }}>
      {imgs.map((src, k) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={src + k} src={src} alt={k === 0 ? product.name : ""} aria-hidden={k === 0 ? undefined : true} loading="lazy" decoding="async" className="h-full w-full shrink-0 object-contain" />)}</div>
    {on && n > 1 && <div aria-hidden="true" className="pointer-events-none absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-1">{imgs.map((_, k) => <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-4 bg-gold" : "w-1.5 bg-forest/25"}`} />)}</div>}
  </div>);
}
