import { notFound } from "next/navigation";
import { getClienteById } from "../actions";
import { ClienteDetalle } from "@/components/admin/ClienteDetalle";

export const dynamic = "force-dynamic";

export default async function AdminClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cliente = await getClienteById(id);

  if (!cliente) {
    notFound();
  }

  return <ClienteDetalle cliente={cliente} />;
}
