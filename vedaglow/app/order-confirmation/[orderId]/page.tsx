import type { Metadata } from "next";
import OrderConfirmation from "@/components/order/OrderConfirmation";
export const metadata: Metadata = { title: "VEDAGLOW | Order Confirmation", robots: { index: false } };
export default function Page({ params }: { params: { orderId: string } }) { return <OrderConfirmation orderId={params.orderId} />; }
