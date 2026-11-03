import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
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

  const usuario = await prisma.usuario.findUnique({
    where: { id: session!.user.id },
    include: {
      cliente: {
        include: {
          cotizaciones: { orderBy: { creadoEn: "desc" }, take: 1 },
        },
      },
    },
  });

  const cliente = usuario?.cliente;
  const cotizacion = cliente?.cotizaciones[0];

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <ClienteSidebar
        email={session.user?.email || ""}
        clienteId={cliente?.id ?? ""}
        clienteNombre={cliente?.nombre ?? ""}
        cotizacionId={cotizacion?.id ?? undefined}
        cotizacionData={
          cotizacion
            ? {
                tipoObra: cotizacion.tipoObra,
                tipoConstruccion: cotizacion.tipoConstruccion,
                rangoM2: cotizacion.rangoM2,
                plazoInicio: cotizacion.plazoInicio,
              }
            : undefined
        }
      />
      <main className="flex-1 p-4 lg:p-8">{children}</main>
    </div>
  );
}
