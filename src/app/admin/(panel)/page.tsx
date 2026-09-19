import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ESTADO_LABELS, ESTADO_COLORES } from "@/lib/constants";
import { getDashboardStats, getCotizacionesRecientes } from "./actions";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const stats = await getDashboardStats();
  const cotizaciones = await getCotizacionesRecientes();

  const estadosOrdenados = ["nuevo", "contactado", "visita_tecnica", "presupuestado", "ganado", "perdido"] as const;

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-ink/50">Bienvenido, {session.user?.name || "Admin"}</p>

      {/* Embudo */}
      <div className="mt-8">
        <p className="section-label mb-4 text-ink/40">EMBUDO DE COTIZACIONES</p>
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
          <p className="section-label text-ink/40">TOTAL COTIZACIONES</p>
          <p className="mt-2 font-heading text-3xl font-bold">{stats.totalCotizaciones}</p>
        </div>
        <div className="rounded border border-border bg-surface p-6">
          <p className="section-label text-ink/40">PROYECTOS</p>
          <p className="mt-2 font-heading text-3xl font-bold">{stats.proyectos}</p>
        </div>
        <div className="rounded border border-border bg-surface p-6">
          <p className="section-label text-ink/40">TESTIMONIOS PUBLICADOS</p>
          <p className="mt-2 font-heading text-3xl font-bold">{stats.testimonios}</p>
        </div>
      </div>

      {/* Cotizaciones recientes */}
      <div className="mt-8">
        <p className="section-label mb-4 text-ink/40">ULTIMAS COTIZACIONES</p>
        <div className="rounded border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 section-label text-ink/40">Cliente</th>
                  <th className="px-4 py-3 section-label text-ink/40">Tipo</th>
                  <th className="px-4 py-3 section-label text-ink/40">Origen</th>
                  <th className="px-4 py-3 section-label text-ink/40">Estado</th>
                  <th className="px-4 py-3 section-label text-ink/40">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {cotizaciones.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">{c.cliente?.nombre || "—"}</td>
                    <td className="px-4 py-3 capitalize">{c.tipoConstruccion}</td>
                    <td className="px-4 py-3 capitalize">{c.origen}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${ESTADO_COLORES[c.estado as keyof typeof ESTADO_COLORES] || "bg-gray-100 text-gray-800"}`}>
                        {ESTADO_LABELS[c.estado as keyof typeof ESTADO_LABELS] || c.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink/40">
                      {new Date(c.creadoEn).toLocaleDateString("es-AR")}
                    </td>
                  </tr>
                ))}
                {cotizaciones.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-ink/30">
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
