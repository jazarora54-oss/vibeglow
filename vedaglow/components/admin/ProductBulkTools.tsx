"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bulkUpdateProducts, commitProductImport, previewProductImport, type BulkAction, type ImportPreview } from "@/app/admin/actions";
import { parseCsv } from "@/lib/csv";
import { btn, btn2, inp, lbl } from "./ui";
/** The tick box in the table header: ticks / unticks every product row. */
export function SelectAll() {
  return <input type="checkbox" aria-label="Select all products" className="h-4 w-4 accent-forest" onChange={e => document.querySelectorAll<HTMLInputElement>('input[name="ids"][form="bulk-form"]').forEach(c => { c.checked = e.target.checked; })} />;
}
const TAGS: [string, string][] = [["best-seller", "Best seller"], ["new", "New"], ["sale", "Sale"], ["featured", "Featured"]];
const ACTIONS = [["visible", "Make visible"], ["hidden", "Hide from shop"], ["category", "Move to category…"], ["price_percent", "Change price by %…"], ["stock_set", "Set stock to…"], ["stock_add", "Add / remove stock…"], ["tag_add", "Add badge…"], ["tag_remove", "Remove badge…"]] as const;
/** Bulk edit for the products ticked in the table (the ticks use the HTML form="bulk-form" link). */
export function BulkBar({ categories }: { categories: { slug: string; name: string }[] }) {
  const [type, setType] = useState<string>("visible"); const [value, setValue] = useState(""); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null); const [pending, start] = useTransition(); const router = useRouter(); const form = useRef<HTMLFormElement>(null);
  const needs = ["category", "price_percent", "stock_set", "stock_add", "tag_add", "tag_remove"].includes(type);
  const apply = () => {
    const ids = new FormData(form.current!).getAll("ids").map(String); if (!ids.length) { setMsg({ ok: false, t: "Tick at least one product in the list first." }); return; }
    let a: BulkAction;
    if (type === "visible" || type === "hidden") a = { type };
    else if (type === "category" || type === "tag_add" || type === "tag_remove") { if (!value) { setMsg({ ok: false, t: "Choose a value." }); return; } a = { type, value }; }
    else { const n = Number(value); if (value.trim() === "" || !Number.isFinite(n)) { setMsg({ ok: false, t: "Enter a number." }); return; } a = { type: type as "price_percent" | "stock_set" | "stock_add", value: n }; }
    const label = ACTIONS.find(x => x[0] === type)![1].replace("…", ""); if (!confirm(`${label}${needs ? ` (${value})` : ""} for ${ids.length} product${ids.length === 1 ? "" : "s"}?`)) return;
    start(async () => { const r = await bulkUpdateProducts(ids, a); setMsg({ ok: r.ok, t: r.message ?? (r.ok ? "Done." : "Failed") }); router.refresh(); });
  };
  return (<form id="bulk-form" ref={form} onSubmit={e => e.preventDefault()} className="flex flex-wrap items-end gap-3 rounded-2xl border border-forest/10 bg-white p-4 shadow-card">
    <div><label className={lbl} htmlFor="bt">Bulk edit the ticked products</label><select id="bt" className={inp} value={type} onChange={e => { setType(e.target.value); setValue(""); }}>{ACTIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
    {type === "category" && <div><label className={lbl} htmlFor="bv">Category</label><select id="bv" className={inp} value={value} onChange={e => setValue(e.target.value)}><option value="">Choose…</option>{categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></div>}
    {(type === "tag_add" || type === "tag_remove") && <div><label className={lbl} htmlFor="bv">Badge</label><select id="bv" className={inp} value={value} onChange={e => setValue(e.target.value)}><option value="">Choose…</option>{TAGS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>}
    {(type === "price_percent" || type === "stock_set" || type === "stock_add") && <div><label className={lbl} htmlFor="bv">{type === "price_percent" ? "Percent (e.g. -10 or 5)" : type === "stock_set" ? "Stock quantity" : "Add (use - to remove)"}</label><input id="bv" type="number" step={type === "price_percent" ? "0.1" : "1"} className={`${inp} w-36`} value={value} onChange={e => setValue(e.target.value)} /></div>}
    <button type="button" className={btn} disabled={pending} onClick={apply}>{pending ? "Working…" : "Apply"}</button>
    {msg && <p role="status" className={`basis-full text-sm font-medium ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.ok ? "✓ " : "⚠ "}{msg.t}</p>}</form>);
}
/** CSV import: choose a file -> it is CHECKED (nothing is saved) -> you confirm. */
export function CsvImport() {
  const [open, setOpen] = useState(false); const [table, setTable] = useState<string[][] | null>(null); const [file, setFile] = useState(""); const [upd, setUpd] = useState(false); const [pv, setPv] = useState<ImportPreview | null>(null); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null); const [pending, start] = useTransition(); const router = useRouter();
  const check = (t: string[][], u: boolean) => start(async () => { setPv(await previewProductImport(t, u)); });
  const pick = async (f: File | undefined) => {
    setMsg(null); setPv(null); setTable(null); if (!f) return; if (f.size > 1_500_000) { setMsg({ ok: false, t: "That file is too big (max 1.5 MB, about 500 products)." }); return; }
    const t = parseCsv(await f.text()); setTable(t); setFile(f.name); check(t, upd);
  };
  const ready = pv?.ok && pv.summary && pv.summary.error === 0 && (pv.summary.create + pv.summary.update) > 0;
  if (!open) return <button className={btn2} onClick={() => setOpen(true)}>Import CSV</button>;
  return (<div className="basis-full space-y-3 rounded-2xl border border-forest/10 bg-white p-4 shadow-card">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-2xl font-semibold text-forest">Import products from CSV</h2><button className={btn2} onClick={() => { setOpen(false); setTable(null); setPv(null); setMsg(null); }}>Close</button></div>
    <p className="text-sm text-ink/70">Tip: press <b>Export CSV</b> first and use that file as your template. Up to 500 products per file. New products from a file are saved <b>hidden</b> unless the <code>is_active</code> column says yes. Photos: paste full https:// links (upload photos inside the product page).</p>
    <input type="file" accept=".csv,text/csv" aria-label="Choose CSV file" onChange={e => pick(e.target.files?.[0])} className="block text-sm" />
    <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-forest" checked={upd} onChange={e => { setUpd(e.target.checked); if (table) check(table, e.target.checked); }} />Also update products that already exist (matched by ID, URL name or SKU). Only the columns with a value are changed.</label>
    {pending && <p className="text-sm text-ink/60">Checking…</p>}
    {pv && !pv.ok && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">⚠ {pv.message}</p>}
    {pv?.ok && pv.summary && <div className="space-y-2"><p className="text-sm"><b>{file}</b>: <span className="font-semibold text-green-700">{pv.summary.create} to create</span> · <span className="font-semibold text-blue-700">{pv.summary.update} to update</span> · {pv.summary.skip} skipped · <span className={pv.summary.error ? "font-semibold text-red-700" : ""}>{pv.summary.error} with errors</span></p>
      {(pv.unknown?.length ?? 0) > 0 && <p className="text-xs text-amber-800">These columns are not used and will be ignored: {pv.unknown!.join(", ")}.</p>}
      {(pv.problems?.length ?? 0) > 0 && <div className="max-h-64 overflow-auto rounded-lg border border-forest/10"><table className="w-full text-left text-xs"><thead className="bg-cream-dark"><tr><th className="p-2">Line</th><th className="p-2">Product</th><th className="p-2">Result</th><th className="p-2">Details</th></tr></thead><tbody className="divide-y divide-forest/10">{pv.problems!.map(p => <tr key={p.line}><td className="p-2">{p.line}</td><td className="p-2">{p.name}</td><td className={`p-2 font-semibold ${p.action === "error" ? "text-red-700" : "text-ink/60"}`}>{p.action}</td><td className="p-2">{p.text}</td></tr>)}</tbody></table></div>}
      {pv.summary.error > 0 && <p className="text-sm text-red-700">Fix the rows with errors in your file and choose it again. Nothing is imported while any row has an error.</p>}
      <button className={btn} disabled={!ready || pending} onClick={() => confirm(`Import now? ${pv.summary!.create} new, ${pv.summary!.update} updated.`) && start(async () => { const r = await commitProductImport(table!, upd); setMsg({ ok: r.ok, t: r.message ?? "" }); if (r.ok) { setTable(null); setPv(null); router.refresh(); } })}>Import {pv.summary.create + pv.summary.update} products</button></div>}
    {msg && <p role="status" className={`text-sm font-medium ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.ok ? "✓ " : "⚠ "}{msg.t}</p>}</div>);
}
