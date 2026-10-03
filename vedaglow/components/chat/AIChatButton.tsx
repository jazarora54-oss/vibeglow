"use client";
import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import AIChatWindow from "./AIChatWindow";
export default function AIChatButton() {
  const [open, setOpen] = useState(false);
  return <>{open && <AIChatWindow onClose={() => setOpen(false)} />}
    <button onClick={() => setOpen(!open)} aria-label="Open VEDAGLOW Assistant" aria-expanded={open} className="fixed bottom-5 right-4 z-50 grid h-14 w-14 place-items-center rounded-full bg-forest text-white shadow-lift hover:bg-forest-500">{open ? <X /> : <MessageCircle />}</button></>;
}
