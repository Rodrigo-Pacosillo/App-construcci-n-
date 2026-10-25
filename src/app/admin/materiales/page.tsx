import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { MaterialesList } from "@/components/admin/MaterialesList";

type MaterialDisplay = {
  id: string;
  nombre: string;
  unidad: string;
  stockActual: number;
  stockMinimo: number;
  precioUnitario: number;
  activo: boolean;
};

export default async function AdminMaterialesPage() {
  await requireAdmin();

  const materiales = await prisma.material.findMany({
    orderBy: { nombre: "asc" },
    take: 100,
  });

  const display: MaterialDisplay[] = materiales.map((m) => ({
    ...m,
    stockActual: Number(m.stockActual),
    stockMinimo: Number(m.stockMinimo),
    precioUnitario: Number(m.precioUnitario),
  }));

  return <MaterialesList materiales={display} />;
}