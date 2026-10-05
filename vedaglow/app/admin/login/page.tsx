import LoginForm from "@/components/admin/LoginForm";
export default function Page({ searchParams }: { searchParams: { error?: string } }) { return <LoginForm notAdmin={searchParams.error === "notadmin"} />; }
