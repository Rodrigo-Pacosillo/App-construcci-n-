import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { ToolContext } from "@/lib/ai/contexto";
import { fechaNegocio } from "@/lib/ai/datos/formato";
import { ESTADO_OBRA_LABELS } from "@/lib/ai/datos/labels";
import { resolverObra } from "@/lib/ai/datos/resolvers/obra";

export const miObraTool = (ctx: ToolContext) =>
  tool({
    description: "Devuelve el detalle de una obra del cliente (avance, hitos visibles). Si no se indica, usa la obra activa unica.",
    inputSchema: z.object({
      obra: z.string().optional().describe("Nombre o direccion de la obra (opcional)"),
    }),
    execute: async ({ obra }) => {
      const clienteId = ctx.clienteId;
      if (!clienteId) return { estado: "sin_cliente", mensaje: "No hay cliente asociado a la sesion." };

      const res = await resolverObra(obra ?? "", { clienteId });
      if (res.estado === "ninguno") return { estado: "ninguno", sugerencia: res.sugerencia };
      if (res.estado === "ambiguo") {
        return { estado: "ambiguo", opciones: res.opciones, sugerencia: res.sugerencia };
      }
      const obraRow = res.valor;

      const [obraFull, hitos] = await Promise.all([
        prisma.obraActiva.findUnique({
          where: { id: obraRow.id },
          select: {
            nombreComercial: true,
            direccionObra: true,
            estado: true,
            progreso: true,
            fechaInicio: true,
            fechaFinEstimada: true,
          },
        }),
        prisma.hitosObra.findMany({
          where: { obraId: obraRow.id, visibleCliente: true },
          orderBy: { fecha: "asc" },
          select: { titulo: true, descripcion: true, fecha: true, visibleCliente: true },
        }),
      ]);
      if (!obraFull) return { estado: "ninguno", mensaje: "Obra no encontrada." };

      return {
        estado: "ok",
        obra: {
          nombre: obraFull.nombreComercial ?? "Obra sin nombre",
          direccion: obraFull.direccionObra,
          estado: ESTADO_OBRA_LABELS[obraFull.estado as keyof typeof ESTADO_OBRA_LABELS] ?? obraFull.estado,
          progreso: obraFull.progreso,
          inicio: fechaNegocio(obraFull.fechaInicio),
          finEstimada: obraFull.fechaFinEstimada ? fechaNegocio(obraFull.fechaFinEstimada) : null,
        },
        hitos: hitos.map((h) => ({
          titulo: h.titulo,
          descripcion: h.descripcion,
          fecha: fechaNegocio(h.fecha),
          visible: h.visibleCliente,
        })),
      };
    },
  });

export default miObraTool;