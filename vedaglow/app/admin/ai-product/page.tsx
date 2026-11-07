import { serverClient } from "@/lib/supabase/server";
import { getAllCategoryOptions } from "@/lib/data/categoriesAdmin";
import { aiConfig, aiStatusText } from "@/lib/ai/provider";
import { getSiteSettings } from "@/lib/data/site";
import { fmtDateTime } from "@/lib/format";
import { card } from "@/components/admin/ui";
import AIProductCreator from "@/components/admin/AIProductCreator";
export const dynamic = "force-dynamic";
export default async function Page() {
  const cfg = aiConfig(); const sb = serverClient(); const d = new Date(); d.setUTCHours(0, 0, 0, 0);
  const mo = new Date(); mo.setUTCDate(1); mo.setUTCHours(0, 0, 0, 0); const st = await getSiteSettings();
  const [cats, today, month, recent] = await Promise.all([getAllCategoryOptions(), sb.from("ai_usage").select("id", { count: "exact", head: true }).gte("created_at", d.toISOString()), sb.from("ai_usage").select("id", { count: "exact", head: true }).gte("created_at", mo.toISOString()), sb.from("product_ai_drafts").select("id,created_at,product_id,published,needs_verification,source_urls,suggestion").order("created_at", { ascending: false }).limit(10)]);
  return (<div className="space-y-5"><h1 className="font-display text-4xl font-semibold text-forest">AI Product Creator</h1>
    <p className="text-sm text-ink/70">Upload one photo + the price. The AI suggests the text; <b>you</b> check it and press Save or Publish. It never publishes by itself and is told never to invent ingredients, sizes or health claims.</p>
    <AIProductCreator categories={cats} aiReady={Boolean(cfg)} status={aiStatusText()} used={today.count ?? 0} limit={cfg?.dailyLimit ?? 0} autoPublish={Boolean(st.ai_auto_publish)} monthUsed={month.count ?? 0} monthLimit={cfg?.monthlyLimit ?? 0} />
    <section className={card}><h2 className="mb-2 font-display text-2xl font-semibold text-forest">Settings (in Netlify, never in the browser)</h2>
      <p className="text-sm text-ink/70">Provider: <b>{cfg ? `${cfg.provider} · ${cfg.model}` : "not connected"}</b> · Daily limit: <b>{cfg?.dailyLimit ?? "—"}</b> · Used today: <b>{today.count ?? 0}</b></p>
      <p className="mt-2 text-xs text-ink/60">Variables: AI_PROVIDER (anthropic | openai | gemini), the matching key (ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY), AI_MODEL (required for openai/gemini), AI_DAILY_LIMIT (default 20), AI_MONTHLY_LIMIT (default 300). For Gemini: create a key in Google AI Studio, set AI_PROVIDER=gemini + GEMINI_API_KEY, then press “Test AI connection” – it lists the model names your key can use for AI_MODEL. Switching provider = change AI_PROVIDER + key, no code change. Provider usage is billed by the provider to you; set a spending limit in their dashboard.</p></section>
    <section className={card}><h2 className="mb-2 font-display text-2xl font-semibold text-forest">Recent AI drafts</h2>
      {recent.error ? <p className="text-sm text-ink/60">{/product_ai_drafts|ai_usage/.test(recent.error.message) ? "Run supabase/migration-13.sql in Supabase to turn on usage limits and history." : recent.error.message}</p> : (recent.data ?? []).length === 0 ? <p className="text-sm text-ink/60">None yet.</p> :
        <ul className="divide-y divide-forest/10 text-sm">{(recent.data ?? []).map((r: any) => <li key={r.id} className="py-2"><b>{r.suggestion?.name ?? "(unnamed)"}</b> · {r.published ? "published" : "draft"} <span className="text-ink/60">· {fmtDateTime(r.created_at)}{r.needs_verification?.length ? ` · to verify: ${r.needs_verification.join(", ")}` : ""}{r.source_urls?.length ? ` · links: ${r.source_urls.join(" ")}` : ""}</span>{r.product_id && <> · <a className="text-forest underline" href={`/admin/products/${r.product_id}`}>open</a></>}</li>)}</ul>}</section></div>);
}
