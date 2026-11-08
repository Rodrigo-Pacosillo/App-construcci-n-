import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { ToolContext } from "@/lib/ai/contexto";
import { fechaNegocio } from "@/lib/ai/datos/formato";
import { ESTADO_PAGO_LABELS } from "@/lib/ai/datos/labels";
import { resolverObra } from "@/lib/ai/datos/resolvers/obra";

export const misPagosTool = (ctx: ToolContext) =>
  tool({
    description: "Lista los pagos registrados de las obras del cliente.",
    inputSchema: z.object({
      obra: z.string().optional().describe("Nombre o direccion de la obra (opcional)"),
    }),
    execute: async ({ obra }) => {
      const clienteId = ctx.clienteId;
      if (!clienteId) return { estado: "sin_cliente", mensaje: "No hay cliente asociado a la sesion." };

      let obraIds: string[] = [];
      if (obra && obra.trim()) {
        const res = await resolverObra(obra, { clienteId });
        if (res.estado === "ninguno") return { estado: "ninguno", sugerencia: res.sugerencia };
        if (res.estado === "ambiguo") return { estado: "ambiguo", opciones: res.opciones, sugerencia: res.sugerencia };
        obraIds = [res.valor.id];
      } else {
        const obras = await prisma.obraActiva.findMany({ where: { clienteId }, select: { id: true } });
        obraIds = obras.map((o) => o.id);
      }

      if (obraIds.length === 0) return { estado: "ok", total: 0, pagos: [] };

      const pagos = await prisma.pagoObra.findMany({
        where: { obraId: { in: obraIds } },
        orderBy: { fecha: "desc" },
        take: 30,
        select: { monto: true, fecha: true, concepto: true, estado: true, obra: { select: { nombreComercial: true, direccionObra: true } } },
      });

      return {
        estado: "ok",
        total: pagos.length,
        pagos: pagos.map((p) => ({
          obra: p.obra.nombreComercial ?? p.obra.direccionObra,
          monto: Number(p.monto),
          fecha: fechaNegocio(p.fecha),
          concepto: p.concepto,
          estado: ESTADO_PAGO_LABELS[p.estado as keyof typeof ESTADO_PAGO_LABELS] ?? p.estado,
        })),
      };
    },
  });

export default misPagosTool;