/** Switchable AI provider. Keys live ONLY in server environment variables (Netlify); they are never sent to the browser. */
export type ProviderName = "anthropic" | "openai" | "gemini";
export interface AiConfig { provider: ProviderName; model: string; key: string; base: string; dailyLimit: number; monthlyLimit: number }
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
  const mlim = Math.floor(Number(env.AI_MONTHLY_LIMIT)); return { provider: p, model, key, base, dailyLimit: Number.isFinite(lim) && lim >= 0 ? lim : 20, monthlyLimit: Number.isFinite(mlim) && mlim >= 0 ? mlim : 300 };
}
export const aiStatusText = (env: Record<string, string | undefined> = process.env) => {
  const p = (env.AI_PROVIDER || "anthropic").trim().toLowerCase(); if (!(p in KEYS)) return `Unknown AI_PROVIDER "${p}". Use anthropic, openai or gemini.`;
  if (!(env[KEYS[p as ProviderName]] || "").trim()) return `Not connected: add ${KEYS[p as ProviderName]} in Netlify to switch on.`;
  if (!(env.AI_MODEL || DEFAULT_MODEL[p as ProviderName])) return "Add AI_MODEL (the model name from your provider) in Netlify.";
  return "";
};

async function post1(url: string, headers: Record<string, string>, body: unknown): Promise<{ status: number; json: any }> {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 55000);
  try { const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body), signal: ctl.signal, cache: "no-store" }); let j: any = null; try { j = await r.json(); } catch { /* not json */ } return { status: r.status, json: j }; }
  finally { clearTimeout(t); }
}
/** "High demand" (503) and brief server errors usually pass in seconds, so try again up to 2 more times before giving up. */
async function post(url: string, headers: Record<string, string>, body: unknown): Promise<{ status: number; json: any }> {
  let r = await post1(url, headers, body);
  for (const wait of [2500, 5000]) { if (![500, 502, 503, 504].includes(r.status)) break; await new Promise(res => setTimeout(res, wait)); r = await post1(url, headers, body); }
  return r;
}
const hintOf = (status: number) => (status === 401 || status === 403 ? " The key is wrong or belongs to a different provider. In Netlify check that AI_PROVIDER matches the key (gemini + GEMINI_API_KEY), and remove any old ANTHROPIC_API_KEY." : "");
const errOf = (status: number, j: any) => hintOf(status) && `AI provider error (${status}).${hintOf(status)}` || `AI provider error (${status})${j?.error?.message ? ": " + String(j.error.message).slice(0, 160) : j?.error ? ": " + String(typeof j.error === "string" ? j.error : j.error.type ?? "").slice(0, 80) : ""}`;

/** One call: a photo + instructions in, text out. The provider differences stay inside this function. */
export async function generate(cfg: AiConfig, system: string, user: string, image: AiImage | AiImage[]): Promise<AiResult> {
  const imgs = Array.isArray(image) ? image : [image];
  try {
    if (cfg.provider === "anthropic") {
      const { status, json } = await post(`${cfg.base}/v1/messages`, { "x-api-key": cfg.key, "anthropic-version": "2023-06-01" }, { model: cfg.model, max_tokens: 2000, system, messages: [{ role: "user", content: [...imgs.map(im => ({ type: "image", source: { type: "base64", media_type: im.mime, data: im.base64 } })), { type: "text", text: user }] }] });
      if (status !== 200) return { ok: false, error: errOf(status, json) };
      return { ok: true, text: (json?.content ?? []).filter((c: any) => c.type === "text").map((c: any) => c.text).join(""), inputTokens: json?.usage?.input_tokens, outputTokens: json?.usage?.output_tokens };
    }
    if (cfg.provider === "openai") {
      const { status, json } = await post(`${cfg.base}/v1/chat/completions`, { Authorization: `Bearer ${cfg.key}` }, { model: cfg.model, max_tokens: 2000, response_format: { type: "json_object" }, messages: [{ role: "system", content: system }, { role: "user", content: [{ type: "text", text: user }, ...imgs.map(im => ({ type: "image_url", image_url: { url: `data:${im.mime};base64,${im.base64}` } }))] }] });
      if (status !== 200) return { ok: false, error: errOf(status, json) };
      return { ok: true, text: json?.choices?.[0]?.message?.content ?? "", inputTokens: json?.usage?.prompt_tokens, outputTokens: json?.usage?.completion_tokens };
    }
    const { status, json } = await post(`${cfg.base}/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent`, { "x-goog-api-key": cfg.key }, { systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: user }, ...imgs.map(im => ({ inline_data: { mime_type: im.mime, data: im.base64 } }))] }], generationConfig: { responseMimeType: "application/json", maxOutputTokens: 8192 } });
    if (status !== 200) return { ok: false, error: errOf(status, json) };
    return { ok: true, text: (json?.candidates?.[0]?.content?.parts ?? []).map((p: any) => p.text ?? "").join(""), inputTokens: json?.usageMetadata?.promptTokenCount, outputTokens: json?.usageMetadata?.candidatesTokenCount };
  } catch (e) { return { ok: false, error: e instanceof Error && e.name === "AbortError" ? "The AI took too long. Please try again." : "Could not reach the AI provider." }; }
}

