/** Switchable AI provider. Keys live ONLY in server environment variables (Netlify); they are never sent to the browser. */
export type ProviderName = "anthropic" | "openai" | "gemini";
export interface AiConfig { provider: ProviderName; model: string; key: string; base: string; dailyLimit: number }
export interface AiResult { ok: boolean; text?: string; error?: string; inputTokens?: number; outputTokens?: number }
export interface AiImage { mime: "image/webp" | "image/jpeg" | "image/png"; base64: string }

const KEYS: Record<ProviderName, string> = { anthropic: "ANTHROPIC_API_KEY", openai: "OPENAI_API_KEY", gemini: "GEMINI_API_KEY" };
const BASES: Record<ProviderName, string> = { anthropic: "https://api.anthropic.com", openai: "https://api.openai.com", gemini: "https://generativelanguage.googleapis.com" };
const DEFAULT_MODEL: Partial<Record<ProviderName, string>> = { anthropic: "claude-sonnet-5-5" }; // others: set AI_MODEL yourself (model names change often)

/** null = AI is not set up (no key). Nothing is ever called, nothing is charged. */
export function aiConfig(env: Record<string, string | undefined> = process.env): AiConfig | null {
  const p = (env.AI_PROVIDER || "anthropic").trim().toLowerCase() as ProviderName; if (!(p in KEYS)) return null;
  const key = (env[KEYS[p]] || "").trim(); if (!key) return null;
  const model = (env.AI_MODEL || DEFAULT_MODEL[p] || "").trim(); if (!model) return null;
  const lim = Math.floor(Number(env.AI_DAILY_LIMIT)); const base = (env.AI_API_BASE || BASES[p]).replace(/\/+$/, "");
  return { provider: p, model, key, base, dailyLimit: Number.isFinite(lim) && lim >= 0 ? lim : 20 };
}
export const aiStatusText = (env: Record<string, string | undefined> = process.env) => {
  const p = (env.AI_PROVIDER || "anthropic").trim().toLowerCase(); if (!(p in KEYS)) return `Unknown AI_PROVIDER "${p}". Use anthropic, openai or gemini.`;
  if (!(env[KEYS[p as ProviderName]] || "").trim()) return `Not connected: add ${KEYS[p as ProviderName]} in Netlify to switch on.`;
  if (!(env.AI_MODEL || DEFAULT_MODEL[p as ProviderName])) return "Add AI_MODEL (the model name from your provider) in Netlify.";
  return "";
};

async function post(url: string, headers: Record<string, string>, body: unknown): Promise<{ status: number; json: any }> {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 45000);
  try { const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body), signal: ctl.signal, cache: "no-store" }); let j: any = null; try { j = await r.json(); } catch { /* not json */ } return { status: r.status, json: j }; }
  finally { clearTimeout(t); }
}
const errOf = (status: number, j: any) => `AI provider error (${status})${j?.error?.message ? ": " + String(j.error.message).slice(0, 160) : j?.error ? ": " + String(typeof j.error === "string" ? j.error : j.error.type ?? "").slice(0, 80) : ""}`;

/** One call: a photo + instructions in, text out. The provider differences stay inside this function. */
export async function generate(cfg: AiConfig, system: string, user: string, image: AiImage): Promise<AiResult> {
  try {
    if (cfg.provider === "anthropic") {
      const { status, json } = await post(`${cfg.base}/v1/messages`, { "x-api-key": cfg.key, "anthropic-version": "2023-06-01" }, { model: cfg.model, max_tokens: 2000, system, messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: image.mime, data: image.base64 } }, { type: "text", text: user }] }] });
      if (status !== 200) return { ok: false, error: errOf(status, json) };
      return { ok: true, text: (json?.content ?? []).filter((c: any) => c.type === "text").map((c: any) => c.text).join(""), inputTokens: json?.usage?.input_tokens, outputTokens: json?.usage?.output_tokens };
    }
    if (cfg.provider === "openai") {
      const { status, json } = await post(`${cfg.base}/v1/chat/completions`, { Authorization: `Bearer ${cfg.key}` }, { model: cfg.model, max_tokens: 2000, response_format: { type: "json_object" }, messages: [{ role: "system", content: system }, { role: "user", content: [{ type: "text", text: user }, { type: "image_url", image_url: { url: `data:${image.mime};base64,${image.base64}` } }] }] });
      if (status !== 200) return { ok: false, error: errOf(status, json) };
      return { ok: true, text: json?.choices?.[0]?.message?.content ?? "", inputTokens: json?.usage?.prompt_tokens, outputTokens: json?.usage?.completion_tokens };
    }
    const { status, json } = await post(`${cfg.base}/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent`, { "x-goog-api-key": cfg.key }, { systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: user }, { inline_data: { mime_type: image.mime, data: image.base64 } }] }], generationConfig: { responseMimeType: "application/json", maxOutputTokens: 2000 } });
    if (status !== 200) return { ok: false, error: errOf(status, json) };
    return { ok: true, text: (json?.candidates?.[0]?.content?.parts ?? []).map((p: any) => p.text ?? "").join(""), inputTokens: json?.usageMetadata?.promptTokenCount, outputTokens: json?.usageMetadata?.candidatesTokenCount };
  } catch (e) { return { ok: false, error: e instanceof Error && e.name === "AbortError" ? "The AI took too long. Please try again." : "Could not reach the AI provider." }; }
}
