import { prisma } from "@/lib/db";
import { FALLBACK_SERVICIOS, FALLBACK_PROYECTOS } from "@/lib/fallback-data";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://steelframe.com.ar";

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/servicios`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/proyectos`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/cotizacion`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/estimador`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];

  let servicios: { slug: string }[] = [];
  let proyectos: { slug: string }[] = [];

   try {
     servicios = await prisma.servicio.findMany({
       where: { activo: true },
       select: { slug: true },
     });
   } catch (error) {
     console.error("Error en sitemap (servicios):", error);
     servicios = FALLBACK_SERVICIOS;
   }

   try {
     proyectos = await prisma.proyecto.findMany({
       where: { publicado: true },
       select: { slug: true },
     });
   } catch (error) {
     console.error("Error en sitemap (proyectos):", error);
     proyectos = FALLBACK_PROYECTOS;
   }

  const servicioPages = servicios.map((s) => ({
    url: `${base}/servicios/${s.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const proyectoPages = proyectos.map((p) => ({
    url: `${base}/proyectos/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...servicioPages, ...proyectoPages];
}
