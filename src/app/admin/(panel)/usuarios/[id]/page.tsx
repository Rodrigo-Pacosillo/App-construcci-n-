import { notFound } from "next/navigation";
import { getUsuarioById } from "../actions";
import { UsuarioDetalle } from "@/components/admin/UsuarioDetalle";

export const dynamic = "force-dynamic";

export default async function AdminUsuarioDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const usuario = await getUsuarioById(id);

  if (!usuario) {
    notFound();
  }

  return <UsuarioDetalle usuario={usuario} />;
}
