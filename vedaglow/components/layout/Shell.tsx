"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
/** Storefront header/footer/chat are hidden on /admin pages. */
export default function Shell({ top, bottom, children }: { top: ReactNode; bottom: ReactNode; children: ReactNode }) {
  const admin = usePathname()?.startsWith("/admin");
  return admin ? <>{children}</> : <>{top}<main>{children}</main>{bottom}</>;
}
