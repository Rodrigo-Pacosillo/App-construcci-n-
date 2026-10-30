import Link from "next/link";
import { notFound } from "next/navigation";
import { TikTokPlayer } from "@/components/proyecto/TikTokPlayer";
import { prisma } from "@/lib/db";
import { FALLBACK_PROYECTOS } from "@/lib/fallback-data";
import type { Metadata } from "next";

async function getProyecto(slug: string) {
  try {
    const proyecto = await prisma.proyecto.findUnique({
      where: { slug },
      select: {
        id: true, slug: true, titulo: true, tipoConstruccion: true,
        m2Construidos: true, diasEjecucion: true, ubicacion: true,
        videoUrl: true, portadaUrl: true, orden: true,
        problemaCliente: true, solucion: true,
        destacado: true, publicado: true,
        creadoEn: true, actualizadoEn: true,
      },
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

  const tipoConstructivo = proyecto.tipoConstruccion === "seco" ? "Steel Frame" : 
    proyecto.tipoConstruccion === "tradicional" ? "Construcción Tradicional" : 
    "Solución Integral";

  return {
    title: proyecto.titulo,
    description: `${tipoConstructivo} · ${proyecto.m2Construidos ?? "—"}m² · ${proyecto.ubicacion}`,
    openGraph: {
      images: [
        {
          url: `/og?title=${encodeURIComponent(proyecto.titulo)}&subtitle=${encodeURIComponent(`${tipoConstructivo} · ${proyecto.ubicacion}`)}&type=dark`,
          width: 1200,
          height: 630,
          alt: `${proyecto.titulo} - CONSTR-ART`,
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
              : proyecto.tipoConstruccion === "tradicional"
              ? "CONSTRUCCIÓN TRADICIONAL"
              : "SOLUCIÓN INTEGRAL"}
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
            {(proyecto.m2Construidos ?? "—")}m2
          </div>
          <div>
            <span className="section-label block text-ink-faint">PLAZO</span>
            {(proyecto.diasEjecucion ?? "—")} días
          </div>
        </div>

        {proyecto.videoUrl && (
          <div className="mt-12">
            <p className="section-label mb-2 text-ink-faint">VIDEO DE OBRA</p>
            <TikTokPlayer
              videoUrl={proyecto.videoUrl}
              portadaUrl={proyecto.portadaUrl}
              titulo={proyecto.titulo}
            />
          </div>
        )}

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <div className="rounded border border-border bg-surface p-6">
            <p className="section-label text-ink-faint">PROBLEMA DEL CLIENTE</p>
            <p className="mt-3 text-sm text-ink-muted">
              {proyecto.problemaCliente ?? "— Sin datos —"}
            </p>
          </div>
          <div className="rounded border border-border bg-surface p-6">
            <p className="section-label text-ink-faint">NUESTRA SOLUCION</p>
            <p className="mt-3 text-sm text-ink-muted">
              {proyecto.solucion ?? "— Sin datos —"}
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/cotizacion"
            className="accent-btn inline-flex items-center justify-center rounded px-8 py-3 text-sm font-medium"
          >
            Solicite su presupuesto
          </Link>
        </div>
      </div>
    </div>
  );
}
