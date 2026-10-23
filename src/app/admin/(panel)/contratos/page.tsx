import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { ContratosList } from "@/components/admin/ContratosList";

type ContratoDisplay = {
  id: string;
  montoTotal: number;
  creadoEn: Date;
  cliente: {
    id: string;
    nombre: string;
    apellidos: string;
    email: string | null;
    usuario?: { id: string } | null;
  } | null;
  cotizacion: { tipoObra: string; estado: string } | null;
  obras: { id: string; direccionObra: string }[];
};

export default async function AdminContratosPage() {
  await requireAdmin();

  const contratos = await prisma.contrato.findMany({
    include: {
      cliente: {
        select: {
          id: true,
          nombre: true,
          apellidos: true,
          email: true,
          usuario: { select: { id: true } },
        },
      },
      cotizacion: { select: { tipoObra: true, estado: true } },
      obras: { select: { id: true, direccionObra: true } },
    },
    orderBy: { creadoEn: "desc" },
    take: 100,
  });

  const display: ContratoDisplay[] = contratos.map((c) => ({
    ...c,
    montoTotal: Number(c.montoTotal),
  }));

  return <ContratosList contratos={display} />;
}