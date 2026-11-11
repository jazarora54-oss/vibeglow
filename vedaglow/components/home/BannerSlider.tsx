"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/lib/data/banners";
import { isCloseShape } from "@/lib/imageFit";
const isVid = (u?: string | null) => !!u && /\.(mp4|webm)(\?|$)/i.test(u);
/** A banner picture that always fits its box. Pictures that are (nearly) the banner shape fill it. A different shape (e.g. an old
 *  square upload) is shown WHOLE in the middle on a blurred copy of itself, so nothing is cut off. */
function FitPicture({ x, eager }: { x: Banner; eager: boolean }) {
  const ref = useRef<HTMLImageElement>(null); const [contain, setContain] = useState(false); const [bg, setBg] = useState("");
  const measure = useCallback(() => { const im = ref.current; const box = im?.closest("[data-slide]") as HTMLElement | null; if (!im || !box || !im.naturalWidth || !box.clientWidth || !box.clientHeight) return; setContain(!isCloseShape(im.naturalWidth, im.naturalHeight, box.clientWidth, box.clientHeight)); setBg(im.currentSrc || im.src); }, []);
  useEffect(() => { measure(); window.addEventListener("resize", measure); return () => window.removeEventListener("resize", measure); }, [measure]);
  const alt = x.image_alt || x.title || "VEDAGLOW offer";
  return (<>
    {contain && bg && /* eslint-disable-next-line @next/next/no-img-element */ <img src={bg} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl" />}
    <picture>{x.mobile_image_url && !isVid(x.mobile_image_url) && <source media="(max-width: 639px)" srcSet={x.mobile_image_url} />}<img ref={ref} onLoad={measure} src={x.image_url} alt={alt} className={`relative h-full w-full ${contain ? "object-contain" : "object-cover"}`} loading={eager ? "eager" : "lazy"} /></picture>
  </>);
}
/** Homepage banner carousel driven by the admin panel. */
export default function BannerSlider({ banners }: { banners: Banner[] }) {
  const [i, setI] = useState(0); const n = banners.length;
  useEffect(() => { if (n < 2) return; const t = setInterval(() => setI(x => (x + 1) % n), 6000); return () => clearInterval(t); }, [n]);
  const allMobile = banners.every(x => x.mobile_image_url && !isVid(x.mobile_image_url)); // every banner has a phone picture -> use the tall phone shape
  return (
    <section className="relative overflow-hidden bg-cream-dark" aria-roledescription="carousel" aria-label="Featured offers">
      <div className={`relative ${allMobile ? "aspect-[750/950]" : "h-60"} sm:h-auto sm:aspect-[1920/650] sm:max-h-[40rem]`}>
        {banners.map((x, k) => (
          <div key={x.id} data-slide className={`absolute inset-0 overflow-hidden transition-opacity duration-700 ${k === i ? "opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden={k !== i}>
            {isVid(x.image_url) ? <video src={x.image_url} muted loop autoPlay playsInline preload={k === 0 ? "auto" : "metadata"} aria-label={x.image_alt || x.title || "VEDAGLOW offer"} className="h-full w-full object-cover" /> : <FitPicture x={x} eager={k === 0} />}
            {(x.title || x.subtitle || x.button_text) && <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />}
            {(x.title || x.subtitle || x.button_text) && <div className="absolute inset-0 mx-auto flex max-w-7xl flex-col justify-center px-6 text-white sm:px-10">
              {x.title && <h2 className="max-w-xl font-display text-3xl font-semibold leading-tight sm:text-5xl">{x.title}</h2>}
              {x.subtitle && <p className="mt-2 max-w-md text-sm sm:text-lg">{x.subtitle}</p>}
              {x.button_text && <Link href={x.button_link || "/shop"} className="mt-5 w-fit rounded-md bg-gold px-6 py-3 text-sm font-semibold tracking-wide text-ongold hover:bg-gold-dark">{x.button_text}</Link>}
            </div>}
            {!x.button_text && <Link href={x.button_link || "/shop"} className="absolute inset-0" aria-label={x.title || "View offer"} />}
          </div>))}
      </div>
      {n > 1 && <>
        <button type="button" onClick={() => setI((i - 1 + n) % n)} aria-label="Previous banner" className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-forest shadow hover:bg-white"><ChevronLeft /></button>
        <button type="button" onClick={() => setI((i + 1) % n)} aria-label="Next banner" className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-forest shadow hover:bg-white"><ChevronRight /></button>
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">{banners.map((x, k) => <button key={x.id} type="button" onClick={() => setI(k)} aria-label={`Banner ${k + 1}`} aria-current={k === i} className={`h-2.5 rounded-full transition-all ${k === i ? "w-6 bg-white" : "w-2.5 bg-white/60"}`} />)}</div>
      </>}
    </section>
  );
}
