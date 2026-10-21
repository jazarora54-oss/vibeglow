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
import { getSiteSettings } from "@/lib/data/site";
import { shipConfigOf } from "@/lib/shipping/settings";
import { getActiveDeals } from "@/lib/data/deals";
import { getStoreCategories } from "@/lib/data/categories";
import PromoPopup from "@/components/layout/PromoPopup";
const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"], style: ["normal", "italic"], variable: "--font-display" });
const sans = Jost({ subsets: ["latin"], variable: "--font-sans" });
export const metadata: Metadata = { metadataBase: new URL(siteUrl()), openGraph: { siteName: "VEDAGLOW", type: "website" }, title: "VEDAGLOW – Ancient Wisdom. Modern Glow.", description: "Pure, natural & effective beauty and wellness products for your daily care." };
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, deals, cats] = await Promise.all([getSiteSettings(), getActiveDeals(), getStoreCategories()]); const shipCfg = shipConfigOf(settings);
  return (<html lang="en" className={`${display.variable} ${sans.variable}`}><body>
    <CartProvider shipCfg={shipCfg} deals={deals}><Shell top={<><AnnouncementBar /><Header categories={cats.map(c => ({ slug: c.slug, name: c.name }))} /></>} bottom={<><Footer /><AIChatButton /><MiniCart /><Toast /><PromoPopup enabled={settings.popup_enabled} title={settings.popup_title} message={settings.popup_message} code={settings.popup_code} buttonText={settings.popup_button_text} buttonLink={settings.popup_button_link} delay={settings.popup_delay} /></>}>{children}</Shell></CartProvider>
  </body></html>);
}
