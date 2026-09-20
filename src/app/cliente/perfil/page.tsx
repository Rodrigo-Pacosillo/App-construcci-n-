import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { PerfilForm } from "@/components/cliente/PerfilForm";

export default async function ClientePerfilPage() {
  const session = await auth();
  if (!session || session.user.role !== "cliente") redirect("/login");

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    include: { cliente: true },
  });

  if (!usuario?.cliente) {
    redirect("/cliente");
  }

  return (
    <PerfilForm
      inicial={{
        nombre: usuario.cliente.nombre,
        whatsapp: usuario.cliente.whatsapp,
        ciudad: usuario.cliente.ciudad,
      }}
    />
  );
}
