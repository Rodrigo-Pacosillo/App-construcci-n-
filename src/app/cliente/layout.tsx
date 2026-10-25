import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ClienteSidebar } from "@/components/cliente/ClienteSidebar";

export default async function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login?callbackUrl=/cliente");
  }

  if (session.user?.role !== "cliente") {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <ClienteSidebar email={session.user?.email || ""} />
      <main className="flex-1 p-4 lg:p-8">{children}</main>
    </div>
  );
}
