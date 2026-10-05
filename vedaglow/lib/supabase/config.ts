export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
/** False until the two env vars are set; the site then keeps using the built-in demo data. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON);
