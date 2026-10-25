"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { ESTADO_LABELS, type EstadoCotizacion } from "@/lib/constants";

const DIA_MS = 24 * 60 * 60 * 1000;
const UMBRAL_DEDUPE_MS = 60 * 1000;

export async function getDashboardStats() {
  await requireAdmin();

  try {
    const hace7dias = new Date(Date.now() - 7 * DIA_MS);

    const [nuevas, contactadasSemana] = await Promise.all([
      prisma.cotizacion.count({ where: { estado: "nuevo" } }),
      prisma.cotizacion.count({
        where: {
          estado: "contactado",
          actualizadoEn: { gte: hace7dias },
        },
      }),
    ]);

    return { nuevas, contactadasSemana };
  } catch (error) {
    console.error("Error en getDashboardStats:", error);
    return { nuevas: 0, contactadasSemana: 0 };
  }
}

export type Actividad = {
  id: string;
  tipo:
    | "cotizacion_creada"
    | "cotizacion_actualizada"
    | "contrato_creado"
    | "obra_iniciada";
  fecha: Date;
  titulo: string;
  cliente: string;
  href: string;
};

export async function getActividadReciente(take = 8): Promise<Actividad[]> {
  await requireAdmin();

  try {
    const [cotizaciones, contratos, obras] = await Promise.all([
      prisma.cotizacion.findMany({
        select: {
          id: true,
          estado: true,
          creadoEn: true,
          actualizadoEn: true,
          cliente: { select: { nombre: true, apellidos: true } },
        },
        orderBy: { actualizadoEn: "desc" },
        take: 10,
      }),
      prisma.contrato.findMany({
        select: {
          id: true,
          creadoEn: true,
          cliente: { select: { nombre: true, apellidos: true } },
        },
        orderBy: { creadoEn: "desc" },
        take: 10,
      }),
      prisma.obraActiva.findMany({
        select: {
          id: true,
          direccionObra: true,
          fechaInicio: true,
          cliente: { select: { nombre: true, apellidos: true } },
        },
        orderBy: { fechaInicio: "desc" },
        take: 10,
      }),
    ]);

    const eventos: Actividad[] = [];

    for (const c of cotizaciones) {
      const cliente = `${c.cliente?.nombre ?? ""} ${c.cliente?.apellidos ?? ""}`.trim() || "—";

      eventos.push({
        id: `cotizacion-creada-${c.id}`,
        tipo: "cotizacion_creada",
        fecha: c.creadoEn,
        titulo: "Cotización creada",
        cliente,
        href: `/admin/cotizaciones/${c.id}`,
      });

      const actualizada =
        c.actualizadoEn.getTime() - c.creadoEn.getTime() > UMBRAL_DEDUPE_MS;

      if (actualizada) {
        const estadoLabel =
          ESTADO_LABELS[c.estado as EstadoCotizacion] ?? c.estado;
        eventos.push({
          id: `cotizacion-actualizada-${c.id}`,
          tipo: "cotizacion_actualizada",
          fecha: c.actualizadoEn,
          titulo: `Cotización actualizada a ${estadoLabel}`,
          cliente,
          href: `/admin/cotizaciones/${c.id}`,
        });
      }
    }

    for (const c of contratos) {
      eventos.push({
        id: `contrato-${c.id}`,
        tipo: "contrato_creado",
        fecha: c.creadoEn,
        titulo: "Contrato creado",
        cliente:
          `${c.cliente?.nombre ?? ""} ${c.cliente?.apellidos ?? ""}`.trim() || "—",
        href: `/admin/contratos/${c.id}`,
      });
    }

    for (const o of obras) {
      eventos.push({
        id: `obra-${o.id}`,
        tipo: "obra_iniciada",
        fecha: o.fechaInicio,
        titulo: `Obra iniciada · ${o.direccionObra}`,
        cliente:
          `${o.cliente?.nombre ?? ""} ${o.cliente?.apellidos ?? ""}`.trim() || "—",
        href: `/admin/obras/${o.id}`,
      });
    }

    return eventos
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
      .slice(0, take);
  } catch (error) {
    console.error("Error en getActividadReciente:", error);
    return [];
  }
}
