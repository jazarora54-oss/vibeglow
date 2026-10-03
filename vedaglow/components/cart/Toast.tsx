"use client";
import { Check } from "lucide-react";
import { useCart } from "@/components/CartProvider";
export default function Toast() {
  const { toast } = useCart();
  return <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex justify-center px-4 md:bottom-6">
    {toast && <div key={toast.id} className="fade-in flex items-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-semibold text-white shadow-lift"><Check size={16} className="text-gold-light" />{toast.message}</div>}</div>;
}
