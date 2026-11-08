import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { ToolContext } from "@/lib/ai/contexto";
import { fechaNegocio } from "@/lib/ai/datos/formato";
import { resolverCliente } from "@/lib/ai/datos/resolvers/cliente";

export const agendaTool = (ctx: ToolContext) =>
  tool({
    description: "Lista los eventos del calendario en un horizonte de dias, opcionalmente por cliente.",
    inputSchema: z.object({
      cliente: z.string().optional().describe("Cliente (opcional)"),
      dias: z.number().int().min(1).max(90).optional().describe("Horizonte en dias (por defecto 7)"),
    }),
    execute: async ({ cliente, dias }) => {
      const hasta = new Date(ctx.ahora.getTime() + (dias ?? 7) * 24 * 60 * 60 * 1000);
      let where: Record<string, unknown> = { fechaInicio: { gte: ctx.ahora, lte: hasta } };
      if (cliente && cliente.trim()) {
        const cr = await resolverCliente(cliente);
        if (cr.estado === "ninguno") return { estado: "ninguno", sugerencia: cr.sugerencia };
        if (cr.estado === "ambiguo") return { estado: "ambiguo", opciones: cr.opciones, sugerencia: cr.sugerencia };
        where = { ...where, OR: [{ clienteId: cr.valor.id }, { obra: { clienteId: cr.valor.id } }] };
      }

      const eventos = await prisma.eventoCalendario.findMany({
        where,
        orderBy: { fechaInicio: "asc" },
        take: 50,
        select: {
          titulo: true,
          descripcion: true,
          tipo: true,
          fechaInicio: true,
          fechaFin: true,
          todoElDia: true,
          visibleCliente: true,
          obra: { select: { nombreComercial: true, direccionObra: true } },
          cliente: { select: { nombre: true, apellidos: true } },
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
          visibleCliente: e.visibleCliente,
          cliente: e.cliente ? `${e.cliente.nombre} ${e.cliente.apellidos}` : (e.obra ? "Cliente de la obra" : null),
          obra: e.obra ? e.obra.nombreComercial ?? e.obra.direccionObra : null,
        })),
      };
    },
  });

export default agendaTool;