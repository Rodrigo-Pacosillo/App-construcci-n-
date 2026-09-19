import { prisma } from "@/lib/db";
import { FALLBACK_SERVICIOS } from "@/lib/fallback-data";
import { ServiciosGrid } from "./ServiciosGrid";

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

export async function ServiciosSection() {
  const servicios = await getServicios();

  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <p className="section-label mb-4 text-ink/40">01 / SERVICIOS</p>
        <h2 className="font-heading text-4xl font-bold md:text-5xl">
          Lo que hacemos
        </h2>

        <ServiciosGrid servicios={servicios} />
      </div>
    </section>
  );
}
