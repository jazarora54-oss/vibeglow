"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteProducts } from "@/app/admin/actions-extra";
/** "Delete ticked products": reads the tick boxes of the products table (name="ids"), asks once, then deletes them. */
export default function DeleteSelected() {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(""); const [bad, setBad] = useState(false);
  const run = async () => {
    const boxes = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="ids"]:checked')); const ids = boxes.map(b => b.value);
    if (!ids.length) { setBad(true); setMsg("Tick the products you want to delete first."); return; }
    const names = boxes.slice(0, 6).map(b => "• " + (b.getAttribute("aria-label") || "").replace(/^Select /, ""));
    if (!confirm(`Delete ${ids.length} product${ids.length === 1 ? "" : "s"} permanently?\n\n${names.join("\n")}${ids.length > 6 ? `\n…and ${ids.length - 6} more` : ""}\n\nThis cannot be undone. (To only hide a product, use Bulk edit → Hidden.)`)) return;
    setBusy(true); setMsg(""); try { const r = await deleteProducts(ids); setBad(!r.ok); setMsg(r.message ?? (r.ok ? "Deleted." : "Could not delete.")); if (r.ok) router.refresh(); } catch (e) { setBad(true); setMsg(e instanceof Error ? e.message : "Could not delete."); } finally { setBusy(false); }
  };
  return (<div className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
    <button type="button" onClick={run} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"><Trash2 size={16} />{busy ? "Deleting…" : "Delete ticked products"}</button>
    <span className="text-xs text-red-900">Tick the boxes in the list below, then press this button. It cannot be undone.</span>
    {msg && <span role="status" className={`text-sm font-medium ${bad ? "text-red-800" : "text-green-800"}`}>{msg}</span>}
  </div>);
}
