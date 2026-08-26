import { redirect } from "next/navigation";

import AdminDashboard from "@/components/admin/AdminDashboard";
import { getAdminSession, listAdminAccounts } from "@/lib/auth";
import { getAdminDashboard } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Painel administrativo",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const session = await getAdminSession();

  if (!session) redirect("/admin/login");

  const [dashboard, initialAccounts] = await Promise.all([
    getAdminDashboard(),
    session.role === "owner" && !session.mustChangePassword
      ? listAdminAccounts()
      : Promise.resolve([]),
  ]);

  return (
    <AdminDashboard
      key={session.id}
      initialDashboard={{
        ...dashboard,
        directoryEntries:
          dashboard.directoryEntries || dashboard.directory || dashboard.services || [],
      }}
      initialAdmin={session}
      initialAccounts={initialAccounts}
    />
  );
}
