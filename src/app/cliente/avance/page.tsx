import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
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
              actualizaciones: {
                where: { visibleCliente: true },
                orderBy: { fechaReferencia: "desc" },
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
  const actualizaciones = obra.actualizaciones;
  const fotos = actualizaciones.filter((a) => a.tipo === "foto");
  const videos = actualizaciones.filter((a) => a.tipo === "video");

  return (
    <div className="space-y-8">
      <div>
        <p className="section-label mb-2 text-ink-faint">AVANCE DE OBRA</p>
        <h1 className="font-heading text-3xl font-bold">{obra.direccionObra}</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Progreso general: <span className="font-bold text-accent-strong">{obra.progreso}%</span>
        </p>
      </div>

      {actualizaciones.length > 0 || fotos.length > 0 || videos.length > 0 ? (
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <p className="section-label text-ink-faint">ACTUALIZACIONES MULTIMEDIA ({actualizaciones.length})</p>
              <p className="text-sm text-ink-muted">Publicadas por el administrador</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {actualizaciones.map((a) => (
                <div
                  key={a.id}
                  className="rounded border border-border bg-surface p-4 flex flex-col"
                >
                  {a.tipo === "foto" && (
                    <div className="aspect-video w-full rounded overflow-hidden bg-ink/5 mb-3 relative">
                      <Image
                        src={a.urlArchivo}
                        alt={a.titulo}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  )}
                  {a.tipo === "video" && (
                    <div className="aspect-video w-full rounded overflow-hidden bg-ink/10 mb-3 flex items-center justify-center">
                      <div className="text-center text-ink-muted">
                        <p className="text-sm font-medium">Video</p>
                        <p className="text-xs text-ink-faint">{a.titulo}</p>
                      </div>
                    </div>
                  )}
                  <h3 className="font-heading font-medium text-sm">{a.titulo}</h3>
                  {a.descripcion && (
                    <p className="mt-1 text-sm text-ink-muted line-clamp-2">{a.descripcion}</p>
                  )}
                  <p className="mt-2 text-xs text-ink-faint">{formatDate(a.fechaReferencia)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded border border-border bg-surface p-8 text-center">
          <p className="section-label text-ink-faint">SIN ACTUALIZACIONES PUBLICADAS</p>
          <p className="mt-2 text-ink-muted">
            El administrador publicará fotos y videos del avance conforme avance la obra.
          </p>
        </div>
      )}

      {hitos.length > 0 ? (
        <div className="space-y-6">
          <div>
            <p className="section-label text-ink-faint">HITOS ({hitos.length})</p>
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
      ) : null}
    </div>
  );
}
