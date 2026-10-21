import Link from "next/link";
import { requireAdmin } from "@/lib/auth-utils";
import { getDashboardStats, getCotizacionesRecientes, getDashboardAlertas } from "./actions";

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
    <div className="p-4 lg:p-8">
      {/* Header */}
      <header className="mb-8 max-w-7xl">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-ink-muted">
          Bienvenido, {session.user?.name || "Admin"}
        </p>
      </header>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8 max-w-7xl">
        <StatsCard
          title="Total Cotizaciones"
          value={stats.totalCotizaciones}
          href="/admin/cotizaciones"
        />
        <StatsCard
          title="Proyectos"
          value={stats.proyectos}
          href="/admin/proyectos"
        />
        <StatsCard
          title="Testimonios"
          value={stats.testimonios}
          href="/admin/testimonios"
        />
      </div>

      {/* Acciones Rápidas / Quick Actions */}
      <section className="mb-8 max-w-7xl">
        <h2 className="font-heading text-lg font-medium text-ink mb-4 section-divider">
          ACCIONES RÁPIDAS
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AccionRapida
            href="/admin/cotizaciones"
            titulo="+ Cotización"
            detalle="Revisar el embudo y cargar una cotización"
          />
          <AccionRapida
            href="/admin/contratos/new"
            titulo="+ Contrato"
            detalle="Crear un contrato desde una cotización contratada"
          />
          <AccionRapida
            href="/admin/usuarios"
            titulo="Usuarios"
            detalle="Gestionar cuentas de acceso de clientes"
          />
          <AccionRapida
            href="/admin/obras"
            titulo="+ Obra"
            detalle="Crear o gestionar una nueva obra"
          />
        </div>
      </section>

      {/* Embudo de Cotizaciones - Recientemente Llegadas */}
      <section className="mb-8 max-w-7xl">
        <h2 className="font-heading text-lg font-medium text-ink mb-4 section-divider">
          COTIZACIONES RECIENTEMENTE LLEGADAS
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cotizaciones.map((c) => (
            <Link
              key={c.id}
              href={`/admin/cotizaciones/${c.id}`}
              className="group rounded border border-border bg-surface p-4 transition-colors hover:border-accent"
            >
              <div className="flex items-start gap-3">
                <span className="rounded bg-ink/5 p-2 flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-ink-fant"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate hover:text-accent">
                    {c.cliente?.nombre || "—"}
                  </p>
                  <p className="text-xs text-ink-faint truncate">
                    {c.tipoConstruccion.replace("_", " ")} · {c.origen}
                  </p>
                </div>
                <span className="ml-auto">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${getEstadoColor(c.estado)}`}
                  >
                    {getEstadoLabel(c.estado)}
                  </span>
                </span>
              </div>
            </Link>
          ))}
          {cotizaciones.length === 0 && (
            <p className="col-span-full text-center text-ink-faint py-8">
              No hay cotizaciones aún
            </p>
          )}
        </div>
      </section>

      {/* Cotizaciones Contactadas */}
      <section className="mb-8 max-w-7xl">
        <h2 className="font-heading text-lg font-medium text-ink mb-4 section-divider">
          COTIZACIONES CONTACTADAS
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cotizaciones
            .filter((c) => c.estado === "contactado")
            .map((c) => (
              <Link
                key={c.id}
                href={`/admin/cotizaciones/${c.id}`}
                className="group rounded border border-border bg-surface p-4 transition-colors hover:border-accent"
              >
                <div className="flex items-start gap-3">
                  <span className="rounded bg-ink/5 p-2 flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-ink-fant"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate hover:text-accent">
                      {c.cliente?.nombre || "—"}
                    </p>
                    <p className="text-xs text-ink-faint truncate">
                      {c.tipoConstruccion.replace("_", " ")} · {c.origen}
                    </p>
                  </div>
                  <span className="ml-auto">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800`}
                    >
                      Contactada
                    </span>
                  </span>
                </div>
              </Link>
            ))}
          {cotizaciones.filter((c) => c.estado === "contactado").length === 0 && (
            <p className="col-span-full text-center text-ink-faint py-8">
              No hay cotizaciones contactadas aún
            </p>
          )}
        </div>
      </section>

      {/* Historial de Acciones */}
      <section className="mb-8 max-w-7xl">
        <h2 className="font-heading text-lg font-medium text-ink mb-4 section-divider">
          HISTORIAL DE ACCIONES
        </h2>
        <div className="space-y-2">
          {[
            { label: "Nueva cotización creada", count: stats.porEstado.nuevo || 0 },
            { label: "Cotización contactada", count: stats.porEstado.contactado || 0 },
            { label: "Cotización contratada", count: stats.porEstado.contratado || 0 },
            { label: "Cotización no concretada", count: stats.porEstado.no_concretado || 0 },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between px-3 py-2 rounded bg-surface">
              <span className="text-sm text-ink-muted">
                {item.label}
              </span>
              <span className="text-sm font-medium text-ink">
                {item.count}
              </span>
            </div>
          ))}
          {/* Botón ver todas las cotizaciones */}
          <div className="mt-3 pt-3 border-t border-border text-center">
            <Link
              href="/admin/cotizaciones"
              className="text-sm font-medium text-accent-strong hover:underline"
            >
              Ver todas las cotizaciones →
            </Link>
          </div>
        </div>
      </section>

      {/* Alertas Accionables */}
      {aviso !== "modulo" && (
        <section className="mt-8 max-w-7xl">
          <div className="mt-8">
            <p className="section-label mb-4 text-ink-faint">
              ALERTAS ACCIONABLES
            </p>
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
        </section>
      )}
    </div>
  );
}

/* --- Componenetes auxiliares --- */

function StatsCard({
  title,
  value,
  href,
}: {
  title: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg bg-surface p-6 transition-colors hover:bg-ink/5"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-ink-muted truncate hover:text-accent">
            {title}
          </p>
        </div>
      </div>
      <p className="mt-4 font-heading text-4xl font-bold text-ink">
        {value}
      </p>
    </Link>
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
      className="group rounded border border-border bg-surface p-6 transition-colors hover:border-accent"
    >
      <p className="font-heading text-lg font-bold">{titulo}</p>
      <p className="mt-2 text-sm text-ink-muted">{detalle}</p>
    </Link>
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

function sectionDivider() {
  return (
    <div className="flex items-center gap-2 mb-2 px-2">
      <span className="inline-flex items-center px-2 py-1 rounded bg-ink/5 text-[10px] uppercase tracking-widest text-ink-faint">
        {""}
      </span>
    </div>
  );
}

function getEstadoColor(estado: string) {
  const colores: Record<string, string> = {
    nuevo: "bg-blue-100 text-blue-800",
    contactado: "bg-yellow-100 text-yellow-800",
    contratado: "bg-green-100 text-green-800",
    no_concretado: "bg-red-100 text-red-800",
  };
  return colores[estado] || "bg-gray-100 text-gray-800";
}

function getEstadoLabel(estado: string) {
  const labels: Record<string, string> = {
    nuevo: "Nuevo",
    contactado: "Contactado",
    contratado: "Contratada",
    no_concretado: "No concretada",
  };
  return labels[estado] || estado;
}