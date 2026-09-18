"use server";

import { prisma } from "@/lib/db";

export async function getDashboardStats() {
  try {
    const cotizaciones = await prisma.cotizacion.findMany({
      include: { cliente: true },
    });

    const porEstado: Record<string, number> = {};
    for (const c of cotizaciones) {
      porEstado[c.estado] = (porEstado[c.estado] || 0) + 1;
    }

    const proyectos = await prisma.proyecto.count();
    const testimonios = await prisma.testimonio.count({ where: { publicado: true } });

    return {
      totalCotizaciones: cotizaciones.length,
      porEstado,
      proyectos,
      testimonios,
    };
  } catch {
    return { totalCotizaciones: 0, porEstado: {}, proyectos: 0, testimonios: 0 };
  }
}

export async function getCotizacionesRecientes() {
  try {
    return await prisma.cotizacion.findMany({
      include: { cliente: true },
      orderBy: { creadoEn: "desc" },
      take: 5,
    });
  } catch {
    return [];
  }
}
