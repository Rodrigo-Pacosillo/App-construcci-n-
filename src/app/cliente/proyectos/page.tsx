import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/db";

async function getProyectos() {
  const session = await auth();
  if (!session || session.user.role !== "cliente") redirect("/login");

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    include: { cliente: true },
  });

  if (!usuario?.cliente) return [];

  return prisma.proyecto.findMany({
    where: { clienteId: usuario.cliente.id },
    select: {
      id: true, slug: true, titulo: true, tipoConstruccion: true,
      m2Construidos: true, diasEjecucion: true, portadaUrl: true, creadoEn: true,
    },
    orderBy: { creadoEn: "desc" },
  });
}

export default async function ClientProyectosPage() {
  const proyectos = await getProyectos();

  return (
    <div className="space-y-6">
      <div>
        <p className="section-label mb-2 text-ink-faint">PROYECTOS</p>
        <h1 className="font-heading text-3xl font-bold">
          Mis proyectos
        </h1>
      </div>

      {proyectos.length === 0 ? (
        <p className="py-12 text-center text-ink-muted">
          No tiene proyectos registrados.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {proyectos.map((p) => (
            <div
              key={p.id}
              className="group relative overflow-hidden rounded border border-border bg-surface"
            >
              {p.portadaUrl ? (
                <div className="aspect-video relative">
                  <Image
                    src={p.portadaUrl}
                    alt={p.titulo}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-ink/5" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="section-label text-accent">
                  {p.tipoConstruccion === "seco" ? "STEEL FRAME" : p.tipoConstruccion.toUpperCase()}
                </p>
                <h2 className="mt-1 font-heading text-xl font-bold text-white">
                  {p.titulo}
                </h2>
                <div className="mt-2 flex gap-4 text-xs text-white/40">
                  <span>{(p.m2Construidos ?? "—")}m²</span>
                  <span>{(p.diasEjecucion ?? "—")} días</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
