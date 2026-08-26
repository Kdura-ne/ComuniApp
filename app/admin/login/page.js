import { redirect } from "next/navigation";

import LoginForm from "@/components/admin/LoginForm";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Acesso administrativo",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const session = await getAdminSession();

  if (session) redirect("/admin");

  return <LoginForm />;
}
