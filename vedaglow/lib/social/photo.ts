/** Makes a clean JPEG (4:5, 1080×1350) from a product picture on OUR storage. Instagram only accepts JPEG, so this is needed for automatic posts.
 *  Uses `sharp` (bundled with Next.js). If it is missing on the host, we return a clear error instead of posting a bad picture. */
type Db = NonNullable<ReturnType<typeof import("@/lib/supabase/server").serviceClient>>;
export async function toSocialJpeg(db: Db, url: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, ""); if (!base || !url.startsWith(base + "/storage/v1/object/public/")) return { ok: false, error: "The picture is not on the shop's own storage, so it was not converted." };
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 20000); let buf: Buffer;
    try { const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) return { ok: false, error: "Could not download the product picture." }; buf = Buffer.from(await r.arrayBuffer()); } finally { clearTimeout(t); }
    if (buf.length > 15 * 1024 * 1024) return { ok: false, error: "The picture is too big." };
    let sharp: any; try { sharp = (await import("sharp")).default; } catch { return { ok: false, error: "Picture conversion is not available on this server. Use the Social Media page to design the poster in your browser." }; }
    const out: Buffer = await sharp(buf).rotate().resize(1080, 1350, { fit: "cover", position: "attention" }).flatten({ background: "#FBF8F1" }).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
    const path = `social/auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.jpg`; const { error } = await db.storage.from("media").upload(path, out, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
    if (error) return { ok: false, error: `Upload failed: ${error.message}` }; return { ok: true, url: db.storage.from("media").getPublicUrl(path).data.publicUrl };
  } catch { return { ok: false, error: "Could not prepare the picture." }; }
}
