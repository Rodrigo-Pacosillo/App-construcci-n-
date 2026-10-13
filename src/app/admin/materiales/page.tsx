import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminMaterialesPage() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/admin");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold">Materiales</h1>
        <p className="mt-2 text-ink-muted">
          Control de inventario de materiales de construcción: cemento, arena, fierro,
          aislaciones, placas de yeso, revestimientos y demás insumos.
        </p>
      </div>

      <div className="rounded border border-border bg-surface p-8">
        <div className="text-center space-y-4">
          <div className="rounded-full border-2 border-accent w-16 h-16 mx-auto flex items-center justify-center">
            <span className="text-2xl font-bold text-accent">📦</span>
          </div>
          <h2 className="font-heading text-2xl font-bold">Módulo en construcción</h2>
          <p className="text-ink-muted max-w-md mx-auto">
            Aquí se gestionará el stock de materiales, alertas de stock mínimo, costos unitarios
            y consumo por obra.
          </p>
          <div className="mt-6 space-x-4 justify-center flex flex-wrap">
            <button className="accent-btn rounded px-6 py-2 text-sm font-medium">
              + Nuevo material
            </button>
            <button className="rounded px-6 py-2 text-sm font-medium bg-ink/5 text-ink hover:bg-ink/10">
              Ajuste de inventario
            </button>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <h3 className="font-heading text-lg font-bold mb-4">Funcionalidades previstas:</h3>
          <ul className="space-y-2 text-sm text-ink-muted">
            <li>• Listado con stock actual, stock mínimo, unidad de medida, precio de referencia</li>
            <li>• Alertas visuales cuando stock ≤ stock mínimo (reposición urgente)</li>
            <li>• Registro de entradas (compras) y salidas (consumo en obras)</li>
            <li>• Consumo por obra: qué material se usó, cuánto, a qué precio, en qué fecha</li>
            <li>• Valorización de inventario y costos por obra</li>
            <li>• Proveedores y órdenes de compra (futuro)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}