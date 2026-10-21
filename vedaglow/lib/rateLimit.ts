import { headers } from "next/headers";
import { createHash } from "crypto";
import { serviceClient } from "@/lib/supabase/server";
const mem = new Map<string, { n: number; t: number }>();
/** Anonymous id of the caller (hash of the IP). Netlify's own header first: it cannot be faked by the visitor. */
function callerId(): string {
  const h = headers();
  const ip = h.get("x-nf-client-connection-ip") || h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",").pop()?.trim() || "unknown";
  return createHash("sha256").update(ip).digest("hex").slice(0, 24);
}
/**
 * true = allowed, false = too many tries. Counted in the database (shared by every server instance) via rate_hit() from migration-6.sql.
 * Until that migration is run (or without the service key) it falls back to a per-instance counter, which is weaker but still slows bots.
 */
export async function rateLimitOk(action: string, max: number, windowSec: number): Promise<boolean> {
  let key: string; try { key = `${action}:${callerId()}`; } catch { return true; }
  const db = serviceClient();
  if (db) { try { const { data, error } = await db.rpc("rate_hit", { p_key: key, p_window_sec: windowSec, p_max: max }); if (!error && typeof data === "boolean") return data; } catch { /* fall through */ } }
  const now = Date.now(); const e = mem.get(key);
  if (!e || now - e.t > windowSec * 1000) { if (mem.size > 5000) mem.clear(); mem.set(key, { n: 1, t: now }); return true; }
  e.n++; return e.n <= max;
}
