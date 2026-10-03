import type { Product } from "@/types";
import ProductImage from "./ProductImage";
export interface GalleryItem { src?: string; alt: string; view?: number }
const VIEWS = ["front view", "close-up", "angled view", "with natural ingredients"];
const TINT = ["#F3EDDF", "#E4EFE6", "#F5E9CF", "#EAF0DA"];
const XFORM = ["none", "scale(1.5) translateY(6%)", "rotate(-9deg) scale(.95)", "scale(.8)"];
/** Real photos from product.images; until they exist, 4 packshot views are generated. */
export function buildGallery(p: Product): GalleryItem[] {
  if (p.images.length) return p.images.map((src, i) => ({ src, alt: `${p.name} – image ${i + 1}` }));
  return VIEWS.map((v, i) => ({ alt: `${p.name} – ${v}`, view: i }));
}
export default function GallerySlide({ product, item, className = "" }: { product: Product; item: GalleryItem; className?: string }) {
  if (item.src) return <img src={item.src} alt={item.alt} className={`h-full w-full object-contain ${className}`} />;
  const v = item.view ?? 0;
  return (
    <div className={`grid h-full w-full place-items-center overflow-hidden ${className}`} style={{ background: TINT[v % 4] }} role="img" aria-label={item.alt}>
      <div className="h-[82%] w-[82%]" style={{ transform: XFORM[v % 4] }}><ProductImage product={product} className="h-full w-full drop-shadow-lg" /></div>
    </div>
  );
}
