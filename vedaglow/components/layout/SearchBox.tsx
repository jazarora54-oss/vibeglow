"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
/** Header search: sends the query to /shop?search=… (the shop page does the matching). */
export default function SearchBox({ className = "", autoFocus = false, onDone }: { className?: string; autoFocus?: boolean; onDone?: () => void }) {
  const [v, setV] = useState(""); const router = useRouter();
  return (
    <form role="search" className={`relative ${className}`} onSubmit={e => { e.preventDefault(); const t = v.trim(); router.push(t ? `/shop?search=${encodeURIComponent(t)}` : "/shop"); onDone?.(); }}>
      <input aria-label="Search products" autoFocus={autoFocus} value={v} onChange={e => setV(e.target.value)} placeholder="Search for products…" className="w-full rounded-lg border border-forest/20 bg-white py-3 pl-4 pr-14 text-sm" />
      <button aria-label="Search" className="absolute right-1 top-1 grid h-10 w-11 place-items-center rounded-md bg-gold text-white"><Search size={18} /></button>
    </form>
  );
}
