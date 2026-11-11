"use client";
export default function PrintButton() { return <button type="button" onClick={() => window.print()} className="rounded-lg border border-forest/25 bg-white px-4 py-2 text-sm font-semibold text-forest hover:bg-forest-100 print:hidden">Print this order</button>; }
