import type { Metadata } from "next";
import CheckoutView from "@/components/checkout/CheckoutView";
export const metadata: Metadata = { title: "VEDAGLOW | Checkout", robots: { index: false } };
export default function CheckoutPage() { return <CheckoutView />; }
