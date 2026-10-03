"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import type { Product } from "@/types";
import GallerySlide, { buildGallery } from "./GallerySlide";
import Lightbox from "./Lightbox";
import ProductBadges from "./ProductBadges";
export default function ProductGallery({ product }: { product: Product }) {
  const items = useMemo(() => buildGallery(product), [product]);
  const [i, setI] = useState(0); const [open, setOpen] = useState(false); const n = items.length;
  const step = (d: number) => setI((i + d + n) % n);
  const arrow = "absolute top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-forest shadow-card hover:bg-white";
  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-forest/10 bg-white shadow-card">
        <button type="button" onClick={() => setOpen(true)} aria-label="Open image viewer" className="block h-full w-full cursor-zoom-in">
          <div key={i} className="fade-in h-full w-full"><GallerySlide product={product} item={items[i]} /></div>
        </button>
        <div className="pointer-events-none absolute left-4 top-4"><ProductBadges product={product} /></div>
        <span className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-forest"><ZoomIn size={13} />{i + 1} / {n}</span>
        {n > 1 && <><button type="button" onClick={() => step(-1)} aria-label="Previous image" className={`${arrow} left-3`}><ChevronLeft size={20} /></button><button type="button" onClick={() => step(1)} aria-label="Next image" className={`${arrow} right-3`}><ChevronRight size={20} /></button></>}
      </div>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
        {items.map((it, k) => <button type="button" key={k} onClick={() => setI(k)} aria-label={`Show image ${k + 1} of ${n}`} aria-current={k === i} className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors sm:h-20 sm:w-20 ${k === i ? "border-gold" : "border-forest/10 hover:border-gold/60"}`}><GallerySlide product={product} item={it} /></button>)}
      </div>
      {open && <Lightbox product={product} items={items} index={i} onIndex={setI} onClose={() => setOpen(false)} />}
    </div>
  );
}
