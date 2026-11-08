import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { ToolContext } from "@/lib/ai/contexto";
import { fechaNegocio } from "@/lib/ai/datos/formato";

export const miCalendarioTool = (ctx: ToolContext) =>
  tool({
    description: "Lista los proximos eventos del calendario visibles para el cliente.",
    inputSchema: z.object({
      dias: z.number().int().min(1).max(90).optional().describe("Horizonte en dias (por defecto 30)"),
    }),
    execute: async ({ dias }) => {
      const clienteId = ctx.clienteId;
      if (!clienteId) return { estado: "sin_cliente", mensaje: "No hay cliente asociado a la sesion." };
      const hasta = new Date(ctx.ahora.getTime() + (dias ?? 30) * 24 * 60 * 60 * 1000);
      const eventos = await prisma.eventoCalendario.findMany({
        where: {
          visibleCliente: true,
          fechaInicio: { gte: ctx.ahora, lte: hasta },
          OR: [{ clienteId }, { obra: { clienteId } }],
        },
        orderBy: { fechaInicio: "asc" },
        take: 30,
        select: {
          titulo: true,
          descripcion: true,
          fechaInicio: true,
          fechaFin: true,
          todoElDia: true,
          tipo: true,
          obra: { select: { nombreComercial: true, direccionObra: true } },
        },
      });
      return {
        estado: "ok",
        total: eventos.length,
        eventos: eventos.map((e) => ({
          titulo: e.titulo,
          tipo: e.tipo,
          descripcion: e.descripcion,
          inicio: fechaNegocio(e.fechaInicio),
          fin: e.fechaFin ? fechaNegocio(e.fechaFin) : null,
          todoElDia: e.todoElDia,
          obra: e.obra ? e.obra.nombreComercial ?? e.obra.direccionObra : null,
        })),
      };
    },
  });

export default miCalendarioTool;