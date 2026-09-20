import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CotizacionesLista } from "@/components/cliente/CotizacionesLista";

async function getCotizaciones() {
  const session = await auth();
  if (!session || session.user.role !== "cliente") redirect("/login");

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    include: { cliente: true },
  });

  if (!usuario?.cliente) return [];

  const cotizaciones = await prisma.cotizacion.findMany({
    where: { clienteId: usuario.cliente.id },
    orderBy: { creadoEn: "desc" },
    include: { cliente: true },
  });

  return cotizaciones.map((c) => ({
    ...c,
    montoCerrado: c.montoCerrado ? Number(c.montoCerrado) : null,
  }));
}

export default async function ClientCotizacionesPage() {
  const cotizaciones = await getCotizaciones();

  return <CotizacionesLista cotizaciones={cotizaciones} />;
}