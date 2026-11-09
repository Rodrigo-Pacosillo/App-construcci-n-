import Link from "next/link";
import { notFound } from "next/navigation";
import { TikTokPlayer } from "@/components/proyecto/TikTokPlayer";
import { CloudinaryVideoPlayer } from "@/components/proyecto/CloudinaryVideoPlayer";
import { VideoSlot } from "@/components/proyecto/VideoSlot";
import { GaleriaProyecto } from "@/components/proyecto/GaleriaProyecto";
import { prisma } from "@/lib/db";
import { FALLBACK_PROYECTOS } from "@/lib/fallback-data";
import { cloudSrc } from "@/lib/cloudinary-img";
import Image from "next/image";
import type { Metadata } from "next";

async function getProyecto(slug: string) {
  try {
    const proyecto = await prisma.proyectoPortafolio.findFirst({
      where: { slug, publicado: true },
      select: {
        id: true, slug: true, titulo: true, tipoConstruccion: true,
        m2Construidos: true, diasEjecucion: true, ubicacion: true,
        videoUrl: true, portadaUrl: true, orden: true,
        galeriaUrls: true,
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

        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-ink-muted">
          <span className="inline-block rounded bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-strong">
            Bolivia
          </span>
        </div>

        {proyecto.portadaUrl && (
          <figure className="relative mt-8 aspect-[16/9] overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
            <Image
              src={cloudSrc(proyecto.portadaUrl, { w: 1600, ar: "16:9" })}
              alt={proyecto.titulo}
              fill
              priority
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover transition-transform duration-700 motion-safe:hover:scale-105"
            />
          </figure>
        )}

        <GaleriaProyecto urls={proyecto.galeriaUrls ?? []} titulo={proyecto.titulo} />

        <div className="mt-12 rounded-xl border border-border bg-surface p-6 shadow-sm">
          <p className="section-label mb-4 text-ink-faint">VIDEO DE OBRA</p>
          {proyecto.videoUrl ? (
            proyecto.videoUrl.includes("res.cloudinary.com") ? (
              <CloudinaryVideoPlayer
                videoUrl={proyecto.videoUrl}
                portadaUrl={proyecto.portadaUrl}
                titulo={proyecto.titulo}
              />
            ) : (
              <TikTokPlayer
                videoUrl={proyecto.videoUrl}
                portadaUrl={proyecto.portadaUrl}
                titulo={proyecto.titulo}
              />
            )
          ) : (
            <VideoSlot />
          )}
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