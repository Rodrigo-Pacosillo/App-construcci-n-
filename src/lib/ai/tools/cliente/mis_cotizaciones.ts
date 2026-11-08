import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { ToolContext } from "@/lib/ai/contexto";
import { fechaNegocio } from "@/lib/ai/datos/formato";
import {
  ESTADO_LABELS,
  TIPO_OBRA_LABELS,
  TIPO_CONSTRUCCION_LABELS,
  RANGO_M2_LABELS,
  PLAZO_INICIO_LABELS,
} from "@/lib/ai/datos/labels";

export const misCotizacionesTool = (ctx: ToolContext) =>
  tool({
    description: "Lista las cotizaciones del cliente autenticado con su estado y datos.",
    inputSchema: z.object({}),
    execute: async () => {
      const clienteId = ctx.clienteId;
      if (!clienteId) return { estado: "sin_cliente", mensaje: "No hay cliente asociado a la sesion." };
      const rows = await prisma.cotizacion.findMany({
        where: { clienteId },
        orderBy: { creadoEn: "desc" },
        take: 20,
        select: {
          tipoObra: true,
          tipoConstruccion: true,
          rangoM2: true,
          plazoInicio: true,
          ubicacionObra: true,
          estado: true,
          creadoEn: true,
        },
      });
      return {
        estado: "ok",
        total: rows.length,
        cotizaciones: rows.map((c) => ({
          tipoObra: TIPO_OBRA_LABELS[c.tipoObra as keyof typeof TIPO_OBRA_LABELS] ?? c.tipoObra,
          tipoConstruccion:
            TIPO_CONSTRUCCION_LABELS[c.tipoConstruccion as keyof typeof TIPO_CONSTRUCCION_LABELS] ?? c.tipoConstruccion,
          superficie: RANGO_M2_LABELS[c.rangoM2 as keyof typeof RANGO_M2_LABELS] ?? c.rangoM2,
          plazoInicio: PLAZO_INICIO_LABELS[c.plazoInicio as keyof typeof PLAZO_INICIO_LABELS] ?? c.plazoInicio,
          ubicacion: c.ubicacionObra,
          estado: ESTADO_LABELS[c.estado as keyof typeof ESTADO_LABELS] ?? c.estado,
          fecha: fechaNegocio(c.creadoEn),
        })),
      };
    },
  });

export default misCotizacionesTool;