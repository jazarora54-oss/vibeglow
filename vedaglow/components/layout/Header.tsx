"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, User, Heart, ShoppingCart, Menu, X } from "lucide-react";
import SearchBox from "./SearchBox";
import Navigation, { navItems } from "./Navigation";
import { useCart } from "@/components/CartProvider";
import { money } from "@/lib/format";
const Badge = ({ n }: { n: number }) => n > 0 ? <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-forest text-[11px] font-bold text-white">{n}</span> : null;
export default function Header() {
  const [open, setOpen] = useState(false); const [q, setQ] = useState(false);
  const { count, subtotal, wishlist, setMiniOpen } = useCart(); const path = usePathname(); const onCartPage = path === "/cart" || path === "/checkout";
  return (
    <header className="sticky top-0 z-40 bg-cream shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 sm:px-6 lg:gap-8">
        <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu /></button>
        <Link href="/" aria-label="VEDAGLOW home" className="mx-auto shrink-0 lg:mx-0"><Image src="/logo.png" alt="VEDAGLOW – Ancient Wisdom. Modern Glow." width={1024} height={1024} priority className="h-16 w-auto mix-blend-multiply sm:h-20" /></Link>
        <SearchBox className="hidden flex-1 lg:block" />
        <div className="flex items-center gap-4 sm:gap-6">
          <button className="lg:hidden" onClick={() => setQ(!q)} aria-label="Search"><Search size={22} /></button>
          <Link href="/account" className="flex items-center gap-2" aria-label="My account"><User size={24} strokeWidth={1.5} /><span className="hidden text-xs leading-tight xl:block">My Account<br /><span className="text-ink/60">Sign in / Register</span></span></Link>
          <Link href="/wishlist" className="relative flex items-center gap-2" aria-label="Wishlist"><Heart size={24} strokeWidth={1.5} /><Badge n={wishlist.length} /><span className="hidden text-xs xl:block">Wishlist</span></Link>
          {(() => { const inner = <><ShoppingCart size={24} strokeWidth={1.5} /><Badge n={count} /><span className="hidden text-xs leading-tight xl:block">Cart<br /><b>{money(subtotal)}</b></span></>;
            return onCartPage ? <Link href="/cart" className="relative flex items-center gap-2" aria-label={`Cart, ${count} items`}>{inner}</Link> : <button type="button" onClick={() => setMiniOpen(true)} className="relative flex items-center gap-2" aria-label={`Open cart, ${count} items`} aria-haspopup="dialog">{inner}</button>; })()}
        </div>
      </div>
      {q && <div className="px-4 pb-3 lg:hidden"><SearchBox autoFocus onDone={() => setQ(false)} /></div>}
      <Navigation />
      {open && <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
        <div className="absolute inset-y-0 left-0 w-72 bg-forest p-5 text-white"><button onClick={() => setOpen(false)} aria-label="Close menu" className="mb-4"><X /></button>
          <ul>{navItems.map(n => <li key={n.label}><Link onClick={() => setOpen(false)} href={n.href} className="block border-b border-white/10 py-3 text-sm font-semibold tracking-wide">{n.label}</Link></li>)}</ul></div></div>}
    </header>
  );
}
