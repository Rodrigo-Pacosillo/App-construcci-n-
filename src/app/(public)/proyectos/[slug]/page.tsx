import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { FALLBACK_PROYECTOS } from "@/lib/fallback-data";
import type { Metadata } from "next";

async function getProyecto(slug: string) {
  try {
    const proyecto = await prisma.proyecto.findUnique({
      where: { slug },
      include: { fotos: { orderBy: { orden: "asc" } } },
    });
    return proyecto || FALLBACK_PROYECTOS.find((p) => p.slug === slug) || null;
  } catch {
    return FALLBACK_PROYECTOS.find((p) => p.slug === slug) || null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const proyecto = await getProyecto(slug);

  if (!proyecto) {
    return { title: "Proyecto no encontrado" };
  }

  return {
    title: proyecto.titulo,
    description: `${proyecto.tipoConstruccion === "seco" ? "Steel Frame" : proyecto.tipoConstruccion} · ${proyecto.m2Construidos}m2 · ${proyecto.ubicacion}`,
    openGraph: {
      images: [
        {
          url: `/og?title=${encodeURIComponent(proyecto.titulo)}&subtitle=${encodeURIComponent(`${proyecto.tipoConstruccion === "seco" ? "Steel Frame" : proyecto.tipoConstruccion} · ${proyecto.ubicacion}`)}&type=dark`,
          width: 1200,
          height: 630,
          alt: proyecto.titulo,
        },
      ],
    },
  };
}

export default async function ProyectoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const proyecto = await getProyecto(slug);

  if (!proyecto) {
    notFound();
  }

  return (
    <div className="py-24 lg:py-32">
      <div className="mx-auto max-w-4xl px-4 lg:px-8">
        <Link
          href="/proyectos"
          className="section-label text-ink-faint hover:text-ink"
        >
          ← Proyectos
        </Link>

        <div className="mt-8 flex items-center gap-4">
          <p className="section-label text-accent-strong">
            {proyecto.tipoConstruccion === "seco"
              ? "STEEL FRAME"
              : proyecto.tipoConstruccion.toUpperCase()}
          </p>
          {proyecto.destacado && (
            <span className="section-label rounded bg-accent/10 px-2 py-0.5 text-accent-strong">
              DESTACADO
            </span>
          )}
        </div>

        <h1 className="mt-4 font-heading text-4xl font-bold md:text-5xl">
          {proyecto.titulo}
        </h1>

        <div className="mt-6 flex flex-wrap gap-6 text-sm text-ink-muted">
          <div>
            <span className="section-label block text-ink-faint">UBICACION</span>
            {proyecto.ubicacion}
          </div>
          <div>
            <span className="section-label block text-ink-faint">SUPERFICIE</span>
            {proyecto.m2Construidos}m2
          </div>
          <div>
            <span className="section-label block text-ink-faint">PLAZO</span>
            {proyecto.diasEjecucion} días
          </div>
        </div>

        {/* Galería */}
        {"fotos" in proyecto && proyecto.fotos && proyecto.fotos.length > 0 && (
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {(proyecto.fotos as { url: string; fase: string }[]).map(
              (foto, i) => (
                <div
                  key={i}
                  className="relative aspect-[4/3] overflow-hidden rounded border border-border bg-surface"
                >
                  <div className="flex h-full items-center justify-center bg-ink/5 text-xs text-ink-faint">
                    {foto.fase.toUpperCase()}
                  </div>
                </div>
              )
            )}
          </div>
        )}

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <div className="rounded border border-border bg-surface p-6">
            <p className="section-label text-ink-faint">PROBLEMA DEL CLIENTE</p>
            <p className="mt-3 text-sm text-ink-muted">
              {proyecto.problemaCliente}
            </p>
          </div>
          <div className="rounded border border-border bg-surface p-6">
            <p className="section-label text-ink-faint">NUESTRA SOLUCION</p>
            <p className="mt-3 text-sm text-ink-muted">{proyecto.solucion}</p>
          </div>
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
