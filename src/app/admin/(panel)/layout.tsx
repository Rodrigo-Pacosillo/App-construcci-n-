import { requireAdmin } from "@/lib/auth-utils";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <AdminSidebar email={session.user?.email || ""} />
      <main className="flex-1 p-4 lg:p-8">{children}</main>
    </div>
  );
}
