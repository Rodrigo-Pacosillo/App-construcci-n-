import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ESTADO_LABELS, ESTADO_COLORES } from "@/lib/constants";
import { getDashboardStats, getCotizacionesRecientes } from "./actions";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/admin");

  const stats = await getDashboardStats();
  const cotizaciones = await getCotizacionesRecientes();

  const estadosOrdenados = ["nuevo", "contactado", "visita_tecnica", "presupuestado", "ganado", "perdido"] as const;

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-ink-muted">Bienvenido, {session.user?.name || "Admin"}</p>

      {/* Embudo */}
      <div className="mt-8">
        <p className="section-label mb-4 text-ink-faint">EMBUDO DE COTIZACIONES</p>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {estadosOrdenados.map((estado) => (
            <div
              key={estado}
              className="rounded border border-border bg-surface p-4 text-center"
            >
              <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${ESTADO_COLORES[estado]}`}>
                {ESTADO_LABELS[estado]}
              </span>
              <p className="mt-2 font-heading text-3xl font-bold">
                {stats.porEstado[estado] || 0}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded border border-border bg-surface p-6">
          <p className="section-label text-ink-faint">TOTAL COTIZACIONES</p>
          <p className="mt-2 font-heading text-3xl font-bold">{stats.totalCotizaciones}</p>
        </div>
        <div className="rounded border border-border bg-surface p-6">
          <p className="section-label text-ink-faint">PROYECTOS</p>
          <p className="mt-2 font-heading text-3xl font-bold">{stats.proyectos}</p>
        </div>
        <div className="rounded border border-border bg-surface p-6">
          <p className="section-label text-ink-faint">TESTIMONIOS PUBLICADOS</p>
          <p className="mt-2 font-heading text-3xl font-bold">{stats.testimonios}</p>
        </div>
      </div>

      {/* Módulos de gestión (placeholders) */}
      <div className="mt-8">
        <p className="section-label mb-4 text-ink-faint">MÓDULOS DE GESTIÓN</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/empleados" className="rounded border border-border bg-surface p-6 hover:border-accent transition-colors">
            <p className="section-label text-ink-faint">EMPLEADOS</p>
            <p className="mt-2 font-heading text-lg font-bold">Personal</p>
            <p className="mt-2 text-sm text-ink-muted">Gestión de ingenieros, maestros, albañiles, electricistas, administrativos</p>
          </Link>
          <Link href="/admin/materiales" className="rounded border border-border bg-surface p-6 hover:border-accent transition-colors">
            <p className="section-label text-ink-faint">MATERIALES</p>
            <p className="mt-2 font-heading text-lg font-bold">Inventario</p>
            <p className="mt-2 text-sm text-ink-muted">Control de stock, reposición, costos de cemento, fierro, aislaciones, placas</p>
          </Link>
          <Link href="/admin/herramientas" className="rounded border border-border bg-surface p-6 hover:border-accent transition-colors">
            <p className="section-label text-ink-faint">HERRAMIENTAS</p>
            <p className="mt-2 font-heading text-lg font-bold">Equipos</p>
            <p className="mt-2 text-sm text-ink-muted">Préstamos, mantenimiento, estado de taladros, mezcladoras, andamios, etc.</p>
          </Link>
          <Link href="/admin/autorizar-cuentas" className="rounded border border-border bg-surface p-6 hover:border-accent transition-colors">
            <p className="section-label text-ink-faint">AUTORIZAR CUENTAS</p>
            <p className="mt-2 font-heading text-lg font-bold">Acceso cliente</p>
            <p className="mt-2 text-sm text-ink-muted">Crear cuentas para clientes con obra/contrato</p>
          </Link>
        </div>
      </div>

      {/* Cotizaciones recientes */}
      <div className="mt-8">
        <p className="section-label mb-4 text-ink-faint">ULTIMAS COTIZACIONES</p>
        <div className="rounded border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 section-label text-ink-faint">Cliente</th>
                  <th className="px-4 py-3 section-label text-ink-faint">Tipo</th>
                  <th className="px-4 py-3 section-label text-ink-faint">Origen</th>
                  <th className="px-4 py-3 section-label text-ink-faint">Estado</th>
                  <th className="px-4 py-3 section-label text-ink-faint">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {cotizaciones.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                    <p className="font-medium">{c.cliente?.nombre || "—"}</p>
                    {c.cliente?.apellidos && (
                      <p className="text-xs text-ink-faint">{c.cliente.apellidos}</p>
                    )}
                  </td>
                    <td className="px-4 py-3 capitalize">{c.tipoConstruccion}</td>
                    <td className="px-4 py-3 capitalize">{c.origen}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${ESTADO_COLORES[c.estado as keyof typeof ESTADO_COLORES] || "bg-gray-100 text-gray-800"}`}>
                        {ESTADO_LABELS[c.estado as keyof typeof ESTADO_LABELS] || c.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-faint">
                      {new Date(c.creadoEn).toLocaleDateString("es-AR")}
                    </td>
                  </tr>
                ))}
                {cotizaciones.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-ink-faint">
                      No hay cotizaciones aun
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
