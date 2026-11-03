import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

async function getObraActiva(obraId?: string) {
  const session = await auth();
  if (!session || session.user.role !== "cliente") redirect("/login");

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    include: {
      cliente: {
        include: {
          obras: {
            include: {
              eventosCalendario: {
                where: { visibleCliente: true },
                orderBy: { fechaInicio: "asc" },
              },
            },
            orderBy: { fechaInicio: "desc" },
          },
        },
      },
    },
  });

  const obras = usuario?.cliente?.obras ?? [];
  if (obraId) {
    return obras.find((o) => o.id === obraId) || obras[0] || null;
  }
  return obras[0] || null;
}

function formatDateTime(date: Date | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TIPO_LABEL: Record<string, string> = {
  nota: "Nota",
  recordatorio: "Recordatorio",
  inicio_etapa: "Inicio de etapa",
  fin_etapa: "Fin de etapa",
  entrega: "Entrega",
  reunion: "Reunión",
  otro: "Otro",
};

export default async function ClienteCalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ obraId?: string }>;
}) {
  const { obraId } = await searchParams;
  const obra = await getObraActiva(obraId);

  if (!obra) {
    return (
      <div className="py-12 text-center">
        <p className="section-label text-ink-faint">CALENDARIO DE OBRA</p>
        <p className="mt-4 text-ink-muted">
          No tiene una obra activa registrada.
        </p>
      </div>
    );
  }

  const eventos = obra.eventosCalendario;

  return (
    <div className="space-y-8">
      <div>
        <p className="section-label mb-2 text-ink-faint">CALENDARIO DE OBRA</p>
        <h1 className="font-heading text-3xl font-bold">{obra.direccionObra}</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Fechas y eventos de su obra publicados por el administrador.
        </p>
      </div>

      {eventos.length > 0 ? (
        <div className="rounded border border-border bg-surface p-6">
          <p className="section-label mb-4 text-ink-faint">EVENTOS ({eventos.length})</p>
          <div className="space-y-3">
            {eventos.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded border border-border bg-background p-4">
                <div>
                  <p className="font-heading font-medium">{e.titulo}</p>
                  {e.descripcion && (
                    <p className="mt-1 text-sm text-ink-muted line-clamp-1">{e.descripcion}</p>
                  )}
                  <p className="mt-1 text-xs text-ink-faint">
                    {TIPO_LABEL[e.tipo] ?? e.tipo} · {formatDateTime(e.fechaInicio)}
                    {e.fechaFin ? ` – ${formatDateTime(e.fechaFin)}` : ""}
                  </p>
                </div>
                <span className="text-xs font-mono uppercase tracking-wider px-2 py-1 rounded border border-border bg-ink/5 text-ink-muted">
                  {e.todoElDia ? "Todo el día" : "Con hora"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded border border-border bg-surface p-8 text-center">
          <p className="section-label text-ink-faint">SIN EVENTOS PROGRAMADOS</p>
          <p className="mt-2 text-ink-muted">
            El administrador agregará eventos al calendario conforme avance la obra.
          </p>
        </div>
      )}
    </div>
  );
}
