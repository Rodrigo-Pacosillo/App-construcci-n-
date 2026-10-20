"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";

export async function getDashboardStats() {
  await requireAdmin();

  try {
    const grouped = await prisma.cotizacion.groupBy({
      by: ["estado"],
      _count: { _all: true },
    });

    const porEstado: Record<string, number> = {};
    let totalCotizaciones = 0;
    for (const g of grouped) {
      porEstado[g.estado] = g._count._all;
      totalCotizaciones += g._count._all;
    }

    const proyectos = await prisma.proyecto.count();
    const testimonios = await prisma.testimonio.count({ where: { publicado: true } });

    return { totalCotizaciones, porEstado, proyectos, testimonios };
  } catch (error) {
    console.error("Error en getDashboardStats:", error);
    return { totalCotizaciones: 0, porEstado: {}, proyectos: 0, testimonios: 0 };
  }
}

export async function getCotizacionesRecientes() {
  await requireAdmin();

  try {
    return await prisma.cotizacion.findMany({
      include: { cliente: true },
      orderBy: { creadoEn: "desc" },
      take: 5,
    });
  } catch (error) {
    console.error("Error en getCotizacionesRecientes:", error);
    return [];
  }
}

export async function getDashboardAlertas() {
  await requireAdmin();

  try {
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const nuevasSinContactar = await prisma.cotizacion.findMany({
      where: { estado: "nuevo", creadoEn: { lt: hace24h } },
      include: { cliente: true },
      orderBy: { creadoEn: "asc" },
      take: 10,
    });

    const obrasPausadas = await prisma.obraActiva.findMany({
      where: { estado: "pausada" },
      include: { cliente: true },
      take: 10,
    });

    const contratadasSinContrato = await prisma.cliente.findMany({
      where: {
        cotizaciones: { some: { estado: "contratado" } },
        contratos: { none: {} },
      },
      take: 10,
    });

    return { nuevasSinContactar, obrasPausadas, contratadasSinContrato };
  } catch (error) {
    console.error("Error en getDashboardAlertas:", error);
    return { nuevasSinContactar: [], obrasPausadas: [], contratadasSinContrato: [] };
  }
}
