import Link from "next/link";
import { prisma } from "@/lib/db";
import { FALLBACK_PROYECTOS } from "@/lib/fallback-data";

async function getProyectos() {
  try {
    const proyectos = await prisma.proyecto.findMany({
      where: { publicado: true, destacado: true },
      include: { fotos: { orderBy: { orden: "asc" } } },
      take: 4,
    });
    return proyectos.length > 0 ? proyectos : FALLBACK_PROYECTOS;
  } catch {
    return FALLBACK_PROYECTOS;
  }
}

export async function ProyectosSection() {
  const proyectos = await getProyectos();

  return (
    <section className="block py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <p className="section-label mb-4 text-ink-faint">02 / PROYECTOS</p>
        <h2 className="font-heading text-4xl font-bold text-ink md:text-5xl">
          Obras destacadas
        </h2>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {proyectos.map((proyecto) => (
            <Link
              key={proyecto.id}
              href={`/proyectos/${proyecto.slug}`}
              className="group relative overflow-hidden rounded border border-border bg-surface"
            >
              <div className="aspect-[4/3] bg-white/5" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6">
                <p className="section-label text-accent">
                  {proyecto.tipoConstruccion === "seco" ? "STEEL FRAME" : proyecto.tipoConstruccion.toUpperCase()}
                </p>
                <h3 className="mt-1 font-heading text-xl font-bold text-white">
                  {proyecto.titulo}
                </h3>
                <p className="mt-1 text-sm text-white/50">
                  {proyecto.m2Construidos}m2 · {proyecto.diasEjecucion} días
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/proyectos"
            className="inline-flex items-center justify-center rounded border border-ink/25 px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-ink/40"
          >
            Ver todos los proyectos
          </Link>
        </div>
      </div>
    </section>
  );
}
