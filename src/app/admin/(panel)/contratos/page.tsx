import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { ContratosList } from "@/components/admin/ContratosList";

type ContratoDisplay = {
  id: string;
  montoTotal: number;
  fechaFirma: Date | null;
  creadoEn: Date;
  cliente: { nombre: string; apellidos: string; email: string | null } | null;
  cotizacion: { tipoObra: string; estado: string } | null;
  obras: { id: string; direccionObra: string }[];
};

export default async function AdminContratosPage() {
  await requireAdmin();

  const contratos = await prisma.contrato.findMany({
    include: {
      cliente: { select: { nombre: true, apellidos: true, email: true } },
      cotizacion: { select: { tipoObra: true, estado: true } },
      obras: { select: { id: true, direccionObra: true } },
    },
    orderBy: { creadoEn: "desc" },
    take: 50,
  });

  const display: ContratoDisplay[] = contratos.map((c) => ({
    ...c,
    montoTotal: Number(c.montoTotal),
  }));

  return <ContratosList contratos={display} />;
}