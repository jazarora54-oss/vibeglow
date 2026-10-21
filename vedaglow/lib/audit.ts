import type { serverClient } from "@/lib/supabase/server";
/** Writes one line to the admin activity log (admin -> Activity log). Never throws: a logging problem must not break the action itself. */
export async function audit(sb: ReturnType<typeof serverClient>, action: string, detail = ""): Promise<void> {
  try {
    const { data: { user } } = await sb.auth.getUser(); if (!user) return;
    await sb.from("audit_log").insert({ user_id: user.id, user_email: user.email ?? null, action: action.slice(0, 60), detail: detail.slice(0, 500) });
  } catch { /* ignore */ }
}
