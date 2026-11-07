import { postFacebook, postInstagram, type MetaCfg, type PostResult } from "./meta";
import { scanClaims } from "@/lib/ai/draft";
export type Platform = "facebook" | "instagram";
export interface Post { id: number; product_id: string | null; platform: Platform; status: string; caption: string; image_url: string | null; scheduled_at: string | null; attempts: number }
export const MAX_ATTEMPTS = 3;
/** Wait before the next try: 10 min, then 60 min. */
export const backoffMs = (attempts: number) => (attempts <= 1 ? 10 : 60) * 60_000;

/** Caption from facts the shop already has. No invented claims; the claim scanner warns about risky wording. */
export function buildCaption(p: { name: string; short_description?: string; price: number; slug: string; category?: string }, siteUrl: string, extraTags: string[] = []): { caption: string; warnings: string[] } {
  const tag = (s: string) => "#" + s.replace(/[^A-Za-z0-9]+/g, "").slice(0, 28); const tags = [...new Set(["VedaGlow", p.category ? p.category.replace(/-/g, " ").replace(/\b\w/g, m => m.toUpperCase()) : "", ...extraTags].filter(Boolean).map(tag).filter(t => t.length > 2))].slice(0, 8);
  const body = [p.name, p.short_description?.trim() || "", `$${Number(p.price).toFixed(2)} · Shop: ${siteUrl.replace(/\/+$/, "")}/product/${p.slug}`, tags.join(" ")].filter(Boolean).join("\n\n").slice(0, 2000);
  return { caption: body, warnings: scanClaims(body).map(w => `Wording check: “${w}” – remove it unless you can prove it.`) };
}
/** Spreads N posts over days: `perDay` per day starting at `start`, one hour apart inside a day. */
export function dripTimes(n: number, start: Date, perDay: number): Date[] {
  const per = Math.max(1, Math.floor(perDay)); return Array.from({ length: n }, (_, i) => new Date(start.getTime() + Math.floor(i / per) * 86_400_000 + (i % per) * 3_600_000));
}
export const dedupeKey = (productId: string, platform: Platform, repost: boolean) => `${productId}:${platform}${repost ? ":" + Date.now() : ""}`;

/** Storage used by the processor (the real one talks to Supabase; tests use a memory copy). */
export interface Store {
  due(nowIso: string, limit: number): Promise<Post[]>;
  claim(id: number): Promise<boolean>;                                   // queued -> posting, true only for the caller that wins
  finish(id: number, patch: { status: string; attempts: number; last_error?: string | null; platform_post_id?: string | null; permalink?: string | null; scheduled_at?: string | null; posted_at?: string | null }): Promise<void>;
  postedSince(iso: string): Promise<number>;
}
export interface Summary { tried: number; posted: number; failed: number; retryLater: number; skippedDaily: number }
export async function processQueue(store: Store, cfg: MetaCfg | null, opts: { now?: Date; limit?: number; dailyCap?: number; poster?: { fb?: typeof postFacebook; ig?: typeof postInstagram } } = {}): Promise<Summary> {
  const now = opts.now ?? new Date(); const s: Summary = { tried: 0, posted: 0, failed: 0, retryLater: 0, skippedDaily: 0 };
  const fb = opts.poster?.fb ?? postFacebook, ig = opts.poster?.ig ?? postInstagram; const cap = opts.dailyCap ?? 10;
  let today = await store.postedSince(new Date(now.getTime() - 86_400_000).toISOString());
  for (const p of await store.due(now.toISOString(), opts.limit ?? 5)) {
    if (today >= cap) { s.skippedDaily++; continue; } if (!(await store.claim(p.id))) continue; s.tried++; const attempts = p.attempts + 1;
    let r: PostResult;
    if (!cfg) r = { ok: false, error: "Social accounts are not connected (Admin → Social Media).", fatal: true };
    else if (!p.image_url) r = { ok: false, error: "No picture for this post.", fatal: true };
    else r = p.platform === "facebook" ? await fb(cfg, p.image_url, p.caption) : await ig(cfg, p.image_url, p.caption);
    if (r.ok && r.id) { today++; s.posted++; await store.finish(p.id, { status: "posted", attempts, last_error: null, platform_post_id: r.id, permalink: r.permalink ?? null, posted_at: new Date().toISOString() }); }
    else if (r.fatal || attempts >= MAX_ATTEMPTS) { s.failed++; await store.finish(p.id, { status: "failed", attempts, last_error: (r.error ?? "Unknown error").slice(0, 300) }); }
    else { s.retryLater++; await store.finish(p.id, { status: "queued", attempts, last_error: (r.error ?? "Retrying").slice(0, 300), scheduled_at: new Date(now.getTime() + backoffMs(attempts)).toISOString() }); }
  }
  return s;
}
