import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { FALLBACK_SERVICIOS } from "@/lib/fallback-data";

async function getServicio(slug: string) {
  try {
    const servicio = await prisma.servicio.findUnique({
      where: { slug },
    });
    return servicio || FALLBACK_SERVICIOS.find((s) => s.slug === slug) || null;
  } catch {
    return FALLBACK_SERVICIOS.find((s) => s.slug === slug) || null;
  }
}

export default async function ServicioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const servicio = await getServicio(slug);

  if (!servicio) {
    notFound();
  }

  return (
    <div className="py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-4 lg:px-8">
        <Link
          href="/servicios"
          className="section-label text-ink/40 hover:text-ink"
        >
          ← Servicios
        </Link>

        <h1 className="mt-8 font-heading text-4xl font-bold md:text-5xl">
          {servicio.titulo}
        </h1>

        <p className="mt-6 text-lg text-ink/60">
          {servicio.descripcion}
        </p>

        <div className="mt-12 rounded border border-border bg-surface p-8">
          <p className="section-label text-ink/40">¿POR QUE ELEGIRNOS?</p>
          <ul className="mt-4 space-y-3 text-sm text-ink/60">
            <li className="flex items-start gap-2">
              <span className="text-accent">✓</span>
              Mas de 15 anos de experiencia en construccion en seco
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">✓</span>
              Materiales de primera calidad
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">✓</span>
              Presupuesto claro y sin sorpresas
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">✓</span>
              Plazos de entrega garantizados
            </li>
          </ul>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/cotizacion"
            className="accent-btn inline-flex items-center justify-center rounded px-8 py-3 text-sm font-medium"
          >
            Pedí tu presupuesto
          </Link>
        </div>
      </div>
    </div>
  );
}
