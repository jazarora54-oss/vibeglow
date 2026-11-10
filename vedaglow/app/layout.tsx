import type { Metadata } from "next";
import "./globals.css";
import { siteUrl } from "@/lib/site";
import { fontClasses } from "@/lib/fonts";
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
import DealNudge from "@/components/cart/DealNudge";
import { themeCss } from "@/lib/theme";
import Tracking from "@/components/Tracking";
import { gaId, pixelId, ldJson, organizationLd, verifyToken, websiteLd } from "@/lib/seo";
export async function generateMetadata(): Promise<Metadata> {
  const v = verifyToken((await getSiteSettings()).google_verify);
  return { ...metadata, ...(v ? { verification: { google: v } } : {}) };
}
const metadata: Metadata = { metadataBase: new URL(siteUrl()), openGraph: { siteName: "VEDAGLOW", type: "website" }, title: "VEDAGLOW – Ancient Wisdom. Modern Glow.", description: "Pure, natural & effective beauty and wellness products for your daily care." };
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, deals, cats] = await Promise.all([getSiteSettings(), getActiveDeals(), getStoreCategories()]); const shipCfg = shipConfigOf(settings);
  return (<html lang="en" className={fontClasses} data-3d={settings.style_3d ? "on" : undefined}><body>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson([organizationLd(settings, siteUrl()), websiteLd(settings, siteUrl())]) }} />
    <Tracking ga={gaId(settings.ga_id)} pixel={pixelId(settings.meta_pixel_id)} />
    {themeCss(settings) && <style dangerouslySetInnerHTML={{ __html: themeCss(settings) }} />}
    <CartProvider shipCfg={shipCfg} deals={deals}><Shell top={<><AnnouncementBar /><Header categories={cats.map(c => ({ slug: c.slug, name: c.name }))} logo={{ url: settings.logo_url, alt: settings.logo_alt, size: settings.logo_size }} /></>} bottom={<><Footer /><AIChatButton /><MiniCart /><Toast /><DealNudge /><PromoPopup enabled={settings.popup_enabled} title={settings.popup_title} message={settings.popup_message} code={settings.popup_code} buttonText={settings.popup_button_text} buttonLink={settings.popup_button_link} delay={settings.popup_delay} /></>}>{children}</Shell></CartProvider>
  </body></html>);
}
