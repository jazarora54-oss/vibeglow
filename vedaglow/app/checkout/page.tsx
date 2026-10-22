import type { Metadata } from "next";
import CheckoutView from "@/components/checkout/CheckoutView";
import { stripeConfigured } from "@/lib/payments/stripe";
export const metadata: Metadata = { title: "VEDAGLOW | Checkout", robots: { index: false } };
export const dynamic = "force-dynamic";
export default function CheckoutPage() { return <CheckoutView payOnline={stripeConfigured()} />; }
