"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Copy, Check, X } from "lucide-react";
interface Props { enabled: boolean; title: string; message: string; code: string; buttonText: string; buttonLink: string; delay: number }
const HIDE_ON = ["/admin", "/checkout", "/cart", "/order-confirmation"];
const AGAIN_AFTER_MS = 7 * 24 * 3600 * 1000; // a visitor who closes it sees it again after 7 days, or right away when you change the text
const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h).toString(36); };
/** Sale pop-up: message + coupon code (copy button) + button. Edited in admin -> Popup & Top bar. */
export default function PromoPopup({ enabled, title, message, code, buttonText, buttonLink, delay }: Props) {
  const path = usePathname() ?? "/"; const [open, setOpen] = useState(false); const [copied, setCopied] = useState(false); const closeRef = useRef<HTMLButtonElement>(null);
  const key = `vedaglow:promo:${hash([title, message, code, buttonLink].join("|"))}`; const blocked = HIDE_ON.some(p => path.startsWith(p));
  useEffect(() => {
    if (!enabled || blocked || open) return;
    try { const seen = Number(localStorage.getItem(key) ?? 0); if (seen && Date.now() - seen < AGAIN_AFTER_MS) return; } catch { /* storage blocked: just show it */ }
    const t = setTimeout(() => setOpen(true), Math.max(0, delay) * 1000); return () => clearTimeout(t);
  }, [enabled, blocked, key, delay, open]);
  const close = () => { setOpen(false); try { localStorage.setItem(key, String(Date.now())); } catch { /* ignore */ } };
  useEffect(() => { if (!open) return; closeRef.current?.focus(); const on = (e: KeyboardEvent) => e.key === "Escape" && close(); window.addEventListener("keydown", on); return () => window.removeEventListener("keydown", on); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  if (!open || !enabled || blocked) return null;
  const copy = async () => { try { await navigator.clipboard.writeText(code); } catch { const t = document.createElement("textarea"); t.value = code; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch { /* ignore */ } t.remove(); } setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const external = /^https?:\/\//i.test(buttonLink);
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4"><div className="absolute inset-0 bg-black/50" onClick={close} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label={title || "Special offer"} className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-cream text-center shadow-lift">
        <div className="bg-forest px-6 pb-5 pt-7 text-white"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-light">Special offer</p>
          {title && <h2 className="mt-2 font-display text-3xl font-semibold leading-tight">{title}</h2>}</div>
        <button ref={closeRef} type="button" onClick={close} aria-label="Close" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-white/80 hover:bg-white/15"><X size={20} /></button>
        <div className="space-y-4 px-6 py-6">
          {message && <p className="whitespace-pre-line text-ink/80">{message}</p>}
          {code && <div><p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink/60">Use code at checkout</p>
            <button type="button" onClick={copy} className="mx-auto flex items-center justify-center gap-3 rounded-lg border-2 border-dashed border-gold bg-white px-5 py-3 font-bold tracking-[0.15em] text-forest hover:bg-gold/10" aria-label={`Copy code ${code}`}>{code}{copied ? <Check size={18} className="text-forest-500" /> : <Copy size={18} className="text-gold-dark" />}</button>
            <p role="status" className="mt-1.5 h-4 text-xs font-medium text-forest-500">{copied ? "Code copied!" : ""}</p></div>}
          {external ? <a href={buttonLink} onClick={close} className="block rounded-lg bg-forest py-3 text-sm font-semibold tracking-wide text-white hover:bg-forest-500">{buttonText || "Shop now"}</a>
            : <Link href={buttonLink || "/shop"} onClick={close} className="block rounded-lg bg-forest py-3 text-sm font-semibold tracking-wide text-white hover:bg-forest-500">{buttonText || "Shop now"}</Link>}
          <button type="button" onClick={close} className="text-xs text-ink/50 underline-offset-4 hover:underline">No thanks</button>
        </div></div></div>
  );
}
