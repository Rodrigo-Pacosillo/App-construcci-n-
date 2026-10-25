import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { EmpleadosList } from "@/components/admin/EmpleadosList";

type EmpleadoDisplay = {
  id: string;
  nombre: string;
  apellidos: string;
  ci: string;
  telefono: string;
  cargo: string;
  fechaIngreso: Date;
  salario: number | null;
  activo: boolean;
};

export default async function AdminEmpleadosPage() {
  await requireAdmin();

  const empleados = await prisma.empleado.findMany({
    orderBy: { creadoEn: "desc" },
    take: 50,
  });

  const display: EmpleadoDisplay[] = empleados.map((e) => ({
    ...e,
    salario: e.salario ? Number(e.salario) : null,
  }));

  return <EmpleadosList empleados={display} />;
}