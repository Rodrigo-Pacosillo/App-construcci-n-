import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function ClienteDashboard() {
  const session = await auth();

  const usuario = await prisma.usuario.findUnique({
    where: { id: session!.user.id },
    include: {
      cliente: {
        include: {
          cotizaciones: { orderBy: { creadoEn: "desc" } },
          obras: {
            include: {
              contrato: true,
              hitos: { orderBy: { fecha: "asc" }, take: 5 },
            },
            orderBy: { fechaInicio: "desc" },
          },
        },
      },
    },
  });

  const cliente = usuario?.cliente;
  const obras = cliente?.obras ?? [];
  const obra = obras[0];
  const cotizaciones = cliente?.cotizaciones ?? [];
  const totalCotizaciones = cotizaciones.length;
  const cotizacionesGanadas = cotizaciones.filter((c) => c.estado === "ganado").length;
  const totalObras = obras.length;
  const obraConHitos = obras.filter((o) => o.hitos.length > 0);
  const maxProgreso = obraConHitos.reduce((max, o) => Math.max(max, o.progreso), 0);

  return (
    <div className="space-y-8">
      <div>
        <p className="section-label mb-2 text-ink/40">RESUMEN</p>
        <h1 className="font-heading text-3xl font-bold">
          Hola, {usuario?.nombre.split(" ")[0]}
        </h1>
        <p className="mt-2 text-sm text-ink/50">
          Este es el resumen de tus proyectos con nosotros.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded border border-border bg-surface p-6">
          <p className="section-label text-ink/40">COTIZACIONES</p>
          <p className="mt-3 font-heading text-4xl font-bold">{totalCotizaciones}</p>
          <p className="mt-1 text-sm text-ink/50">
            {cotizacionesGanadas} ganadas
          </p>
        </div>

        <div className="rounded border border-border bg-surface p-6">
          <p className="section-label text-ink/40">OBRA ACTIVA</p>
          {obra ? (
            <>
              <p className="mt-3 font-heading text-xl font-bold">
                {obra.direccionObra}
              </p>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-ink/50">
                  <span>Progreso</span>
                  <span>{obra.progreso}%</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-ink/10">
                  <div
                    className="h-2 rounded-full bg-accent"
                    style={{ width: `${obra.progreso}%` }}
                  />
                </div>
              </div>
              <p className="mt-1 text-sm text-ink/50">
                {obra.hitos.length} hitos registrados
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-ink/50">
              Todavía no tenés una obra activa.
            </p>
          )}
        </div>

        <div className="rounded border border-border bg-surface p-6">
          <p className="section-label text-ink/40">CONTRATOS</p>
          <p className="mt-3 font-heading text-4xl font-bold">
            {obras.filter((o) => o.contrato).length}
          </p>
          <p className="mt-1 text-sm text-ink/50">Contratos activos</p>
        </div>

        <div className="rounded border border-border bg-surface p-6">
          <p className="section-label text-ink/40">PROYECTOS</p>
          <p className="mt-3 font-heading text-4xl font-bold">{totalObras}</p>
          <p className="mt-1 text-sm text-ink/50">
            Proyectos completados
          </p>
        </div>
      </div>

      {obra && (
        <div className="rounded border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-label text-ink/40">OBRA ACTIVA</p>
              <p className="mt-2 font-heading text-2xl font-bold">{obra.direccionObra}</p>
              <p className="mt-1 text-sm text-ink/50">
                Inicio:{" "}
                {new Date(obra.fechaInicio).toLocaleDateString("es-AR")}
                {obra.fechaFinEstimada
                  ? ` - Fin estimado: ${new Date(obra.fechaFinEstimada).toLocaleDateString("es-AR")}`
                  : ""}
              </p>
              <p className="mt-1 text-sm text-ink/50">
                Estado: {obra.estado.replace(/_/g, " ")}
              </p>
            </div>
            <div className="text-right">
              <p className="section-label text-ink/40">PROGRESO TOTAL</p>
              <p className="mt-2 font-heading text-5xl font-bold text-accent-strong">
                {maxProgreso}%
              </p>
              <p className="mt-1 text-sm text-ink/50">
                Max de tus obras
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
