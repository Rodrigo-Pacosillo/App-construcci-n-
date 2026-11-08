import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { ToolContext } from "@/lib/ai/contexto";
import { fechaNegocio } from "@/lib/ai/datos/formato";
import { ESTADO_OBRA_LABELS } from "@/lib/ai/datos/labels";
import { resolverCliente } from "@/lib/ai/datos/resolvers/cliente";

export const listarObrasTool = (ctx: ToolContext) => {
    void ctx;
    return tool({
    description: "Lista obras con filtros opcionales por cliente y estado.",
    inputSchema: z.object({
      cliente: z.string().optional().describe("Nombre, email o telefono del cliente (opcional)"),
      estado: z.enum(["en_curso", "pausada", "finalizada", "entregada"]).optional(),
      limite: z.number().int().min(1).max(50).optional(),
    }),
    execute: async ({ cliente, estado, limite }) => {
      let clienteId: string | undefined;
      if (cliente && cliente.trim()) {
        const res = await resolverCliente(cliente);
        if (res.estado === "ninguno") return { estado: "ninguno", sugerencia: res.sugerencia };
        if (res.estado === "ambiguo") return { estado: "ambiguo", opciones: res.opciones, sugerencia: res.sugerencia };
        clienteId = res.valor.id;
      }

      const rows = await prisma.obraActiva.findMany({
        where: {
          ...(clienteId ? { clienteId } : {}),
          ...(estado ? { estado } : {}),
        },
        orderBy: { fechaInicio: "desc" },
        take: limite ?? 20,
        select: {
          nombreComercial: true,
          direccionObra: true,
          estado: true,
          progreso: true,
          fechaInicio: true,
          fechaFinEstimada: true,
          cliente: { select: { nombre: true, apellidos: true } },
        },
      });

      return {
        estado: "ok",
        total: rows.length,
        obras: rows.map((o) => ({
          cliente: `${o.cliente.nombre} ${o.cliente.apellidos}`,
          nombre: o.nombreComercial ?? "Obra sin nombre",
          direccion: o.direccionObra,
          estado: ESTADO_OBRA_LABELS[o.estado as keyof typeof ESTADO_OBRA_LABELS] ?? o.estado,
          progreso: o.progreso,
          inicio: fechaNegocio(o.fechaInicio),
          finEstimada: o.fechaFinEstimada ? fechaNegocio(o.fechaFinEstimada) : null,
        })),
      };
    },
  });
}

export default listarObrasTool;
