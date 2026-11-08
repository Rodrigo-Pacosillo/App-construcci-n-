import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { ToolContext } from "@/lib/ai/contexto";
import { fechaNegocio } from "@/lib/ai/datos/formato";
import { ESTADO_LABELS, TIPO_OBRA_LABELS } from "@/lib/ai/datos/labels";

export const pendientesTool = (ctx: ToolContext) => {
    void ctx;
    return tool({
    description: "Lista pendientes del negocio: cotizaciones por revisar, obras pausadas y acciones de chat pendientes.",
    inputSchema: z.object({}),
    execute: async () => {
      const [cotizaciones, obrasPausadas, accionesPendientes] = await Promise.all([
        prisma.cotizacion.findMany({
          where: { estado: { in: ["nuevo", "contactado"] } },
          orderBy: { creadoEn: "desc" },
          take: 20,
          select: { tipoObra: true, estado: true, creadoEn: true, cliente: { select: { nombre: true, apellidos: true } } },
        }),
        prisma.obraActiva.findMany({
          where: { estado: "pausada" },
          orderBy: { fechaInicio: "desc" },
          take: 20,
          select: { nombreComercial: true, direccionObra: true, cliente: { select: { nombre: true, apellidos: true } } },
        }),
        prisma.chatAccion.count({ where: { estado: "pendiente" } }),
      ]);

      return {
        estado: "ok",
        cotizacionesPendientes: cotizaciones.map((c) => ({
          cliente: `${c.cliente.nombre} ${c.cliente.apellidos}`,
          tipoObra: TIPO_OBRA_LABELS[c.tipoObra as keyof typeof TIPO_OBRA_LABELS] ?? c.tipoObra,
          estado: ESTADO_LABELS[c.estado as keyof typeof ESTADO_LABELS] ?? c.estado,
          fecha: fechaNegocio(c.creadoEn),
        })),
        obrasPausadas: obrasPausadas.map((o) => ({
          cliente: `${o.cliente.nombre} ${o.cliente.apellidos}`,
          obra: o.nombreComercial ?? o.direccionObra,
          direccion: o.direccionObra,
        })),
        accionesChatPendientes: accionesPendientes,
      };
    },
  });
}

export default pendientesTool;
