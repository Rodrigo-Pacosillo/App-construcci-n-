import Link from "next/link";
import { prisma } from "@/lib/db";
import { FALLBACK_PROYECTOS } from "@/lib/fallback-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Proyectos",
  description:
    "Portafolio de obras destacadas en construcción en seco. Casos reales con fotos antes/durante/después.",
  openGraph: {
    images: [
      {
        url: "/og?title=Proyectos&subtitle=Portafolio%20de%20obras%20en%20construcci%C3%B3n%20en%20seco&type=dark",
        width: 1200,
        height: 630,
        alt: "Proyectos Steel Frame",
      },
    ],
  },
};

async function getProyectos() {
  try {
    const proyectos = await prisma.proyecto.findMany({
      where: { publicado: true },
      include: { fotos: { orderBy: { orden: "asc" } } },
      orderBy: { creadoEn: "desc" },
    });
    return proyectos.length > 0 ? proyectos : FALLBACK_PROYECTOS;
  } catch {
    return FALLBACK_PROYECTOS;
  }
}

export default async function ProyectosPage() {
  const proyectos = await getProyectos();

  return (
    <div className="block-dark py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <p className="section-label mb-4 text-white/40">PORTAFOLIO</p>
        <h1 className="font-heading text-4xl font-bold text-white md:text-5xl">
          Nuestros proyectos
        </h1>
        <p className="mt-4 max-w-2xl text-white/50">
          Cada proyecto cuenta una historia. Mirá nuestros trabajos
          destacados y descubrí cómo transformamos espacios.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {proyectos.map((proyecto) => (
            <Link
              key={proyecto.id}
              href={`/proyectos/${proyecto.slug}`}
              className="group relative overflow-hidden rounded border border-white/10 bg-white/5"
            >
              <div className="aspect-[4/3] bg-white/5" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6">
                <p className="section-label text-accent">
                  {proyecto.tipoConstruccion === "seco"
                    ? "STEEL FRAME"
                    : proyecto.tipoConstruccion.toUpperCase()}
                </p>
                <h2 className="mt-1 font-heading text-xl font-bold text-white">
                  {proyecto.titulo}
                </h2>
                <div className="mt-2 flex gap-4 text-xs text-white/40">
                  <span>{proyecto.m2Construidos}m2</span>
                  <span>{proyecto.diasEjecucion} días</span>
                  <span>{proyecto.ubicacion}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
