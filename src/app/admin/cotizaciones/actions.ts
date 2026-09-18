"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function updateCotizacionEstado(
  id: string,
  estado: string
) {
  await prisma.cotizacion.update({
    where: { id },
    data: { estado },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/cotizaciones");
}

export async function getCotizaciones() {
  try {
    return await prisma.cotizacion.findMany({
      include: { cliente: true },
      orderBy: { creadoEn: "desc" },
    });
  } catch {
    return [];
  }
}

export async function getCotizacionesPorEstado() {
  try {
    const cotizaciones = await prisma.cotizacion.findMany({
      include: { cliente: true },
      orderBy: { creadoEn: "desc" },
    });

    const porEstado: Record<string, typeof cotizaciones> = {
      nuevo: [],
      contactado: [],
      visita_tecnica: [],
      presupuestado: [],
      ganado: [],
      perdido: [],
    };

    for (const c of cotizaciones) {
      if (porEstado[c.estado]) {
        porEstado[c.estado].push(c);
      }
    }

    return porEstado;
  } catch {
    return { nuevo: [], contactado: [], visita_tecnica: [], presupuestado: [], ganado: [], perdido: [] };
  }
}
