"use client";
import { useState } from "react";
import { X, Send } from "lucide-react";
import Link from "next/link";
import type { ChatMessage } from "@/types";
/** Turns /paths in assistant replies into tappable links. */
const linkify = (t: string) => t.split(/(\/[a-z][a-z0-9/_-]*)/gi).map((p, i) => /^\/[a-z]/i.test(p) ? <Link key={i} href={p} className="font-semibold text-forest underline">{p}</Link> : p);
interface Props { onClose: () => void; onSend?: (history: ChatMessage[]) => Promise<string> } // plug an API call into onSend in Step 6
export default function AIChatWindow({ onClose, onSend }: Props) {
  const [msgs, setMsgs] = useState<ChatMessage[]>([{ id: "w", role: "assistant", content: "Hi! 👋 How can I help you today? Ask about products, shipping, returns, coupons or your order." }]);
  const [text, setText] = useState("");
  const send = async (e: React.FormEvent) => {
    e.preventDefault(); if (!text.trim()) return;
    const next = [...msgs, { id: crypto.randomUUID(), role: "user" as const, content: text }]; setMsgs(next); setText("");
    const reply = onSend ? await onSend(next) : "Please use our Contact page (/contact) and we will reply.";
    setMsgs(m => [...m, { id: crypto.randomUUID(), role: "assistant", content: reply }]);
  };
  return (
    <div role="dialog" aria-label="VEDAGLOW Assistant" className="fixed bottom-24 right-4 z-50 flex h-[28rem] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-lift">
      <div className="flex items-center justify-between bg-forest px-4 py-3 text-white"><b>VEDAGLOW Assistant</b><button onClick={onClose} aria-label="Close chat"><X size={18} /></button></div>
      <div className="flex-1 space-y-2 overflow-y-auto bg-cream p-4 text-sm" aria-live="polite">
        {msgs.map(m => <p key={m.id} className={`max-w-[85%] whitespace-pre-line rounded-xl px-3 py-2 ${m.role === "user" ? "ml-auto bg-forest text-white" : "bg-white shadow-card"}`}>{m.role === "assistant" ? linkify(m.content) : m.content}</p>)}</div>
      <form onSubmit={send} className="flex gap-2 border-t p-3"><input value={text} onChange={e => setText(e.target.value)} aria-label="Message" placeholder="Ask me anything" className="min-w-0 flex-1 rounded-md border border-forest/20 px-3 py-2 text-sm" />
        <button aria-label="Send" className="grid h-10 w-10 place-items-center rounded-md bg-gold text-white"><Send size={16} /></button></form>
    </div>
  );
}
