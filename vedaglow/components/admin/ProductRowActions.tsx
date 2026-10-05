"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { importDemoProducts, setProductActive } from "@/app/admin/actions";
import { btn } from "./ui";
export function ToggleActive({ id, active }: { id: string; active: boolean }) {
  const [pending, start] = useTransition(); const router = useRouter();
  return <button type="button" disabled={pending} onClick={() => start(async () => { await setProductActive(id, !active); router.refresh(); })} className={`rounded-full px-3 py-1 text-xs font-semibold ${active ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"}`}>{active ? "Visible" : "Hidden"}</button>;
}
export function ImportDemo() {
  const [pending, start] = useTransition(); const router = useRouter();
  return <button type="button" disabled={pending} onClick={() => start(async () => { const r = await importDemoProducts(); if (!r.ok) alert(r.message); router.refresh(); })} className={btn}>{pending ? "Importing…" : "Import demo products"}</button>;
}
