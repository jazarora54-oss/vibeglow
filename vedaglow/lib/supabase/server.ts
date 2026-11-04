import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { SUPABASE_ANON, SUPABASE_URL } from "./config";
/** Client acting as the signed-in user (admin pages + admin actions). Row Level Security decides what is allowed. */
export function serverClient() {
  // Next 15: cookies() is asynchronous, so the cookie handlers await it (the client itself stays synchronous to create).
  return createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      getAll: async () => (await cookies()).getAll(),
      setAll: async list => { try { const store = await cookies(); list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* called from a Server Component */ } },
    },
  });
}
/** Server-only, full access. Used ONLY to create orders / change stock. Returns null when the key is not set. */
export function serviceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || !SUPABASE_URL) return null;
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (u, i) => fetch(u, { ...i, cache: "no-store" }) } });
}
