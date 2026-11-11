/** Official Meta Graph API: post a photo to a Facebook Page and to an Instagram professional account. Nothing here pretends:
 *  a post counts as "posted" only when Meta answers with a post id. */
export interface MetaCfg { pageId: string; pageToken: string; igUserId?: string; base?: string }
export const graphBase = (env: Record<string, string | undefined> = process.env) => (env.META_GRAPH_BASE || `https://graph.facebook.com/${env.META_GRAPH_VERSION || "v21.0"}`).replace(/\/+$/, "");
export interface PostResult { ok: boolean; id?: string; permalink?: string; error?: string; /** true = retrying will not help until the owner reconnects */ fatal?: boolean }

async function call(url: string, init?: RequestInit): Promise<{ status: number; j: any }> {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 30000);
  try { const r = await fetch(url, { ...init, signal: ctl.signal, cache: "no-store" }); let j: any = null; try { j = await r.json(); } catch { /* not json */ } return { status: r.status, j }; } finally { clearTimeout(t); }
}
/** Plain-language reason from a Graph error. Never includes the token. */
export function metaError(status: number, j: any): { message: string; fatal: boolean } {
  const e = j?.error; const code = Number(e?.code), sub = Number(e?.error_subcode); const raw = String(e?.message ?? "").replace(/access_token=[^&\s]+/gi, "").slice(0, 200);
  if (code === 190 || status === 401) return { message: "Meta says the access token is expired or invalid. Reconnect in Admin → Social Media.", fatal: true };
  if (code === 200 || code === 10 || code === 299) return { message: `Meta refused: the token is missing a permission (pages_manage_posts / instagram_content_publish). ${raw}`, fatal: true };
  if (code === 4 || code === 17 || code === 32 || code === 613) return { message: "Meta rate limit reached. It will retry later.", fatal: false };
  if (code === 9007 || sub === 2207027) return { message: "Instagram was still preparing the picture. It will retry.", fatal: false };
  if (code === 36003 || sub === 2207052 || sub === 2207009) return { message: `Instagram rejected the picture (use a JPEG, 4:5 to 1.91:1). ${raw}`, fatal: true };
  return { message: `Meta error (${status}${code ? `/${code}` : ""})${raw ? ": " + raw : ""}`, fatal: false };
}
export async function testMeta(c: MetaCfg): Promise<{ ok: boolean; message: string; pageName?: string; igUsername?: string }> {
  const b = c.base || graphBase(); try {
    const p = await call(`${b}/${encodeURIComponent(c.pageId)}?fields=name&access_token=${encodeURIComponent(c.pageToken)}`);
    if (p.status !== 200) return { ok: false, message: "Facebook Page: " + metaError(p.status, p.j).message };
    let ig = ""; if (c.igUserId) { const i = await call(`${b}/${encodeURIComponent(c.igUserId)}?fields=username&access_token=${encodeURIComponent(c.pageToken)}`); if (i.status !== 200) return { ok: false, message: "Instagram: " + metaError(i.status, i.j).message, pageName: p.j?.name }; ig = String(i.j?.username ?? ""); }
    return { ok: true, message: `Connected to Facebook Page "${p.j?.name}"${ig ? ` and Instagram @${ig}` : " (Instagram not set)"}.`, pageName: p.j?.name, igUsername: ig || undefined };
  } catch { return { ok: false, message: "Could not reach Meta." }; }
}
export async function postFacebook(c: MetaCfg, imageUrl: string, caption: string): Promise<PostResult> {
  const b = c.base || graphBase(); try {
    const body = new URLSearchParams({ url: imageUrl, caption, access_token: c.pageToken, published: "true" });
    const r = await call(`${b}/${encodeURIComponent(c.pageId)}/photos`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
    const id = r.j?.post_id || r.j?.id; if (r.status === 200 && id) return { ok: true, id: String(id), permalink: `https://www.facebook.com/${String(id).replace("_", "/posts/")}` };
    const e = metaError(r.status, r.j); return { ok: false, error: e.message, fatal: e.fatal };
  } catch { return { ok: false, error: "Could not reach Meta." }; }
}
export async function postInstagram(c: MetaCfg, imageUrl: string, caption: string, wait: (ms: number) => Promise<void> = ms => new Promise(r => setTimeout(r, ms))): Promise<PostResult> {
  if (!c.igUserId) return { ok: false, error: "Instagram is not connected.", fatal: true }; const b = c.base || graphBase(); const form = { "Content-Type": "application/x-www-form-urlencoded" };
  try {
    const mk = await call(`${b}/${encodeURIComponent(c.igUserId)}/media`, { method: "POST", headers: form, body: new URLSearchParams({ image_url: imageUrl, caption, access_token: c.pageToken }) });
    const cid = mk.j?.id; if (mk.status !== 200 || !cid) { const e = metaError(mk.status, mk.j); return { ok: false, error: e.message, fatal: e.fatal }; }
    for (let i = 0; i < 8; i++) { // wait until Instagram has processed the picture
      const st = await call(`${b}/${encodeURIComponent(String(cid))}?fields=status_code&access_token=${encodeURIComponent(c.pageToken)}`); const code = st.j?.status_code;
      if (code === "FINISHED") break; if (code === "ERROR" || code === "EXPIRED") return { ok: false, error: "Instagram could not process the picture (use a JPEG).", fatal: true }; await wait(2500);
      if (i === 7) return { ok: false, error: "Instagram was still preparing the picture. It will retry." };
    }
    const pub = await call(`${b}/${encodeURIComponent(c.igUserId)}/media_publish`, { method: "POST", headers: form, body: new URLSearchParams({ creation_id: String(cid), access_token: c.pageToken }) });
    if (pub.status !== 200 || !pub.j?.id) { const e = metaError(pub.status, pub.j); return { ok: false, error: e.message, fatal: e.fatal }; }
    let permalink: string | undefined; try { const pl = await call(`${b}/${encodeURIComponent(String(pub.j.id))}?fields=permalink&access_token=${encodeURIComponent(c.pageToken)}`); permalink = pl.j?.permalink; } catch { /* optional */ }
    return { ok: true, id: String(pub.j.id), permalink };
  } catch { return { ok: false, error: "Could not reach Meta." }; }
}
