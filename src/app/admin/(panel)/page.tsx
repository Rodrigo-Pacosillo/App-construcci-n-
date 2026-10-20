import Link from "next/link";
import {
  ESTADO_LABELS,
  ESTADO_COLORES,
  ESTADOS_COTIZACION,
} from "@/lib/constants";
import { requireAdmin } from "@/lib/auth-utils";
import {
  getDashboardStats,
  getCotizacionesRecientes,
  getDashboardAlertas,
} from "./actions";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  const session = await requireAdmin();
  const { aviso } = await searchParams;

  const [stats, cotizaciones, alertas] = await Promise.all([
    getDashboardStats(),
    getCotizacionesRecientes(),
    getDashboardAlertas(),
  ]);

  const hayAlertas =
    alertas.nuevasSinContactar.length > 0 ||
    alertas.obrasPausadas.length > 0 ||
    alertas.contratadasSinContrato.length > 0;

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-ink-muted">Bienvenido, {session.user?.name || "Admin"}</p>

      {aviso === "modulo" && (
        <div className="mt-6 rounded border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-ink">
          Módulo no disponible en esta versión.
        </div>
      )}

      {/* Alertas accionables */}
      <div className="mt-8">
        <p className="section-label mb-4 text-ink-faint">ALERTAS ACCIONABLES</p>
        <div className="space-y-3">
          {alertas.nuevasSinContactar.length > 0 && (
            <Alerta
              texto={`${alertas.nuevasSinContactar.length} cotización${
                alertas.nuevasSinContactar.length === 1 ? "" : "es"
              } nueva${alertas.nuevasSinContactar.length === 1 ? "" : "s"} sin contactar hace más de 24 hs`}
              href="/admin/cotizaciones?estado=nuevo"
              cta="Ver y resolver"
            />
          )}
          {alertas.obrasPausadas.length > 0 && (
            <Alerta
              texto={`${alertas.obrasPausadas.length} obra${
                alertas.obrasPausadas.length === 1 ? "" : "s"
              } pausada${alertas.obrasPausadas.length === 1 ? "" : "s"}: ${alertas.obrasPausadas
                .map((o) => o.direccionObra)
                .join(" · ")}`}
              href="/admin/obras?estado=pausada"
              cta="Ver"
            />
          )}
          {alertas.contratadasSinContrato.length > 0 && (
            <Alerta
              texto={`${alertas.contratadasSinContrato.length} cliente${
                alertas.contratadasSinContrato.length === 1 ? "" : "s"
              } con cotización contratada pero sin contrato`}
              href="/admin/contratos/new"
              cta="Ver"
            />
          )}
          {!hayAlertas && (
            <div className="flex items-center gap-3 rounded border border-border bg-surface px-4 py-3 text-sm text-ink-muted">
              <span className="text-green-600">✓</span>
              Todo en orden — sin alertas.
            </div>
          )}
        </div>
      </div>

      {/* Embudo clickeable */}
      <div className="mt-8">
        <p className="section-label mb-4 text-ink-faint">EMBUDO DE COTIZACIONES</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ESTADOS_COTIZACION.map((estado) => (
            <Link
              key={estado}
              href={`/admin/cotizaciones?estado=${estado}`}
              className="group rounded border border-border bg-surface p-4 text-center transition-colors hover:border-accent"
            >
              <span
                className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${ESTADO_COLORES[estado]}`}
              >
                {ESTADO_LABELS[estado]}
              </span>
              <p className="mt-2 font-heading text-3xl font-bold">
                {stats.porEstado[estado] || 0}
              </p>
              <span className="mt-1 inline-block text-xs text-ink-faint group-hover:text-accent">
                Ver →
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Accesos frecuentes */}
      <div className="mt-8">
        <p className="section-label mb-4 text-ink-faint">ACCIONES FRECUENTES</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <AccionRapida href="/admin/cotizaciones" titulo="+ Cotización" detalle="Revisar el embudo y cargar una cotización" />
          <AccionRapida href="/admin/contratos/new" titulo="+ Contrato" detalle="Crear un contrato desde una cotización contratada" />
          <AccionRapida href="/admin/usuarios" titulo="Usuarios" detalle="Gestionar cuentas de acceso de clientes" />
        </div>
      </div>

      {/* Cotizaciones recientes */}
      <div className="mt-8">
        <p className="section-label mb-4 text-ink-faint">ÚLTIMAS COTIZACIONES</p>
        <div className="rounded border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="section-label px-4 py-3 text-ink-faint">Cliente</th>
                  <th className="section-label px-4 py-3 text-ink-faint">Tipo</th>
                  <th className="section-label px-4 py-3 text-ink-faint">Origen</th>
                  <th className="section-label px-4 py-3 text-ink-faint">Estado</th>
                  <th className="section-label px-4 py-3 text-ink-faint">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {cotizaciones.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/admin/cotizaciones/${c.id}`} className="font-medium hover:text-accent">
                        {c.cliente?.nombre || "—"}
                      </Link>
                      {c.cliente?.apellidos && (
                        <p className="text-xs text-ink-faint">{c.cliente.apellidos}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 capitalize">{c.tipoConstruccion.replace("_", " ")}</td>
                    <td className="px-4 py-3 capitalize">{c.origen}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                          ESTADO_COLORES[c.estado as keyof typeof ESTADO_COLORES] ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
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
                      No hay cotizaciones aún
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

function Alerta({ texto, href, cta }: { texto: string; href: string; cta: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-border bg-surface px-4 py-3">
      <p className="text-sm text-ink">
        <span className="mr-2 text-accent">⚠</span>
        {texto}
      </p>
      <Link href={href} className="text-sm font-medium text-accent-strong hover:underline">
        {cta} →
      </Link>
    </div>
  );
}

function AccionRapida({
  href,
  titulo,
  detalle,
}: {
  href: string;
  titulo: string;
  detalle: string;
}) {
  return (
    <Link
      href={href}
      className="rounded border border-border bg-surface p-6 transition-colors hover:border-accent"
    >
      <p className="font-heading text-lg font-bold">{titulo}</p>
      <p className="mt-2 text-sm text-ink-muted">{detalle}</p>
    </Link>
  );
}
