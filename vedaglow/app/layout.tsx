import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/site";
import { CartProvider } from "@/components/CartProvider";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MiniCart from "@/components/cart/MiniCart";
import Toast from "@/components/cart/Toast";
import Shell from "@/components/layout/Shell";
import AIChatButton from "@/components/chat/AIChatButton";
const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"], style: ["normal", "italic"], variable: "--font-display" });
const sans = Jost({ subsets: ["latin"], variable: "--font-sans" });
export const metadata: Metadata = { metadataBase: new URL(siteUrl()), openGraph: { siteName: "VEDAGLOW", type: "website" }, title: "VEDAGLOW – Ancient Wisdom. Modern Glow.", description: "Pure, natural & effective beauty and wellness products for your daily care." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en" className={`${display.variable} ${sans.variable}`}><body>
    <CartProvider><Shell top={<><AnnouncementBar /><Header /></>} bottom={<><Footer /><AIChatButton /><MiniCart /><Toast /></>}>{children}</Shell></CartProvider>
  </body></html>);
}
