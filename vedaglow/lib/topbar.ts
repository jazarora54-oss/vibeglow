import type { SiteSettings } from "@/lib/data/defaults";
/** Today as a plain day in Pacific time (same convention as banners and deals). */
export const pacificDay = (now = Date.now()) => new Date(now - 8 * 3600e3).toISOString().slice(0, 10);
/** Is the top bar inside its optional show-from / show-until days? */
export function topbarInDates(s: Pick<SiteSettings, "topbar_starts" | "topbar_ends">, now = Date.now()): boolean {
  const d = pacificDay(now), a = (s.topbar_starts ?? "").trim(), b = (s.topbar_ends ?? "").trim();
  return (!a || d >= a) && (!b || d <= b);
}
/** One message per line; blank lines dropped; at most 6. */
export const topbarLines = (text: string | undefined | null) => String(text ?? "").split(/\r?\n/).map(x => x.trim()).filter(Boolean).slice(0, 6);
export const safeLink = (x: unknown) => { const t = String(x ?? "").trim(); return /^(\/(?!\/)|https?:\/\/)/i.test(t) ? t : ""; };
