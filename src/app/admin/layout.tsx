import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <AdminSidebar email={session.user?.email || ""} />
      <main className="flex-1 p-4 lg:p-8">{children}</main>
    </div>
  );
}
