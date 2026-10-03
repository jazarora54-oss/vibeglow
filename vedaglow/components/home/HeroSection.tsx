import Link from "next/link";
import { Leaf, PawPrint, BadgeCheck } from "lucide-react";
import type { Product } from "@/types";
import ProductImage from "@/components/product/ProductImage";
const trust = [{ icon: Leaf, t: "Natural Ingredients", s: "100% safe & natural" }, { icon: PawPrint, t: "Cruelty Free", s: "Not tested on animals" }, { icon: BadgeCheck, t: "Premium Quality", s: "Trusted & certified" }];
export default function HeroSection({ products }: { products: Product[] }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#EAF0DA] via-[#F4F1DE] to-[#DDE8CC]">
      <div className="mx-auto grid max-w-7xl items-center gap-6 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:py-16">
        <div>
          <h1 className="font-display text-5xl font-semibold leading-[1.02] text-forest sm:text-6xl lg:text-7xl">Ancient Wisdom.<br /><span className="text-gold-dark">Modern Glow.</span></h1>
          <p className="mt-5 max-w-md text-lg text-ink/80">Pure, natural &amp; effective beauty and wellness products for your daily care.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/shop" className="rounded-md bg-forest px-7 py-3.5 text-sm font-semibold tracking-wide text-white hover:bg-forest-500">SHOP NOW</Link>
            <Link href="/new-arrivals" className="rounded-md border border-gold bg-white/60 px-7 py-3.5 text-sm font-semibold tracking-wide text-forest hover:bg-white">NEW ARRIVALS</Link>
          </div>
          <ul className="mt-9 grid gap-4 sm:grid-cols-3">
            {trust.map(({ icon: I, t, s }) => (
              <li key={t} className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/60 bg-white/70 text-forest"><I size={20} /></span>
                <span className="text-sm"><b className="block text-forest">{t}</b><span className="text-ink/60">{s}</span></span>
              </li>))}
          </ul>
        </div>
        <div className="relative mx-auto flex w-full max-w-xl items-end justify-center gap-1 pt-6 sm:gap-3" aria-hidden="true">
          <div className="absolute inset-x-6 bottom-0 h-24 rounded-[50%] bg-forest/10 blur-xl" />
          <div className="absolute left-1/2 top-2 h-64 w-64 -translate-x-1/2 rounded-full border-[3px] border-gold/50 sm:h-80 sm:w-80" />
          {products.slice(0, 4).map((p, i) => <ProductImage key={p.id} product={p} className={`relative w-1/4 ${i % 2 ? "" : "mb-6"} ${i === 1 ? "scale-110" : ""} drop-shadow-xl`} />)}
        </div>
      </div>
    </section>
  );
}
