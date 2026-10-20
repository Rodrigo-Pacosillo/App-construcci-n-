import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function ClienteDashboard({
  searchParams,
}: {
  searchParams: Promise<{ obraId?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/cliente");

  const { obraId } = await searchParams;

  const usuario = await prisma.usuario.findUnique({
    where: { id: session!.user.id },
    include: {
      cliente: {
        include: {
          cotizaciones: { orderBy: { creadoEn: "desc" } },
          obras: {
            include: {
              contrato: true,
              hitos: { where: { visibleCliente: true }, orderBy: { fecha: "asc" }, take: 5 },
            },
            orderBy: { fechaInicio: "desc" },
          },
        },
      },
    },
  });

  const cliente = usuario?.cliente;
  const obras = cliente?.obras ?? [];
  const obraSeleccionada = obraId
    ? obras.find((o) => o.id === obraId)
    : obras[0];
  const cotizaciones = cliente?.cotizaciones ?? [];
  const totalCotizaciones = cotizaciones.length;
  const cotizacionesContratadas = cotizaciones.filter(
    (c) => c.estado === "contratado"
  ).length;
  const totalObras = obras.length;
  const obraConHitos = obras.filter((o) => o.hitos.length > 0);
  const maxProgreso = obraConHitos.reduce((max, o) => Math.max(max, o.progreso), 0);

  const hrefConObra = (base: string) =>
    obraSeleccionada ? `${base}?obraId=${obraSeleccionada.id}` : base;

  return (
    <div className="space-y-8">
      <div>
        <p className="section-label mb-2 text-ink-faint">RESUMEN</p>
        <h1 className="font-heading text-3xl font-bold">
          Bienvenido, {usuario?.nombre.split(" ")[0]}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Este es el resumen de sus proyectos con nosotros.
        </p>
      </div>

      {obras.length > 1 && (
        <div className="rounded border border-border bg-surface p-4">
          <label htmlFor="obra-selector" className="section-label block text-ink-faint mb-2">
            Seleccionar obra
          </label>
          <select
            id="obra-selector"
            value={obraSeleccionada?.id || ""}
            onChange={(e) => {
              const url = new URL(window.location.href);
              if (e.target.value) {
                url.searchParams.set("obraId", e.target.value);
              } else {
                url.searchParams.delete("obraId");
              }
              window.location.href = url.toString();
            }}
            className="block w-full max-w-xs rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="">-- Seleccione una obra --</option>
            {obras.map((o) => (
              <option key={o.id} value={o.id}>
                {o.direccionObra} ({o.estado.replace(/_/g, " ")})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded border border-border bg-surface p-6">
          <p className="section-label text-ink-faint">COTIZACIONES</p>
          <p className="mt-3 font-heading text-4xl font-bold">{totalCotizaciones}</p>
          <p className="mt-1 text-sm text-ink-muted">
            {cotizacionesContratadas} contratadas
          </p>
        </div>

        <div className="rounded border border-border bg-surface p-6">
          <p className="section-label text-ink-faint">OBRA ACTIVA</p>
          {obraSeleccionada ? (
            <>
              <p className="mt-3 font-heading text-xl font-bold">
                {obraSeleccionada.direccionObra}
              </p>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span>Progreso</span>
                  <span>{obraSeleccionada.progreso}%</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-ink/10">
                  <div
                    className="h-2 rounded-full bg-accent"
                    style={{ width: `${obraSeleccionada.progreso}%` }}
                  />
                </div>
              </div>
              <p className="mt-1 text-sm text-ink-muted">
                {obraSeleccionada.hitos.length} hitos registrados
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-ink-muted">
              Todavía no tiene una obra activa.
            </p>
          )}
        </div>

        <div className="rounded border border-border bg-surface p-6">
          <p className="section-label text-ink-faint">CONTRATOS</p>
          <p className="mt-3 font-heading text-4xl font-bold">
            {obras.filter((o) => o.contrato).length}
          </p>
          <p className="mt-1 text-sm text-ink-muted">Contratos activos</p>
        </div>

        <div className="rounded border border-border bg-surface p-6">
          <p className="section-label text-ink-faint">OBRAS TOTALES</p>
          <p className="mt-3 font-heading text-4xl font-bold">{totalObras}</p>
          <p className="mt-1 text-sm text-ink-muted">
            En su historial
          </p>
        </div>
      </div>

      {/* Navegación rápida a secciones del portal */}
      <div className="rounded border border-border bg-surface p-6">
        <p className="section-label mb-4 text-ink-faint">MI OBRA</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href={hrefConObra("/cliente/avance")}
            className="rounded border border-border bg-background p-5 hover:border-accent transition-colors text-center"
          >
            <p className="section-label text-ink-faint">AVANCE</p>
            <p className="mt-2 font-heading text-lg font-bold">Hitos de obra</p>
            <p className="mt-1 text-sm text-ink-muted">
              Ver progreso, hitos cumplidos y próximos pasos
            </p>
          </Link>
          <Link
            href={hrefConObra("/cliente/pagos")}
            className="rounded border border-border bg-background p-5 hover:border-accent transition-colors text-center"
          >
            <p className="section-label text-ink-faint">PAGOS</p>
            <p className="mt-2 font-heading text-lg font-bold">Historial</p>
            <p className="mt-1 text-sm text-ink-muted">
              Ver montos, fechas, conceptos y comprobantes
            </p>
          </Link>
          <Link
            href={hrefConObra("/cliente/documentos")}
            className="rounded border border-border bg-background p-5 hover:border-accent transition-colors text-center"
          >
            <p className="section-label text-ink-faint">DOCUMENTOS</p>
            <p className="mt-2 font-heading text-lg font-bold">Contratos y PDFs</p>
            <p className="mt-1 text-sm text-ink-muted">
              Descargar contrato firmado y documentación
            </p>
          </Link>
        </div>
      </div>

      {obraSeleccionada && (
        <div className="rounded border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-label text-ink-faint">OBRA ACTIVA</p>
              <p className="mt-2 font-heading text-2xl font-bold">{obraSeleccionada.direccionObra}</p>
              <p className="mt-1 text-sm text-ink-muted">
                Inicio:{" "}
                {new Date(obraSeleccionada.fechaInicio).toLocaleDateString("es-AR")}
                {obraSeleccionada.fechaFinEstimada
                  ? ` - Fin estimado: ${new Date(obraSeleccionada.fechaFinEstimada).toLocaleDateString("es-AR")}`
                  : ""}
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                Estado: {obraSeleccionada.estado.replace(/_/g, " ")}
              </p>
            </div>
            <div className="text-right">
              <p className="section-label text-ink-faint">PROGRESO TOTAL</p>
              <p className="mt-2 font-heading text-5xl font-bold text-accent-strong">
                {maxProgreso}%
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                Max de sus obras
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}