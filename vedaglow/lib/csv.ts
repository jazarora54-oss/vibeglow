/** Small CSV reader/writer (quotes, commas and line breaks inside cells are handled). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], cell = "", q = false;
  const t = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && t[i + 1] === "\n") i++; row.push(cell); cell = ""; if (row.some(x => x.trim() !== "")) rows.push(row); row = []; }
    else cell += c;
  }
  row.push(cell); if (row.some(x => x.trim() !== "")) rows.push(row);
  return rows;
}
/** A text cell that starts with = + - @ could run as a formula when opened in Excel. A leading ' makes it plain text (removed again on import). */
const safe = (s: string) => /^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s) ? `'${s}` : s;
export const unsafe = (s: string) => /^'[=+\-@\t\r]/.test(s) ? s.slice(1) : s;
export function toCsv(columns: string[], rows: Record<string, string | number | boolean | null | undefined>[]): string {
  const esc = (v: string) => /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  return "\uFEFF" + [columns.map(esc).join(","), ...rows.map(r => columns.map(c => { const v = r[c]; return esc(v == null ? "" : typeof v === "number" ? String(v) : safe(String(v))); }).join(","))].join("\r\n") + "\r\n";
}
