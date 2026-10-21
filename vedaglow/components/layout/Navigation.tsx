import Link from "next/link";
import { ChevronDown } from "lucide-react";
export interface NavCat { slug: string; name: string }
export interface NavItem { label: string; href: string; dd?: boolean; hot?: boolean }
/** Menu = Home, Shop all, your categories (admin -> Categories), New arrivals, Sale. */
export const navItemsFrom = (cats: NavCat[]): NavItem[] => [
  { label: "HOME", href: "/" }, { label: "SHOP ALL", href: "/shop" },
  ...cats.map(c => ({ label: c.name.toUpperCase(), href: `/category/${c.slug}`, dd: true })),
  { label: "NEW ARRIVALS", href: "/new-arrivals" }, { label: "SALE", href: "/sale", hot: true },
];
export default function Navigation({ items }: { items: NavItem[] }) {
  return (
    <nav aria-label="Main" className="hidden bg-forest lg:block"><ul className="mx-auto flex max-w-7xl justify-between gap-2 px-6">
      {items.map((n, i) => (
        <li key={n.label}><Link href={n.href} className={`flex items-center gap-1 whitespace-nowrap border-b-2 py-3.5 text-[13px] font-semibold tracking-wide ${i === 0 ? "border-gold text-gold-light" : n.hot ? "border-transparent text-gold-light" : "border-transparent text-white hover:text-gold-light"}`}>
          {n.label}{n.dd && <ChevronDown size={13} />}{n.hot && <span className="ml-1 rounded-full bg-red-700 px-2 py-0.5 text-[10px] text-white">HOT</span>}</Link></li>))}
    </ul></nav>
  );
}
