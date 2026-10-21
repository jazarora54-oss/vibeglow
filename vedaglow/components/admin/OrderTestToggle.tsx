"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setOrderTest } from "@/app/admin/actions";
import { btn2 } from "./ui";
/** Marks an order as a test order. Test orders are left out of the dashboard's sales numbers. */
export default function OrderTestToggle({ id, isTest }: { id: string; isTest: boolean }) {
  const [pending, start] = useTransition(); const [msg, setMsg] = useState(""); const router = useRouter();
  return <div className={`flex flex-wrap items-center gap-3 rounded-xl p-3 text-sm ${isTest ? "bg-amber-50 text-amber-900" : "bg-white text-ink/70 shadow-card"}`}>
    <span>{isTest ? <><b>TEST ORDER.</b> It is not counted in sales on the dashboard.</> : "Placed this order yourself to try the shop? Mark it as a test so it is not counted in sales."}</span>
    <button className={btn2} disabled={pending} onClick={() => start(async () => { const r = await setOrderTest(id, !isTest); setMsg(r.ok ? "" : r.message ?? "Failed"); router.refresh(); })}>{isTest ? "Count it as a real order" : "Mark as test order"}</button>
    {msg && <span role="alert" className="text-red-700">⚠ {msg}</span>}</div>;
}
