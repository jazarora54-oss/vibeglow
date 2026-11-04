import LoginForm from "@/components/admin/LoginForm";
export default async function Page(props: { searchParams: Promise<{ error?: string; mfa?: string }> }) { const searchParams = await props.searchParams; return <LoginForm notAdmin={searchParams.error === "notadmin"} needCode={searchParams.mfa === "1"} />; }
