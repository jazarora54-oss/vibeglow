import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
/** Locks every /admin page: must be signed in AND listed in the `admins` table. */
export async function middleware(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.next(); // not configured: the admin layout shows the setup guide
  let res = NextResponse.next({ request: req });
  const sb = createServerClient(url, anon, { cookies: {
    getAll: () => req.cookies.getAll(),
    setAll: list => { list.forEach(({ name, value }) => req.cookies.set(name, value)); res = NextResponse.next({ request: req }); list.forEach(({ name, value, options }) => res.cookies.set(name, value, options)); },
  } });
  const { data: { user } } = await sb.auth.getUser();
  const isLogin = req.nextUrl.pathname === "/admin/login";
  if (isLogin) return res;
  const to = (q = "") => { const u = req.nextUrl.clone(); u.pathname = "/admin/login"; u.search = q; return NextResponse.redirect(u); };
  if (!user) return to();
  const { data: admin } = await sb.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) return to("?error=notadmin");
  return res;
}
export const config = { matcher: ["/admin/:path*"] };
