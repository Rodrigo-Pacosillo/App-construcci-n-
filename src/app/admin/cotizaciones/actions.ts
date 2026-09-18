"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { ESTADOS_COTIZACION } from "@/lib/constants";

export async function updateCotizacionEstado(
  id: string,
  estado: string
) {
  // ← Vulnerabilidad #13: validar parámetros antes de procesar
  const cotizacion = await prisma.cotizacion.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!cotizacion) {
    return { success: false, error: { id: ["Cotización no encontrada"] } };
  }

  // Validar estado
  if (!ESTADOS_COTIZACION.includes(estado as any)) {
    return { success: false, error: { estado: ["Estado inválido"] } };
  }

  await requireAdmin(); // ← Vulnerabilidad #1: verificar que es admin

  await prisma.cotizacion.update({
    where: { id },
    data: { estado },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/cotizaciones");
  return { success: true };
}

export async function getCotizaciones() {
  await requireAdmin(); // ← Vulnerabilidad #1: verificar que es admin

  try {
    return await prisma.cotizacion.findMany({
      include: { cliente: true },
      orderBy: { creadoEn: "desc" },
      take: 50, // ← Vulnerabilidad #3: agregar límite
    });
  } catch (error) {
    console.error("Error en getCotizaciones:", error);
    return [];
  }
}

export async function getCotizacionesPorEstado() {
  await requireAdmin(); // ← Vulnerabilidad #1: verificar que es admin

  try {
    const cotizaciones = await prisma.cotizacion.findMany({
      include: { cliente: true },
      orderBy: { creadoEn: "desc" },
      take: 50, // ← Vulnerabilidad #3: agregar límite
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
  } catch (error) {
    console.error("Error en getCotizacionesPorEstado:", error);
    return { nuevo: [], contactado: [], visita_tecnica: [], presupuestado: [], ganado: [], perdido: [] };
  }
}
