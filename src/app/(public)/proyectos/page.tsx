import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { FALLBACK_PROYECTOS } from "@/lib/fallback-data";
import { cloudSrc } from "@/lib/cloudinary-img";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Proyectos",
  description:
    "Portafolio de obras en Bolivia: construcción en seco, tradicional e integral. Casos reales con fotos, metros cuadrados y tiempos de ejecución.",
  openGraph: {
    images: [
      {
        url: "/og?title=Proyectos&subtitle=Portafolio%20de%20obras%20en%20Bolivia&type=dark",
        width: 1200,
        height: 630,
        alt: "Proyectos CONSTR-ART",
      },
    ],
  },
};

export const dynamic = "force-dynamic";

async function getProyectos() {
  try {
    const proyectos = await prisma.proyectoPortafolio.findMany({
      where: { publicado: true },
      select: {
        id: true, slug: true, titulo: true, tipoConstruccion: true,
        m2Construidos: true, diasEjecucion: true, ubicacion: true, portadaUrl: true,
      },
      orderBy: [{ orden: "asc" }, { creadoEn: "desc" }],
    });
    return proyectos.length > 0 ? proyectos : FALLBACK_PROYECTOS;
  } catch {
    return FALLBACK_PROYECTOS;
  }
}

export default async function ProyectosPage() {
  const proyectos = await getProyectos();

  return (
    <div className="block py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <p className="section-label mb-4 text-ink-faint">PORTAFOLIO</p>
        <h1 className="font-heading text-4xl font-bold text-ink md:text-5xl">
          Nuestros proyectos
        </h1>
        <p className="mt-4 max-w-2xl text-ink-muted">
          Cada proyecto cuenta una historia. Vea nuestros trabajos
          destacados y descubra cómo transformamos espacios.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                    priority={i < 3}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px"
                    className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-white/5" />
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <span className="inline-block rounded bg-accent/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  {(proyecto.tipoConstruccion ?? "no_sabe") === "seco"
                    ? "Steel Frame"
                    : (proyecto.tipoConstruccion ?? "no_sabe").toUpperCase()}
                </span>
                <h2 className="mt-2 font-heading text-xl font-bold text-white drop-shadow-md">
                  {proyecto.titulo}
                </h2>
                <span className="mt-3 inline-flex items-center gap-1 text-xs text-accent opacity-0
                             transition-opacity duration-300 group-hover:opacity-100">
                  Ver proyecto →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}