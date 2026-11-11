import type { Metadata } from "next";
import OrderConfirmation from "@/components/order/OrderConfirmation";
export const metadata: Metadata = { title: "VEDAGLOW | Order Confirmation", robots: { index: false } };
export default async function Page(props: { params: Promise<{ orderId: string }> }) { const params = await props.params; return <OrderConfirmation orderId={params.orderId} />; }
