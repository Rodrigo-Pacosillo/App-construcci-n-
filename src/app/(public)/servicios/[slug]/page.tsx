import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { FALLBACK_SERVICIOS } from "@/lib/fallback-data";
import type { Metadata } from "next";
import ServicioArt from "@/components/servicios/ServicioArt";
import { servicioContenido } from "@/content/servicios-contenido";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const servicio = await getServicio(slug);

  if (!servicio) {
    return { title: "Servicio no encontrado" };
  }

  return {
    title: servicio.titulo,
    description: servicio.descripcion.slice(0, 160),
    openGraph: {
      images: [
        {
          url: `/og?title=${encodeURIComponent(servicio.titulo)}&subtitle=${encodeURIComponent(servicio.descripcion.slice(0, 80))}&type=dark`,
          width: 1200,
          height: 630,
          alt: servicio.titulo,
        },
      ],
    },
  };
}

export async function generateStaticParams() {
  return [
    { slug: "steel-frame" },
    { slug: "drywall" },
    { slug: "cielorrasos" },
    { slug: "revestimientos" },
    { slug: "aislaciones" },
    { slug: "habilitaciones" },
  ];
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

  const contenido = servicioContenido[slug];

  return (
    <div className="py-24 lg:py-32">
      <div className="mx-auto max-w-5xl px-4 lg:px-8">
        <Link
          href="/servicios"
          className="section-label text-ink-faint hover:text-ink"
        >
          ← Servicios
        </Link>

        <h1 className="mt-8 font-heading text-4xl font-bold md:text-5xl">
          {servicio.titulo}
        </h1>

        <div className="mt-8 grid gap-8 md:grid-cols-[1fr_minmax(280px,320px)] md:items-start md:gap-12 lg:gap-16">
          <div className="space-y-6">
            <p className="text-lg leading-relaxed text-ink-muted">
              {contenido?.titular ?? servicio.descripcion}
            </p>
            {contenido && (
              <div>
                <p className="section-label text-ink-faint">CÓMO TRABAJAMOS</p>
                <p className="mt-3 text-base leading-relaxed text-ink-muted">
                  {contenido.comoTrabajamos}
                </p>
              </div>
            )}
          </div>
          <div className="w-full max-w-[300px] justify-self-start md:justify-self-end">
            <ServicioArt slug={slug} />
          </div>
        </div>

        {contenido && (
          <section className="mt-14 grid gap-10 md:grid-cols-2 md:gap-12 lg:gap-16">
            <div>
              <p className="section-label text-ink-faint">QUÉ INCLUYE</p>
              <ul className="mt-5 divide-y divide-border/60">
                {contenido.incluye.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <span className="mt-0.5 text-accent-strong">✓</span>
                    <span className="text-sm leading-relaxed text-ink-muted">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="section-label text-ink-faint">IDEAL PARA</p>
              <p className="mt-5 text-sm leading-relaxed text-ink-muted">
                {contenido.idealPara}
              </p>
            </div>
          </section>
        )}

        <div className="mt-16 text-center md:mt-20">
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
