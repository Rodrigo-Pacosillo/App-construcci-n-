import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminEmpleadosPage() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/admin");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold">Empleados</h1>
        <p className="mt-2 text-ink-muted">
          Gestión del personal de la constructora: ingenieros, arquitectos, maestros de obra,
          albañiles, electricistas, plomeros, ayudantes y administrativos.
        </p>
      </div>

      <div className="rounded border border-border bg-surface p-8">
        <div className="text-center space-y-4">
          <div className="rounded-full border-2 border-accent w-16 h-16 mx-auto flex items-center justify-center">
            <span className="text-2xl font-bold text-accent">👷</span>
          </div>
          <h2 className="font-heading text-2xl font-bold">Módulo en construcción</h2>
          <p className="text-ink-muted max-w-md mx-auto">
            Aquí se listarán todos los empleados con su cargo, fecha de ingreso, salario y estado.
            Permitirá crear, editar, ver asignaciones a obras y préstamos de herramientas.
          </p>
          <div className="mt-6 space-x-4 justify-center flex flex-wrap">
            <button className="accent-btn rounded px-6 py-2 text-sm font-medium">
              + Nuevo empleado
            </button>
            <button className="rounded px-6 py-2 text-sm font-medium bg-ink/5 text-ink hover:bg-ink/10">
              Importar desde CSV
            </button>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <h3 className="font-heading text-lg font-bold mb-4">Funcionalidades previstas:</h3>
          <ul className="space-y-2 text-sm text-ink-muted">
            <li>• Listado con filtros por cargo, estado (activo/inactivo), búsqueda por nombre/CI</li>
            <li>• Ficha de empleado: datos personales, cargo, salario, historial de asignaciones</li>
            <li>• Asignación a obras: qué empleado está en qué obra, rol en la obra, fechas</li>
            <li>• Préstamos de herramientas: qué herramientas tiene asignadas cada empleado</li>
            <li>• Reportes: horas por obra, costo de mano de obra, rotación de personal</li>
          </ul>
        </div>
      </div>
    </div>
  );
}