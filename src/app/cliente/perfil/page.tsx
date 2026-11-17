import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { PerfilForm } from "@/components/cliente/PerfilForm";

export default async function ClientePerfilPage() {
  const session = await auth();
  if (!session || session.user.role !== "cliente") redirect("/login");

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    include: {
      cliente: {
        include: {
          cotizaciones: { orderBy: { creadoEn: "desc" }, take: 1 },
        },
      },
    },
  });

  if (!usuario?.cliente) {
    redirect("/cliente");
  }

  const cotizacion = usuario.cliente.cotizaciones[0];

  return (
    <PerfilForm
      inicial={{
        nombre: usuario.cliente.nombre,
        apellidos: usuario.cliente.apellidos,
        telefono: usuario.cliente.telefono,
        ciudad: usuario.cliente.ciudad,
        emailContacto: usuario.cliente.email,
        clienteCreadoEn: usuario.cliente.creadoEn,
        emailAcceso: usuario.email,
        cuentaActiva: usuario.activo,
        cuentaCreadoEn: usuario.creadoEn,
        cotizacion: cotizacion
          ? {
              tipoObra: cotizacion.tipoObra,
              tipoConstruccion: cotizacion.tipoConstruccion,
              rangoM2: cotizacion.rangoM2,
              ubicacionObra: cotizacion.ubicacionObra,
              plazoInicio: cotizacion.plazoInicio,
              creadoEn: cotizacion.creadoEn,
            }
          : null,
      }}
    />
  );
}
