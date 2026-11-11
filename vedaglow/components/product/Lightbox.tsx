"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Product } from "@/types";
import GallerySlide, { buildGallery } from "./GallerySlide";
type Item = ReturnType<typeof buildGallery>[number];
/** Full-screen photo viewer. Closes with the X button, a click/tap on the dark area, or the Esc key. Arrow keys / swipe change the photo. */
export default function Lightbox({ product, items, index, onIndex, onClose }: { product: Product; items: Item[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const n = items.length; const [mounted, setMounted] = useState(false); const touchX = useRef<number | null>(null); const closeRef = useRef<HTMLButtonElement>(null);
  const step = useCallback((d: number) => { if (n > 1) onIndex((index + d + n) % n); }, [index, n, onIndex]);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); else if (e.key === "ArrowLeft") step(-1); else if (e.key === "ArrowRight") step(1); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden"; closeRef.current?.focus();
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose, step]);
  if (!mounted || !n) return null;
  const btn = "grid h-11 w-11 place-items-center rounded-full bg-white/90 text-forest shadow-lg hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold";
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Image viewer" onClick={onClose}
      onTouchStart={e => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={e => { if (touchX.current === null) return; const dx = e.changedTouches[0].clientX - touchX.current; touchX.current = null; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <button ref={closeRef} type="button" onClick={e => { e.stopPropagation(); onClose(); }} aria-label="Close image viewer" className={`${btn} absolute right-4 top-4 z-10`} style={{ top: "max(1rem, env(safe-area-inset-top))" }}><X size={22} /></button>
      <span className="absolute left-4 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-forest" style={{ top: "max(1.25rem, env(safe-area-inset-top))" }}>{index + 1} / {n}</span>
      <div onClick={e => e.stopPropagation()} className="relative aspect-square w-[min(92vw,72vh)] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <GallerySlide product={product} item={items[index]} />
      </div>
      {n > 1 && <>
        <button type="button" onClick={e => { e.stopPropagation(); step(-1); }} aria-label="Previous image" className={`${btn} absolute left-3 top-1/2 -translate-y-1/2`}><ChevronLeft size={22} /></button>
        <button type="button" onClick={e => { e.stopPropagation(); step(1); }} aria-label="Next image" className={`${btn} absolute right-3 top-1/2 -translate-y-1/2`}><ChevronRight size={22} /></button>
        <div onClick={e => e.stopPropagation()} className="mt-4 flex max-w-full gap-2 overflow-x-auto pb-1">
          {items.map((it, k) => <button type="button" key={k} onClick={() => onIndex(k)} aria-label={`Show image ${k + 1} of ${n}`} aria-current={k === index} className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 bg-white ${k === index ? "border-gold" : "border-white/30 opacity-80 hover:opacity-100"}`}><GallerySlide product={product} item={it} /></button>)}
        </div>
      </>}
      <p className="pointer-events-none mt-3 text-center text-xs text-white/70">Tap outside the picture or press Esc to close</p>
    </div>, document.body);
}
