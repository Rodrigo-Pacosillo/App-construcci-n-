import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { FALLBACK_PROYECTOS } from "@/lib/fallback-data";
import { cloudSrc } from "@/lib/cloudinary-img";

async function getProyectos() {
  try {
    const proyectos = await prisma.proyectoPortafolio.findMany({
      where: { publicado: true, destacado: true },
      select: {
        id: true, slug: true, titulo: true, tipoConstruccion: true,
        m2Construidos: true, diasEjecucion: true, portadaUrl: true,
      },
      orderBy: [{ orden: "asc" }, { creadoEn: "desc" }],
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
          {proyectos.map((proyecto, i) => (
            <Link
              key={proyecto.id}
              href={`/proyectos/${proyecto.slug}`}
              className="group relative overflow-hidden rounded-lg border border-border bg-surface shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="aspect-[4/3] relative">
                {proyecto.portadaUrl ? (
                  <Image
                    src={cloudSrc(proyecto.portadaUrl, { w: 1200, ar: "4:3" })}
                    alt={proyecto.titulo}
                    fill
                    priority={i < 2}
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-white/5" />
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <span className="inline-block rounded bg-accent/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  {(proyecto.tipoConstruccion ?? "no_sabe") === "seco" ? "Steel Frame" : (proyecto.tipoConstruccion ?? "no_sabe").toUpperCase()}
                </span>
                <h3 className="mt-2 font-heading text-xl font-bold text-white drop-shadow-md">
                  {proyecto.titulo}
                </h3>
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