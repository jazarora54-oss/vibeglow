"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/lib/data/banners";
/** Homepage banner carousel driven by the admin panel. */
export default function BannerSlider({ banners }: { banners: Banner[] }) {
  const [i, setI] = useState(0); const n = banners.length;
  useEffect(() => { if (n < 2) return; const t = setInterval(() => setI(x => (x + 1) % n), 6000); return () => clearInterval(t); }, [n]);
  const b = banners[Math.min(i, n - 1)];
  return (
    <section className="relative overflow-hidden bg-cream-dark" aria-roledescription="carousel" aria-label="Featured offers">
      <div className="relative h-60 sm:h-80 lg:h-[26rem]">
        {banners.map((x, k) => (
          <div key={x.id} className={`absolute inset-0 transition-opacity duration-700 ${k === i ? "opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden={k !== i}>
            <img src={x.image_url} alt={x.title || "VEDAGLOW offer"} className="h-full w-full object-cover" loading={k === 0 ? "eager" : "lazy"} />
            {(x.title || x.subtitle || x.button_text) && <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />}
            {(x.title || x.subtitle || x.button_text) && <div className="absolute inset-0 mx-auto flex max-w-7xl flex-col justify-center px-6 text-white sm:px-10">
              {x.title && <h2 className="max-w-xl font-display text-3xl font-semibold leading-tight sm:text-5xl">{x.title}</h2>}
              {x.subtitle && <p className="mt-2 max-w-md text-sm sm:text-lg">{x.subtitle}</p>}
              {x.button_text && <Link href={x.button_link || "/shop"} className="mt-5 w-fit rounded-md bg-gold px-6 py-3 text-sm font-semibold tracking-wide text-white hover:bg-gold-dark">{x.button_text}</Link>}
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
