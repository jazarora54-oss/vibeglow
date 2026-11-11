import TwoFactorSetup from "@/components/admin/TwoFactorSetup";
export default async function Page(props: { searchParams: Promise<{ required?: string }> }) {
  const sp = await props.searchParams;
  return <div className="max-w-xl"><h1 className="mb-2 font-display text-4xl font-semibold text-forest">Security: 2-step verification</h1>
    {sp.required === "1" && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">2-step verification is required for admin accounts. Please set it up below to continue.</p>}
    <p className="mb-5 text-sm text-ink/70">Even if someone learns your password, they cannot open the admin panel without the 6-digit code from your phone. Free, works with Google Authenticator, Microsoft Authenticator or Authy.</p><TwoFactorSetup /></div>;
}
