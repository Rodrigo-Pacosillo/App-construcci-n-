import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type { ToolContext } from "@/lib/ai/contexto";
import { resolverCliente } from "@/lib/ai/datos/resolvers/cliente";
import { resolverCotizacion } from "@/lib/ai/datos/resolvers/cotizacion";
import { ESTADO_LABELS } from "@/lib/ai/datos/labels";

const TRANSICIONES: Record<string, string[]> = {
  nuevo: ["contactado", "contratado", "no_concretado"],
  contactado: ["contratado", "no_concretado"],
  contratado: [],
  no_concretado: ["nuevo", "contactado"],
};

export const proponerCambioEstadoCotizacionTool = (ctx: ToolContext) =>
  tool({
    description: "Propone cambiar el estado de una cotizacion. Requiere confirmacion humana.",
    inputSchema: z.object({
      cliente: z.string().min(1).describe("Cliente (nombre, email o telefono)"),
      cotizacion: z.string().optional().describe("Descripcion de la cotizacion (opcional)"),
      nuevoEstado: z.enum(["nuevo", "contactado", "contratado", "no_concretado"]),
    }),
    execute: async ({ cliente, cotizacion, nuevoEstado }) => {
      if (!ctx.usuarioId) return { estado: "sin_usuario", mensaje: "Se requiere usuario autenticado." };

      const cr = await resolverCliente(cliente);
      if (cr.estado === "ninguno") return { estado: "ninguno", sugerencia: cr.sugerencia };
      if (cr.estado === "ambiguo") return { estado: "ambiguo", opciones: cr.opciones, sugerencia: cr.sugerencia };
      const clienteId = cr.valor.id;

      const cotRes = await resolverCotizacion(cotizacion, { clienteId });
      if (cotRes.estado === "ninguno") return { estado: "ninguno", sugerencia: cotRes.sugerencia };
      if (cotRes.estado === "ambiguo") return { estado: "ambiguo", opciones: cotRes.opciones, sugerencia: cotRes.sugerencia };

      const cot = cotRes.valor;
      if (cot.estado === nuevoEstado) return { estado: "sin_cambios", mensaje: "La cotizacion ya tiene ese estado." };

      const permitidos = TRANSICIONES[cot.estado] ?? [];
      if (!permitidos.includes(nuevoEstado)) {
        return {
          estado: "transicion_invalida",
          mensaje: `No se puede pasar de "${cot.estado}" a "${nuevoEstado}".`,
        };
      }

      if (nuevoEstado === "contratado") {
        const contrato = await prisma.contrato.findFirst({ where: { cotizacionId: cot.id } });
        if (!contrato) {
          return {
            estado: "sin_contrato",
            mensaje: "Para marcar como contratado debe existir un contrato asociado a la cotizacion.",
          };
        }
      }

      const accion = await prisma.chatAccion.create({
        data: {
          sesionId: ctx.sesionId,
          usuarioId: ctx.usuarioId,
          herramienta: "proponer_cambio_estado_cotizacion",
          argumentos: { cotizacionId: cot.id, nuevoEstado } as unknown as Prisma.InputJsonValue,
          resumen: {
            cotizacion: `${cot.tipoObra} - ${cot.estado}`,
            nuevoEstado: ESTADO_LABELS[nuevoEstado as keyof typeof ESTADO_LABELS] ?? nuevoEstado,
          } as unknown as Prisma.InputJsonValue,
          precondiciones: { estadoActual: cot.estado, transicionValida: true } as unknown as Prisma.InputJsonValue,
          estado: "pendiente",
          expiraEn: new Date(ctx.ahora.getTime() + 30 * 60 * 1000),
        },
      });

      return {
        estado: "ok",
        pendiente: true,
        accionId: accion.id,
        mensaje: `Propuesta creada para cambiar la cotizacion a "${nuevoEstado}". Requiere confirmacion.`,
      };
    },
  });

export default proponerCambioEstadoCotizacionTool;