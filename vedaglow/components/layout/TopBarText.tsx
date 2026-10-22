"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
/** Shows the top bar messages; with more than one they take turns every 5 seconds (paused while hovered or focused). */
export default function TopBarText({ lines, ship, link, accent }: { lines: string[]; ship: string; link: string; accent: string }) {
  const [i, setI] = useState(0); const [hold, setHold] = useState(false);
  useEffect(() => { if (lines.length < 2 || hold) return; const t = setInterval(() => setI(n => (n + 1) % lines.length), 5000); return () => clearInterval(t); }, [lines.length, hold]);
  const text = lines.length ? lines[i % lines.length] : "";
  const body = <>{ship && <b className={accent}>{ship}</b>}{ship && text && <span className={`mx-2 ${accent}`}>|</span>}{text && <b className={accent}>{text}</b>}</>;
  const wrap = "inline-block";
  return <p aria-live="polite" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)} onFocus={() => setHold(true)} onBlur={() => setHold(false)}>
    {link ? (link.startsWith("/") ? <Link href={link} className={`${wrap} underline-offset-2 hover:underline`}>{body}</Link> : <a href={link} className={`${wrap} underline-offset-2 hover:underline`} rel="noopener noreferrer">{body}</a>) : <span className={wrap}>{body}</span>}</p>;
}
