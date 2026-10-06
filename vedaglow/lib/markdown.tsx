import Link from "next/link";
import type { ReactNode } from "react";
/** Tiny, safe formatter for page text: ## headings, - lists, **bold**, [text](link). No raw HTML is ever rendered. */
const safeHref = (h: string) => /^(https?:\/\/|\/|mailto:|tel:)/i.test(h.trim()) ? h.trim() : "#";
function inline(t: string, key: string): ReactNode[] {
  return t.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).filter(Boolean).map((part, i) => {
    const b = part.match(/^\*\*([^*]+)\*\*$/); if (b) return <strong key={`${key}${i}`}>{b[1]}</strong>;
    const l = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (l) { const h = safeHref(l[2]); return h.startsWith("/") ? <Link key={`${key}${i}`} href={h} className="font-semibold text-forest underline">{l[1]}</Link> : <a key={`${key}${i}`} href={h} className="font-semibold text-forest underline" rel="noopener noreferrer">{l[1]}</a>; }
    return part;
  });
}
export function Markdown({ text }: { text: string }) {
  const blocks = text.replace(/\r/g, "").split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
  return <div className="space-y-4 text-lg leading-relaxed text-ink/80">{blocks.map((b, i) => {
    if (/^###\s/.test(b)) return <h3 key={i} className="pt-2 font-display text-2xl font-semibold text-forest">{inline(b.replace(/^###\s/, ""), `h${i}`)}</h3>;
    if (/^##\s/.test(b)) return <h2 key={i} className="pt-3 font-display text-3xl font-semibold text-forest">{inline(b.replace(/^##\s/, ""), `h${i}`)}</h2>;
    if (/^#\s/.test(b)) return <h2 key={i} className="pt-3 font-display text-3xl font-semibold text-forest">{inline(b.replace(/^#\s/, ""), `h${i}`)}</h2>;
    const lines = b.split("\n");
    if (lines.every(l => /^[-*]\s/.test(l))) return <ul key={i} className="list-disc space-y-1.5 pl-6">{lines.map((l, k) => <li key={k}>{inline(l.replace(/^[-*]\s/, ""), `l${i}${k}`)}</li>)}</ul>;
    const head = lines[0].match(/^##\s(.*)$/);
    if (head) return <div key={i}><h2 className="pt-3 font-display text-3xl font-semibold text-forest">{inline(head[1], `x${i}`)}</h2><Markdown text={lines.slice(1).join("\n")} /></div>;
    return <p key={i}>{lines.map((l, k) => <span key={k}>{k > 0 && <br />}{inline(l, `p${i}${k}`)}</span>)}</p>;
  })}</div>;
}
