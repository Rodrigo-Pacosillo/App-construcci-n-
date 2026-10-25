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
              contrato: true,
              hitos: { where: { visibleCliente: true }, orderBy: { fecha: "asc" } },
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

function formatDate(date: Date | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function ClienteAvancePage({
  searchParams,
}: {
  searchParams: Promise<{ obraId?: string }>;
}) {
  const { obraId } = await searchParams;
  const obra = await getObraActiva(obraId);

  if (!obra) {
    return (
      <div className="py-12 text-center">
        <p className="section-label text-ink-faint">AVANCE DE OBRA</p>
        <p className="mt-4 text-ink-muted">
          No tiene una obra activa registrada.
        </p>
      </div>
    );
  }

  const hitos = obra.hitos;

  return (
    <div className="space-y-8">
      <div>
        <p className="section-label mb-2 text-ink-faint">AVANCE DE OBRA</p>
        <h1 className="font-heading text-3xl font-bold">{obra.direccionObra}</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Progreso general: <span className="font-bold text-accent-strong">{obra.progreso}%</span>
        </p>
      </div>

      {hitos.length > 0 ? (
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <p className="section-label text-ink-faint">ACTUALIZACIONES ({hitos.length})</p>
              <p className="text-sm text-ink-muted">
                Publicadas por el administrador
              </p>
            </div>
            {/* §8.4: la visibilidad no prueba que un hito esté completado.
                Se muestran como actualizaciones publicadas con fecha y
                descripción, sin inferir un estado de finalización. */}
            <div className="mt-6 relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-ink/10" />
              <div className="space-y-8">
                {hitos.map((h, i) => (
                  <div key={h.id} className="relative flex gap-4">
                    <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent font-bold text-ink">
                      {i + 1}
                    </div>
                    <div className="flex-1 rounded border border-border bg-surface p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-heading font-bold">{h.titulo}</h3>
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
      ) : (
        <div className="rounded border border-border bg-surface p-8 text-center">
          <p className="section-label text-ink-faint">SIN ACTUALIZACIONES PUBLICADAS</p>
          <p className="mt-2 text-ink-muted">
            El administrador publicará actualizaciones conforme avance la obra.
          </p>
        </div>
      )}
    </div>
  );
}