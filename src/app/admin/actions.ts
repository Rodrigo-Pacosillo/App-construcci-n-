"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";

export async function getDashboardStats() {
  await requireAdmin(); // ← Verificar que es admin

  try {
    const cotizaciones = await prisma.cotizacion.findMany({
      include: { cliente: true },
      take: 50, // ← Vulnerabilidad #3: agregar límite
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
  } catch (error) {
    console.error("Error en getDashboardStats:", error);
    return { totalCotizaciones: 0, porEstado: {}, proyectos: 0, testimonios: 0 };
  }
}

export async function getCotizacionesRecientes() {
  await requireAdmin(); // ← Verificar que es admin

  try {
    return await prisma.cotizacion.findMany({
      include: { cliente: true },
      orderBy: { creadoEn: "desc" },
      take: 50, // ← Vulnerabilidad #3: agregar límite
    });
  } catch (error) {
    console.error("Error en getCotizacionesRecientes:", error);
    return [];
  }
}