/** Checks the key (and, for Gemini, lists the model names this key can really use). Sends no photo and costs nothing on free tiers. */
export async function testAi(cfg: AiConfig): Promise<{ ok: boolean; message: string }> {
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 15000);
    try {
      if (cfg.provider === "gemini") {
        const r = await fetch(`${cfg.base}/v1beta/models?pageSize=100`, { headers: { "x-goog-api-key": cfg.key }, signal: ctl.signal, cache: "no-store" }); const j: any = await r.json().catch(() => null);
        if (r.status !== 200) return { ok: false, message: errOf(r.status, j) + " Check GEMINI_API_KEY." };
        const names: string[] = (j?.models ?? []).filter((m: any) => (m.supportedGenerationMethods ?? []).includes("generateContent")).map((m: any) => String(m.name).replace(/^models\//, ""));
        const has = names.includes(cfg.model);
        if (has) { const pr = await post(`${cfg.base}/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent`, { "x-goog-api-key": cfg.key }, { contents: [{ role: "user", parts: [{ text: "Reply with the word OK." }] }], generationConfig: { maxOutputTokens: 64 } }); if (pr.status !== 200) { const recent = names.filter(n => /^gemini-3\.\d+-flash$/.test(n)).slice(-3).join(", "); return { ok: false, message: errOf(pr.status, pr.json) + ` Model "${cfg.model}" is listed but cannot be used. Set AI_MODEL to a newer one${recent ? ", for example: " + recent : " (for example gemini-3.8-flash)"}.` }; } }
        return { ok: has, message: has ? `Key works. Model "${cfg.model}" is available.` : `Key works, but model "${cfg.model}" is not available to it. Set AI_MODEL to one of: ${names.slice(0, 25).join(", ") || "(none listed)"}.` };
      }
      const url = cfg.provider === "anthropic" ? `${cfg.base}/v1/models` : `${cfg.base}/v1/models`; const headers: Record<string, string> = cfg.provider === "anthropic" ? { "x-api-key": cfg.key, "anthropic-version": "2023-06-01" } : { Authorization: `Bearer ${cfg.key}` };
      const r = await fetch(url, { headers, signal: ctl.signal, cache: "no-store" }); const j: any = await r.json().catch(() => null);
      if (r.status !== 200) return { ok: false, message: errOf(r.status, j) + ` Check ${KEYS[cfg.provider]}.` };
      return { ok: true, message: `Key accepted by ${cfg.provider}. Model in use: ${cfg.model}.` };
    } finally { clearTimeout(t); }
  } catch { return { ok: false, message: "Could not reach the AI provider." }; }
}

/** Poster picture from Gemini (needs AI_PROVIDER=gemini). Sends the product photo(s) + instructions, returns one PNG/JPEG. Model name: AI_IMAGE_MODEL (default gemini-2.5-flash-image). */
export async function generateImage(cfg: AiConfig, prompt: string, image: AiImage | AiImage[], aspect: string, env: Record<string, string | undefined> = process.env): Promise<{ ok: boolean; mime?: string; base64?: string; error?: string }> {
  if (cfg.provider !== "gemini") return { ok: false, error: "Poster pictures need AI_PROVIDER=gemini in Netlify." };
  const imgs = Array.isArray(image) ? image : [image]; const tryModels = [...new Set([(env.AI_IMAGE_MODEL || "").trim(), "gemini-3.1-flash-image", "gemini-nano-banana-2.1", "gemini-2.5-flash-image"].filter(Boolean))]; let model = tryModels[0];
  try {
    let status = 0; let json: any = null;
    for (const m of tryModels) { model = m; ({ status, json } = await post(`${cfg.base}/v1beta/models/${encodeURIComponent(m)}:generateContent`, { "x-goog-api-key": cfg.key }, { contents: [{ role: "user", parts: [{ text: prompt }, ...imgs.map(im => ({ inline_data: { mime_type: im.mime, data: im.base64 } }))] }], generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: aspect } } })); if (status !== 404) break; }
    if (status !== 200) return { ok: false, error: errOf(status, json) + (status === 404 ? ` Model "${model}" not found: set AI_IMAGE_MODEL.` : status === 429 ? " Free limit reached for pictures. Try later or enable billing in Google AI Studio." : "") };
    const parts: any[] = json?.candidates?.[0]?.content?.parts ?? []; const img = parts.map(x => x.inlineData ?? x.inline_data).find(x => x?.data);
    if (!img) return { ok: false, error: "Gemini did not return a picture" + (parts.find(x => x.text)?.text ? ": " + String(parts.find(x => x.text).text).slice(0, 140) : ". Try again with a simpler note.") };
    return { ok: true, mime: img.mimeType ?? img.mime_type ?? "image/png", base64: img.data };
  } catch (e) { return { ok: false, error: e instanceof Error && e.name === "AbortError" ? "The AI took too long. Try again." : "Could not reach the AI provider." }; }
}
