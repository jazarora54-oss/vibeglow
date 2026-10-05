import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON, SUPABASE_URL } from "./config";
/** Read-only storefront client (anon key). no-store so admin changes show up immediately. */
export const publicClient = () => createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: (u, i) => fetch(u, { ...i, cache: "no-store" }) },
});
