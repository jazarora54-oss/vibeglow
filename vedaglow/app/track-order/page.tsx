import type { Metadata } from "next";
import TrackOrderForm from "@/components/pages/TrackOrderForm";
export const metadata: Metadata = { title: "Track Your Order | VEDAGLOW", alternates: { canonical: "/track-order" } };
export default function Page() {
  return <div className="mx-auto max-w-xl px-4 py-12 sm:px-6"><h1 className="mb-2 font-display text-5xl font-semibold text-forest">Track Your Order</h1>
    <p className="mb-6 text-ink/70">Enter your order number (it starts with VDG-) and the email you used at checkout.</p><TrackOrderForm /></div>;
}
