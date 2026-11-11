"use client";
import { useState, useTransition } from "react";
import { emailInvoice } from "@/app/admin/actions";
/** Sends the invoice PDF to the customer. Printing/downloading never sends anything. */
export default function EmailInvoiceButton({ orderId, email }: { orderId: string; email: string }) {
  const [msg, setMsg] = useState(""), [p, go] = useTransition();
  return (<span className="inline-flex flex-wrap items-center gap-2 print:hidden"><button type="button" disabled={p} onClick={() => confirm(`Email the invoice PDF to ${email}?`) && go(async () => setMsg((await emailInvoice(orderId)).message ?? ""))} className="rounded-lg border border-forest/25 bg-white px-4 py-2 text-sm font-semibold text-forest hover:bg-forest-100">{p ? "Sending…" : "Email invoice to customer"}</button>{msg && <span role="status" className="text-sm text-ink/70">{msg}</span>}</span>);
}
