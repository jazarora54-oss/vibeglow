import type { Metadata } from "next";
import ConfirmSubscriptionButton from "@/components/product/ConfirmSubscriptionButton";
export const metadata: Metadata = { title: "Confirm subscription | VEDAGLOW", robots: { index: false, follow: false } };
export default async function Page(props: { searchParams: Promise<{ t?: string }> }) {
  const searchParams = await props.searchParams;
  return <div className="mx-auto max-w-xl px-4 py-16"><h1 className="mb-3 font-display text-4xl font-semibold text-forest">Confirm your subscription</h1>
    <p className="mb-6 text-ink/70">Press the button to confirm that you want to receive news and offers from us. You can unsubscribe at any time.</p>{searchParams.t ? <ConfirmSubscriptionButton token={searchParams.t} /> : <p className="text-red-700">This link is not valid.</p>}</div>;
}
