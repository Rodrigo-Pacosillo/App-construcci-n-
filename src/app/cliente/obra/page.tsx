import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { CheckCircle, Clock } from "lucide-react";

async function getObraActiva() {
  const session = await auth();
  if (!session || session.user.role !== "cliente") redirect("/login");

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    include: {
      cliente: {
        include: {
          obras: {
            include: {
              contrato: true,
              hitos: { orderBy: { fecha: "asc" } },
              pagos: { orderBy: { fecha: "desc" } },
            },
            orderBy: { fechaInicio: "desc" },
          },
        },
      },
    },
  });

  const obras = usuario?.cliente?.obras ?? [];

  if (obras.length === 0) {
    return null;
  }

  const obra = obras[0];
  const ahora = Date.now();

  return {
    ...obra,
    hitos: obra.hitos.map((h) => ({
      ...h,
      cumplido: new Date(h.fecha).getTime() <= ahora && h.visibleCliente,
    })),
  };
}

function formatDate(date: Date | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function ClientObraPage() {
  const obra = await getObraActiva();

  if (!obra) {
    return (
      <div className="py-12 text-center">
        <p className="section-label text-ink-faint">OBRA ACTIVA</p>
        <p className="mt-4 text-ink-muted">
          No tenés una obra activa registrada.
        </p>
        <Link
          href="/cliente"
          className="mt-6 inline-block rounded px-6 py-2 text-sm font-medium bg-ink/5 text-ink hover:bg-ink/10"
        >
          Volver al resumen
        </Link>
      </div>
    );
  }

  const contrato = obra.contrato;
  const hitos = obra.hitos;
  const pagos = obra.pagos;
  const fechaInicio = new Date(obra.fechaInicio);
  const fechaFinEstimada = obra.fechaFinEstimada
    ? new Date(obra.fechaFinEstimada)
    : null;
  const totalDiasEstimados = fechaFinEstimada
    ? Math.floor((fechaFinEstimada.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-8">
      <div className="rounded border border-border bg-surface p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="section-label text-ink-faint">OBRA ACTIVA</p>
            <h1 className="mt-1 font-heading text-2xl font-bold">
              {obra.direccionObra}
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              Contrato #{obra.contrato?.id.slice(0, 8)} · Plazo: {totalDiasEstimados} días
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              Estado: {obra.estado.replace(/_/g, " ")}
            </p>
          </div>
          <div className="text-right">
            <p className="section-label text-accent-strong">PROGRESO</p>
            <p className="mt-1 font-heading text-4xl font-bold text-accent-strong">
              {obra.progreso}%
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              Inicio: {formatDate(fechaInicio)}
            </p>
          </div>
        </div>
      </div>

      {contrato && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded border border-border bg-surface p-6">
            <p className="section-label text-ink-faint">CONTRATO</p>
            <p className="mt-2 font-heading text-lg font-bold">
              Acordado: ${Number(contrato.montoTotal).toLocaleString("es-AR")}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              {formatDate(contrato.fechaFirma)}
            </p>
          </div>
          <div className="rounded border border-border bg-surface p-6">
            <p className="section-label text-ink-faint">UBICACIÓN</p>
            <p className="mt-2 text-ink/90">{obra.direccionObra}</p>
          </div>
        </div>
      )}

      {hitos.length > 0 && (
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <p className="section-label text-ink-faint">HITOS</p>
              <p className="text-sm text-ink-muted">{hitos.length} registrados</p>
            </div>
            <div className="mt-6 relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-ink/10" />
              <div className="space-y-8">
                {hitos.map((h, i) => (
                  <div key={h.id} className="relative flex gap-4">
                    <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-ink font-bold">
                      {i + 1}
                    </div>
                    <div className="flex-1 rounded border border-border bg-surface p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-heading font-bold">{h.titulo}</h3>
                        <div className="flex items-center gap-2">
                          {h.visibleCliente && (
                            <span className="rounded bg-green-100 text-green-800 px-2 py-0.5 text-xs font-medium">
                              Visible
                            </span>
                          )}
                          {h.cumplido && (
                            <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                          )}
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-ink-muted">{h.descripcion}</p>
                      <p className="mt-2 text-xs text-ink-faint">{formatDate(h.fecha)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {pagos.length > 0 && (
        <div className="space-y-4">
          <p className="section-label text-ink-faint">PAGOS</p>
          <div className="space-y-3">
            {pagos.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded border border-border bg-surface p-4"
              >
                <div>
                  <p className="font-heading font-medium">{p.concepto}</p>
                  <p className="text-sm text-ink-muted">{formatDate(p.fecha)}</p>
                </div>
                <div className="text-right">
                  <p className="font-heading text-lg font-bold">
                    ${Number(p.monto).toLocaleString("es-AR")}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                    {p.estado === "confirmado" ? (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        Confirmado
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3" />
                        Registrado
                      </>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
