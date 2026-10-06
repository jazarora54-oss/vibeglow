import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Youtube, Music2, Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { getSiteSettings } from "@/lib/data/site";
const cols = [
  { h: "Shop", l: [["Skin Care", "/category/skin-care"], ["Hair Care", "/category/hair-care"], ["Body Care", "/category/body-care"], ["Health & Wellness", "/category/health-wellness"], ["Oral Care", "/category/oral-care"], ["New Arrivals", "/new-arrivals"], ["Sale", "/sale"]] },
  { h: "Customer Care", l: [["Contact Us", "/contact"], ["Shipping", "/shipping"], ["Returns", "/returns"], ["FAQ", "/faq"], ["Track Order", "/track-order"]] },
  { h: "Information", l: [["About VEDAGLOW", "/about"], ["Privacy Policy", "/privacy"], ["Terms & Conditions", "/terms"], ["Refund Policy", "/refunds"]] },
];
/** Contact details and social links come from admin -> Settings. A social link only shows once you have filled it in. */
export default async function Footer() {
  const s = await getSiteSettings();
  const social = ([[Instagram, "Instagram", s.instagram], [Facebook, "Facebook", s.facebook], [Music2, "TikTok", s.tiktok], [Youtube, "YouTube", s.youtube]] as const).filter(x => x[2]);
  const wa = s.whatsapp.replace(/[^\d]/g, "");
  return (
    <footer className="bg-forest text-white/80"><div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-6">
      <div className="lg:col-span-2"><div className="inline-block rounded-xl bg-cream p-2"><Image src="/logo.png" alt={s.store_name} width={1024} height={1024} className="h-24 w-auto mix-blend-multiply" /></div>
        <p className="mt-4 font-display text-xl italic text-gold-light">{s.tagline}</p>
        <ul className="mt-4 space-y-2 text-sm">
          {s.email && <li><a href={`mailto:${s.email}`} className="flex items-center gap-2 hover:text-gold-light"><Mail size={16} />{s.email}</a></li>}
          {s.phone && <li><a href={`tel:${s.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-gold-light"><Phone size={16} />{s.phone}</a></li>}
          {wa && <li><a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-gold-light"><MessageCircle size={16} />WhatsApp</a></li>}
          {s.address && <li className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 shrink-0" /><span>{s.address}</span></li>}
          {s.hours && <li className="pl-6 text-white/60">{s.hours}</li>}
        </ul></div>
      {cols.map(c => <div key={c.h}><h3 className="mb-4 font-semibold text-white">{c.h}</h3><ul className="space-y-2 text-sm">{c.l.map(([t, h]) => <li key={t}><Link href={h} className="hover:text-gold-light">{t}</Link></li>)}</ul></div>)}
      <div><h3 className="mb-4 font-semibold text-white">Social</h3>
        {social.length ? <ul className="space-y-2 text-sm">{social.map(([I, n, url]) => <li key={n}><a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-gold-light"><I size={16} />{n}</a></li>)}</ul> : <p className="text-sm text-white/50">Follow us soon.</p>}</div>
    </div><div className="border-t border-white/10 py-5 text-center text-xs">© {new Date().getFullYear()} {s.store_name}. All rights reserved.</div></footer>
  );
}
