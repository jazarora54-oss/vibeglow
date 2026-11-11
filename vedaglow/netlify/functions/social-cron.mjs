// Netlify scheduled function: every 15 minutes it asks the shop to post anything that is due.
// Netlify runs scheduled functions on the PRODUCTION deploy only. Needs SOCIAL_CRON_SECRET in Netlify environment variables.
export default async () => {
  const base = (process.env.URL || "").replace(/\/$/, ""); const secret = process.env.SOCIAL_CRON_SECRET;
  if (!base || !secret) return new Response("not configured", { status: 200 });
  const r = await fetch(`${base}/api/social/run`, { method: "POST", headers: { "x-cron-secret": secret } }); return new Response(await r.text(), { status: 200 });
};
export const config = { schedule: "*/15 * * * *" };
