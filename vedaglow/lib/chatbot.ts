import { getFaqs } from "@/lib/data/site";
import { getProducts } from "@/lib/data/products";
import { money } from "@/lib/format";
const STOP = new Set("a an the is are am to of for in on at and or do does can i you your my me we it this that with how what when where why which please tell about any have has get be".split(" "));
const tokens = (t: string) => t.toLowerCase().replace(/[^a-z0-9$ ]/g, " ").split(/\s+/).filter(w => w.length > 1 && !STOP.has(w));
const stem = (w: string) => w.replace(/(ing|ed|es|s)$/, "");
const FALLBACK = "I am not sure about that one. You can send us a message on our Contact page (/contact) and our team will reply. Or try asking about shipping, returns, coupons, tracking your order, or a product.";
/**
 * Free, rule-based assistant: answers from the FAQs you manage in admin, finds products by name, and sends everything else to the Contact page.
 * (An AI model can be plugged in later; this works without any paid service.)
 */
export async function answerQuestion(message: string): Promise<string> {
  const text = String(message ?? "").slice(0, 300).trim();
  if (!text) return "Please type your question.";
  if (/^(hi|hello|hey|hii|namaste|salam|good (morning|afternoon|evening))\b/i.test(text) && text.length < 25) return "Hello! 👋 I can help with shipping, returns, coupons, order tracking and products. What would you like to know?";
  if (/^(thanks|thank you|thx|ok thanks|shukriya|dhanyavad)\b/i.test(text)) return "You are welcome! Anything else I can help with?";
  const q = tokens(text).map(stem); if (!q.length) return FALLBACK;

  const faqs = await getFaqs();
  let best: { score: number; a: string } | null = null;
  for (const f of faqs) {
    const hay = new Set(tokens(`${f.question} ${f.keywords}`).map(stem));
    const score = q.filter(w => hay.has(w)).length;
    if (score > (best?.score ?? 0)) best = { score, a: f.answer };
  }
  if (best && (best.score >= 2 || q.length <= 2)) return best.a;

  const products = await getProducts();
  const hits = products.map(p => { const hay = new Set(tokens(`${p.name} ${p.product_type ?? ""} ${p.category.replace("-", " ")} ${p.brand ?? ""}`).map(stem)); return { p, s: q.filter(w => hay.has(w)).length }; })
    .filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 3);
  if (hits.length) return `Here is what I found:\n${hits.map(h => `• ${h.p.name} (${money(h.p.price)})${h.p.stock <= 0 ? " - out of stock" : ""}: /product/${h.p.slug}`).join("\n")}`;
  if (best) return best.a;
  return FALLBACK;
}
