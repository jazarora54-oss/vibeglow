"use client";
import Script from "next/script";
import { usePathname } from "next/navigation";
/** Google Analytics 4. Only loaded when a valid ID is saved in admin -> Google & Analytics. Never on admin pages. */
export default function GoogleAnalytics({ id }: { id: string }) {
  const path = usePathname();
  if (!id || path?.startsWith("/admin")) return null;
  return <><Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
    <Script id="ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${id}');`}</Script></>;
}
