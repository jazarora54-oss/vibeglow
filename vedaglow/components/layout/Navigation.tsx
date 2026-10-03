import Link from "next/link";
import { ChevronDown } from "lucide-react";
export const navItems = [
  { label: "HOME", href: "/" }, { label: "SHOP ALL", href: "/shop" }, { label: "SKIN CARE", href: "/category/skin-care", dd: true },
  { label: "HAIR CARE", href: "/category/hair-care", dd: true }, { label: "BODY CARE", href: "/category/body-care", dd: true },
  { label: "HEALTH & WELLNESS", href: "/category/health-wellness", dd: true }, { label: "ORAL CARE", href: "/category/oral-care", dd: true },
  { label: "NEW ARRIVALS", href: "/new-arrivals" }, { label: "SALE", href: "/sale", hot: true },
];
export default function Navigation() {
  return (
    <nav aria-label="Main" className="hidden bg-forest lg:block"><ul className="mx-auto flex max-w-7xl justify-between px-6">
      {navItems.map((n, i) => (
        <li key={n.label}><Link href={n.href} className={`flex items-center gap-1 border-b-2 py-3.5 text-[13px] font-semibold tracking-wide ${i === 0 ? "border-gold text-gold-light" : n.hot ? "border-transparent text-gold-light" : "border-transparent text-white hover:text-gold-light"}`}>
          {n.label}{n.dd && <ChevronDown size={13} />}{n.hot && <span className="ml-1 rounded-full bg-red-700 px-2 py-0.5 text-[10px] text-white">HOT</span>}</Link></li>))}
    </ul></nav>
  );
}
