import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { ToolContext } from "@/lib/ai/contexto";

export const inventarioTool = (ctx: ToolContext) => {
    void ctx;
    return tool({
    description: "Consulta inventario de herramientas y materiales.",
    inputSchema: z.object({
      filtro: z.string().optional().describe("Texto para filtrar por nombre"),
      estadoHerramienta: z.enum(["disponible", "en_uso", "mantenimiento", "baja"]).optional(),
    }),
    execute: async ({ filtro, estadoHerramienta }) => {
      const [herramientas, materiales] = await Promise.all([
        prisma.herramienta.findMany({
          where: {
            activo: true,
            ...(filtro ? { nombre: { contains: filtro, mode: "insensitive" } } : {}),
            ...(estadoHerramienta ? { estado: estadoHerramienta } : {}),
          },
          take: 30,
          select: { nombre: true, codigo: true, estado: true },
        }),
        prisma.material.findMany({
          where: {
            activo: true,
            ...(filtro ? { nombre: { contains: filtro, mode: "insensitive" } } : {}),
          },
          take: 30,
          select: { nombre: true, unidad: true, stockActual: true, stockMinimo: true, precioUnitario: true },
        }),
      ]);

      return {
        estado: "ok",
        herramientas: herramientas.map((h) => ({ nombre: h.nombre, codigo: h.codigo, estado: h.estado })),
        materiales: materiales.map((m) => ({
          nombre: m.nombre,
          unidad: m.unidad,
          stockActual: Number(m.stockActual),
          stockMinimo: Number(m.stockMinimo),
          precioUnitario: Number(m.precioUnitario),
        })),
      };
    },
  });
}

export default inventarioTool;
