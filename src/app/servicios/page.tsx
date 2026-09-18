import Link from "next/link";
import { prisma } from "@/lib/db";
import { FALLBACK_SERVICIOS } from "@/lib/fallback-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Servicios",
  description:
    "Steel frame, drywall, cielorrasos, revestimientos y aislaciones. Soluciones completas en construccion en seco.",
};

async function getServicios() {
  try {
    const servicios = await prisma.servicio.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    });
    return servicios.length > 0 ? servicios : FALLBACK_SERVICIOS;
  } catch {
    return FALLBACK_SERVICIOS;
  }
}

export default async function ServiciosPage() {
  const servicios = await getServicios();

  return (
    <div className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <p className="section-label mb-4 text-ink/40">SERVICIOS</p>
        <h1 className="font-heading text-4xl font-bold md:text-5xl">
          Nuestros servicios
        </h1>
        <p className="mt-4 max-w-2xl text-ink/50">
          Ofrecemos soluciones completas en construccion en seco.
          Cada servicio esta respaldado por anos de experiencia.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {servicios.map((servicio, i) => (
            <Link
              key={servicio.id}
              href={`/servicios/${servicio.slug}`}
              className="group rounded border border-border bg-surface p-8 transition-colors hover:border-accent"
            >
              <span className="section-label text-ink/20">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="mt-4 font-heading text-2xl font-bold">
                {servicio.titulo}
              </h2>
              <p className="mt-3 text-sm text-ink/50">
                {servicio.descripcion}
              </p>
              <span className="mt-6 inline-block text-xs text-accent opacity-0 transition-opacity group-hover:opacity-100">
                Ver detalle →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
