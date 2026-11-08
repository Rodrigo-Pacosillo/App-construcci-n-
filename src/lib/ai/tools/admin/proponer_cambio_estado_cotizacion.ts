import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type { ToolContext } from "@/lib/ai/contexto";
import { resolverCliente } from "@/lib/ai/datos/resolvers/cliente";
import { resolverCotizacion } from "@/lib/ai/datos/resolvers/cotizacion";
import { ESTADO_LABELS } from "@/lib/ai/datos/labels";
import { ACCION_EXPIRACION_MIN } from "@/lib/ai/config";

const TRANSICIONES: Record<string, string[]> = {
  nuevo: ["contactado", "contratado", "no_concretado"],
  contactado: ["contratado", "no_concretado"],
  contratado: [],
  no_concretado: ["nuevo", "contactado"],
};

export const proponerCambioEstadoCotizacionTool = (ctx: ToolContext) =>
  tool({
    description: "Propone cambiar el estado de una cotización. Requiere confirmación humana.",
    inputSchema: z.object({
      cliente: z.string().min(2).describe("Cliente (nombre, apellido, teléfono o correo)"),
      cotizacion: z.string().optional().describe("Referencia de la cotización (tipo, fecha, etc.), opcional"),
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
      if (cot.estado === nuevoEstado) return { estado: "sin_cambios", mensaje: "La cotización ya tiene ese estado." };

      const permitidos = TRANSICIONES[cot.estado] ?? [];
      if (!permitidos.includes(nuevoEstado)) {
        return {
          estado: "transicion_invalida",
          mensaje: `No se puede pasar de "${ESTADO_LABELS[cot.estado as keyof typeof ESTADO_LABELS] ?? cot.estado}" a "${ESTADO_LABELS[nuevoEstado as keyof typeof ESTADO_LABELS] ?? nuevoEstado}".`,
        };
      }

      if (nuevoEstado === "contratado") {
        const contrato = await prisma.contrato.findFirst({ where: { cotizacionId: cot.id, estado: { not: "anulado" } } });
        if (!contrato) {
          return {
            estado: "sin_contrato",
            mensaje: "Para marcar como contratado debe existir un contrato no anulado asociado a la cotización. Créelo desde el panel Contratos.",
          };
        }
      }

      const clienteNombre = `${cr.valor.nombre} ${cr.valor.apellidos}`;
      const estadoActualLabel = ESTADO_LABELS[cot.estado as keyof typeof ESTADO_LABELS] ?? cot.estado;
      const estadoNuevoLabel = ESTADO_LABELS[nuevoEstado as keyof typeof ESTADO_LABELS] ?? nuevoEstado;

      const accion = await prisma.chatAccion.create({
        data: {
          sesionId: ctx.sesionId,
          usuarioId: ctx.usuarioId,
          herramienta: "proponer_cambio_estado_cotizacion",
          argumentos: { cotizacionId: cot.id, nuevoEstado } as unknown as Prisma.InputJsonValue,
          resumen: {
            tipo: "cambio_estado",
            cliente: clienteNombre,
            cotizacion: `${cot.tipoObra} - ${estadoActualLabel}`,
            estadoActual: estadoActualLabel,
            estadoNuevo: estadoNuevoLabel,
          } as unknown as Prisma.InputJsonValue,
          precondiciones: { estadoAnterior: cot.estado } as unknown as Prisma.InputJsonValue,
          estado: "pendiente",
          expiraEn: new Date(ctx.ahora.getTime() + ACCION_EXPIRACION_MIN * 60 * 1000),
        },
      });

      return {
        estado: "ok",
        pendiente: true,
        accionId: accion.id,
        ui: {
          tipo: "accion",
          accionId: accion.id,
          herramienta: "proponer_cambio_estado_cotizacion",
          estado: "pendiente",
          resumen: {
            tipo: "cambio_estado",
            cliente: clienteNombre,
            cotizacion: `${cot.tipoObra} - ${estadoActualLabel}`,
            estadoActual: estadoActualLabel,
            estadoNuevo: estadoNuevoLabel,
          },
        },
        mensaje: `Propuesta creada: cambiar estado de la cotización de "${estadoActualLabel}" a "${estadoNuevoLabel}". Requiere confirmación.`,
      };
    },
  });