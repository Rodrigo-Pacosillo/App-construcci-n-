"use server";

import { prisma } from "@/lib/db";

export interface PrecioReferencia {
  tipoConstruccion: string;
  rangoM2: string;
  precioMin: number;
  precioMax: number;
}

export async function getPreciosReferencia(): Promise<PrecioReferencia[]> {
  try {
    const precios = await prisma.precioReferencia.findMany({
      orderBy: { tipoConstruccion: "asc" },
    });
    return precios.map((p) => ({
      tipoConstruccion: p.tipoConstruccion,
      rangoM2: p.rangoM2,
      precioMin: Number(p.precioMin),
      precioMax: Number(p.precioMax),
    }));
  } catch (error) {
    console.error("Error fetching precios de referencia:", error);
    return [];
  }
}
