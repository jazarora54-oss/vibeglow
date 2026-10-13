import type { Metadata } from "next";
import UnsubscribeButton from "@/components/product/UnsubscribeButton";
export const metadata: Metadata = { title: "Unsubscribe | VEDAGLOW", robots: { index: false } };
export default function Page({ searchParams }: { searchParams: { t?: string } }) {
  return <div className="mx-auto max-w-xl px-4 py-16"><h1 className="mb-3 font-display text-4xl font-semibold text-forest">Unsubscribe from offers</h1>
    <p className="mb-6 text-ink/70">Press the button to stop receiving offer emails from us.</p>{searchParams.t ? <UnsubscribeButton token={searchParams.t} /> : <p className="text-red-700">This link is not valid.</p>}</div>;
}
