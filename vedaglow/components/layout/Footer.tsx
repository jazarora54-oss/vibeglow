import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Youtube, Music2 } from "lucide-react";
const cols = [
  { h: "Shop", l: [["Skin Care", "/category/skin-care"], ["Hair Care", "/category/hair-care"], ["Body Care", "/category/body-care"], ["Health & Wellness", "/category/health-wellness"], ["Oral Care", "/category/oral-care"], ["New Arrivals", "/new-arrivals"], ["Sale", "/sale"]] },
  { h: "Customer Care", l: [["Contact Us", "/contact"], ["Shipping", "/shipping"], ["Returns", "/returns"], ["FAQ", "/faq"], ["Track Order", "/track-order"]] },
  { h: "Information", l: [["About VEDAGLOW", "/about"], ["Privacy Policy", "/privacy"], ["Terms & Conditions", "/terms"], ["Refund Policy", "/refunds"]] },
];
const social = [[Instagram, "Instagram"], [Facebook, "Facebook"], [Music2, "TikTok"], [Youtube, "YouTube"]] as const;
export default function Footer() {
  return (
    <footer className="bg-forest text-white/80"><div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-6">
      <div className="lg:col-span-2"><div className="inline-block rounded-xl bg-cream p-2"><Image src="/logo.png" alt="VEDAGLOW" width={1024} height={1024} className="h-24 w-auto mix-blend-multiply" /></div>
        <p className="mt-4 font-display text-xl italic text-gold-light">Ancient Wisdom. Modern Glow.</p></div>
      {cols.map(c => <div key={c.h}><h3 className="mb-4 font-semibold text-white">{c.h}</h3><ul className="space-y-2 text-sm">{c.l.map(([t, h]) => <li key={t}><Link href={h} className="hover:text-gold-light">{t}</Link></li>)}</ul></div>)}
      <div><h3 className="mb-4 font-semibold text-white">Social</h3><ul className="space-y-2 text-sm">{social.map(([I, n]) => <li key={n}><a href="#" className="flex items-center gap-2 hover:text-gold-light"><I size={16} />{n}</a></li>)}</ul></div>
    </div><div className="border-t border-white/10 py-5 text-center text-xs">© {new Date().getFullYear()} VEDAGLOW. All rights reserved.</div></footer>
  );
}
