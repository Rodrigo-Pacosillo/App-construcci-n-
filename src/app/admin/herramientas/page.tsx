import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminHerramientasPage() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/admin");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold">Herramientas</h1>
        <p className="mt-2 text-ink-muted">
          Control de herramientas y equipos: taladros, mezcladoras, andamios, amoladoras,
          niveles l&aacute;ser y dem&aacute;s equipos de la constructora.
        </p>
      </div>

      <div className="rounded border border-border bg-surface p-8">
        <div className="text-center space-y-4">
          <div className="rounded-full border-2 border-accent w-16 h-16 mx-auto flex items-center justify-center">
            <span className="text-2xl font-bold text-accent">🔧</span>
          </div>
          <h2 className="font-heading text-2xl font-bold">M&oacute;dulo en construcci&oacute;n</h2>
          <p className="text-ink-muted max-w-md mx-auto">
            Aqu&iacute; se gestionar&aacute; el inventario de herramientas, su estado (disponible, en uso,
            mantenimiento, baja) y los pr&eacute;stamos a empleados por obra.
          </p>
          <div className="mt-6 space-x-4 justify-center flex flex-wrap">
            <button className="accent-btn rounded px-6 py-2 text-sm font-medium">
              + Nueva herramienta
            </button>
            <button className="rounded px-6 py-2 text-sm font-medium bg-ink/5 text-ink hover:bg-ink/10">
              Registrar devoluci&oacute;n
            </button>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <h3 className="font-heading text-lg font-bold mb-4">Funcionalidades previstas:</h3>
          <ul className="space-y-2 text-sm text-ink-muted">
            <li>&bull; Listado con c&oacute;digo &uacute;nico, nombre, estado actual, ubicaci&oacute;n</li>
            <li>&bull; Pr&eacute;stamos: qu&eacute; empleado retir&oacute; qu&eacute; herramienta, para qu&eacute; obra, cu&aacute;ndo</li>
            <li>&bull; Devoluciones: registro de fecha de devoluci&oacute;n, observaciones (da&ntilde;os, faltantes)</li>
            <li>&bull; Mantenimiento: cambio de estado a mantenimiento con observaciones</li>
            <li>&bull; Alertas: herramientas no devueltas despu&eacute;s de X d&iacute;as</li>
            <li>&bull; Historial completo por herramienta y por empleado</li>
          </ul>
        </div>
      </div>
    </div>
  );
}