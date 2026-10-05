import type { Metadata } from "next";
import Link from "next/link";
import { LayoutDashboard, Package, Image as Img, Ticket, ShoppingBag, ExternalLink, LogOut } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { serverClient } from "@/lib/supabase/server";
import AdminSetup from "@/components/admin/AdminSetup";
import { signOut } from "./actions";
export const metadata: Metadata = { title: "VEDAGLOW Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
const nav = [{ href: "/admin", label: "Dashboard", I: LayoutDashboard }, { href: "/admin/products", label: "Products", I: Package }, { href: "/admin/banners", label: "Banners", I: Img }, { href: "/admin/coupons", label: "Coupons", I: Ticket }, { href: "/admin/orders", label: "Orders", I: ShoppingBag }];
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) return <div className="min-h-screen bg-cream"><AdminSetup /></div>;
  const { data: { user } } = await serverClient().auth.getUser();
  if (!user) return <div className="min-h-screen bg-cream">{children}</div>; // login page
  return (
    <div className="min-h-screen bg-cream text-ink lg:flex">
      <aside className="bg-forest text-white lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0">
        <div className="flex items-center justify-between px-5 py-4 lg:block"><p className="font-display text-2xl font-semibold tracking-wide">VEDAGLOW</p><p className="hidden text-xs text-white/60 lg:block">Admin panel</p></div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:overflow-visible">
          {nav.map(({ href, label, I }) => <Link key={href} href={href} className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-white/10"><I size={18} />{label}</Link>)}
          <Link href="/" target="_blank" className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-white/10"><ExternalLink size={18} />View website</Link>
          <form action={signOut}><button type="submit" className="flex w-full shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-white/10"><LogOut size={18} />Sign out</button></form>
        </nav>
      </aside>
      <div className="min-w-0 flex-1 p-4 sm:p-8">{children}</div>
    </div>
  );
}
