import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { ToolContext } from "@/lib/ai/contexto";
import { fechaNegocio } from "@/lib/ai/datos/formato";
import { ESTADO_LABELS, TIPO_OBRA_LABELS } from "@/lib/ai/datos/labels";
import { resolverCliente } from "@/lib/ai/datos/resolvers/cliente";

export const listarCotizacionesTool = (ctx: ToolContext) => {
    void ctx;
    return tool({
    description: "Lista cotizaciones con filtros opcionales por cliente y estado.",
    inputSchema: z.object({
      cliente: z.string().optional().describe("Nombre, email o telefono del cliente (opcional)"),
      estado: z.enum(["nuevo", "contactado", "contratado", "no_concretado"]).optional(),
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

      const rows = await prisma.cotizacion.findMany({
        where: {
          ...(clienteId ? { clienteId } : {}),
          ...(estado ? { estado } : {}),
        },
        orderBy: { creadoEn: "desc" },
        take: limite ?? 20,
        select: {
          tipoObra: true,
          estado: true,
          creadoEn: true,
          ubicacionObra: true,
          cliente: { select: { nombre: true, apellidos: true } },
        },
      });

      return {
        estado: "ok",
        total: rows.length,
        cotizaciones: rows.map((c) => ({
          cliente: `${c.cliente.nombre} ${c.cliente.apellidos}`,
          tipoObra: TIPO_OBRA_LABELS[c.tipoObra as keyof typeof TIPO_OBRA_LABELS] ?? c.tipoObra,
          estado: ESTADO_LABELS[c.estado as keyof typeof ESTADO_LABELS] ?? c.estado,
          ubicacion: c.ubicacionObra,
          fecha: fechaNegocio(c.creadoEn),
        })),
      };
    },
  });
}

export default listarCotizacionesTool;
