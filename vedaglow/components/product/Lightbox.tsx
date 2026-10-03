"use client";
import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Product } from "@/types";
import GallerySlide, { type GalleryItem } from "./GallerySlide";
interface Props { product: Product; items: GalleryItem[]; index: number; onIndex: (i: number) => void; onClose: () => void }
export default function Lightbox({ product, items, index, onIndex, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null); const n = items.length;
  const go = (d: number) => onIndex((index + d + n) % n);
  useEffect(() => {
    closeRef.current?.focus(); const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
    window.addEventListener("keydown", k); return () => { window.removeEventListener("keydown", k); document.body.style.overflow = prev; };
  });
  const nav = "absolute top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-forest shadow-lift hover:bg-white";
  return (
    <div role="dialog" aria-modal="true" aria-label={`${product.name} image viewer`} className="fade-in fixed inset-0 z-[60] flex flex-col bg-forest/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-3 text-white sm:px-8">
        <span className="text-sm tracking-wide" aria-live="polite">{index + 1} / {n}</span>
        <p className="hidden truncate px-4 font-display text-xl sm:block">{product.name}</p>
        <button type="button" ref={closeRef} onClick={onClose} aria-label="Close image viewer" className="grid h-10 w-10 place-items-center rounded-full border border-white/40 hover:bg-white/10"><X /></button>
      </div>
      <div className="relative mx-auto min-h-0 w-full max-w-4xl flex-1 px-4 pb-2" onClick={e => e.target === e.currentTarget && onClose()}>
        <div key={index} className="fade-in mx-auto h-full max-h-full w-full overflow-hidden rounded-2xl"><GallerySlide product={product} item={items[index]} /></div>
        {n > 1 && <><button type="button" onClick={() => go(-1)} aria-label="Previous image" className={`${nav} left-6`}><ChevronLeft /></button><button type="button" onClick={() => go(1)} aria-label="Next image" className={`${nav} right-6`}><ChevronRight /></button></>}
      </div>
      <div className="flex justify-center gap-2 overflow-x-auto px-4 py-4">
        {items.map((it, i) => <button type="button" key={i} onClick={() => onIndex(i)} aria-label={`Show image ${i + 1}`} aria-current={i === index} className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${i === index ? "border-gold" : "border-transparent opacity-60 hover:opacity-100"}`}><GallerySlide product={product} item={it} /></button>)}
      </div>
    </div>
  );
}
