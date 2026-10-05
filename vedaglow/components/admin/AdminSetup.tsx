export default function AdminSetup() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-display text-4xl font-semibold text-forest">Backend not connected yet</h1>
      <p className="mt-3 text-ink/70">The admin panel needs Supabase. Follow <b>BACKEND-SETUP.md</b> (in the project folder), then add these in Vercel → Settings → Environment Variables and redeploy:</p>
      <pre className="mt-4 overflow-x-auto rounded-xl bg-ink p-4 text-sm text-cream">{`NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   (secret, server only)`}</pre>
    </div>
  );
}
