import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabase/server";
import { processQueue } from "@/lib/social/queue";
import { loadCfg, supabaseStore } from "@/lib/social/store";
import { timingSafeEqual } from "crypto";
export const dynamic = "force-dynamic"; export const maxDuration = 26;
/** Called every 15 minutes by the Netlify scheduled job (production only). Protected by SOCIAL_CRON_SECRET; without it this does nothing. */
export async function POST(req: Request) {
  const secret = process.env.SOCIAL_CRON_SECRET || ""; const got = req.headers.get("x-cron-secret") || "";
  const a = Buffer.from(secret), b = Buffer.from(got); if (!secret || a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ ok: false }, { status: 401 });
  const db = serviceClient(); if (!db) return NextResponse.json({ ok: false, error: "no service key" }, { status: 500 });
  const s = await processQueue(supabaseStore(db), await loadCfg(db), { limit: 3, dailyCap: Number(process.env.SOCIAL_DAILY_CAP) || 10 }); return NextResponse.json({ ok: true, ...s });
}
