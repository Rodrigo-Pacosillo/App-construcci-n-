import { prisma } from "@/lib/db";
import { FALLBACK_CERTIFICACIONES } from "@/lib/fallback-data";

async function getCertificaciones() {
  try {
    const certificaciones = await prisma.certificacion.findMany({
      where: { activo: true },
    });
    return certificaciones.length > 0 ? certificaciones : FALLBACK_CERTIFICACIONES;
  } catch {
    return FALLBACK_CERTIFICACIONES;
  }
}

export async function CertificacionesSection() {
  const certificaciones = await getCertificaciones();

  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <p className="section-label mb-4 text-ink/40">03 / CERTIFICACIONES</p>
        <h2 className="font-heading text-4xl font-bold md:text-5xl">
          Confianza garantizada
        </h2>
        <p className="mt-4 max-w-2xl text-ink/50">
          Habilitaciones y seguros que respaldan cada obra.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {certificaciones.map((certificacion) => (
            <div
              key={certificacion.id}
              className="flex flex-col rounded border border-border bg-surface p-6"
            >
              <div className="flex aspect-[4/3] items-center justify-center rounded border border-dashed border-ink/20 bg-ink/5">
                <span className="section-label text-ink/30">
                  CERTIFICADO — IMAGEN
                </span>
              </div>
              <h3 className="mt-4 font-heading text-lg font-bold">
                {certificacion.titulo}
              </h3>
              <p className="mt-2 text-sm text-ink/50">
                {certificacion.descripcion}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}