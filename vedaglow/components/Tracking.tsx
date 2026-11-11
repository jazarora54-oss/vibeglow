"use client";
import Script from "next/script";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getConsent, setConsent, type Consent } from "@/lib/analytics";
/** Google Analytics 4 + optional Meta Pixel. Loaded ONLY after the visitor accepts the cookie notice, never on admin pages. */
export default function Tracking({ ga, pixel }: { ga: string; pixel: string }) {
  const path = usePathname(); const [c, setC] = useState<Consent>("denied"); // "denied" until we have read the browser (also on the server)
  useEffect(() => { const read = () => setC(getConsent()); read(); window.addEventListener("vedaglow:consent", read); return () => window.removeEventListener("vedaglow:consent", read); }, []);
  useEffect(() => { if (c === "granted" && pixel) (window as any).fbq?.("track", "PageView"); }, [path, c, pixel]);
  if ((!ga && !pixel) || path?.startsWith("/admin")) return null;
  return <>
    {c === "granted" && ga && <><Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${ga}');`}</Script></>}
    {c === "granted" && pixel && <Script id="meta-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src='https://connect.facebook.net/en_US/fbevents.js';s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script');fbq('init','${pixel}');`}</Script>}
    {c === "unset" && <div role="dialog" aria-label="Cookie notice" className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-xl rounded-2xl border border-forest/15 bg-white p-4 text-sm shadow-card">
      <p className="text-ink/80">We use cookies to count visits and measure ads so we can improve the shop. Nothing is collected until you accept. <Link href="/privacy" className="font-semibold text-forest underline">Privacy policy</Link></p>
      <div className="mt-3 flex gap-2"><button onClick={() => setConsent("granted")} className="rounded-lg bg-forest px-4 py-2 font-semibold text-onforest hover:bg-forest-500">Accept</button><button onClick={() => setConsent("denied")} className="rounded-lg border border-forest/25 bg-white px-4 py-2 font-semibold text-forest hover:bg-forest-100">Decline</button></div></div>}
  </>;
}
