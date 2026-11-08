import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { ToolContext } from "@/lib/ai/contexto";
import { fechaNegocio } from "@/lib/ai/datos/formato";
import { ESTADO_PAGO_LABELS } from "@/lib/ai/datos/labels";
import { resolverCliente } from "@/lib/ai/datos/resolvers/cliente";
import { resolverObra } from "@/lib/ai/datos/resolvers/obra";

export const estadoFinancieroTool = (ctx: ToolContext) => {
    void ctx;
    return tool({
    description: "Devuelve el estado financiero (pagos) por cliente, obra o global.",
    inputSchema: z.object({
      cliente: z.string().optional().describe("Cliente (opcional)"),
      obra: z.string().optional().describe("Obra (opcional)"),
    }),
    execute: async ({ cliente, obra }) => {
      // Resolver obra si se indica
      if (obra && obra.trim()) {
        let clienteId: string | undefined;
        if (cliente && cliente.trim()) {
          const cr = await resolverCliente(cliente);
          if (cr.estado === "ninguno") return { estado: "ninguno", sugerencia: cr.sugerencia };
          if (cr.estado === "ambiguo") return { estado: "ambiguo", opciones: cr.opciones, sugerencia: cr.sugerencia };
          clienteId = cr.valor.id;
        }
        const or = await resolverObra(obra, { clienteId });
        if (or.estado === "ninguno") return { estado: "ninguno", sugerencia: or.sugerencia };
        if (or.estado === "ambiguo") return { estado: "ambiguo", opciones: or.opciones, sugerencia: or.sugerencia };

        const pagos = await prisma.pagoObra.findMany({
          where: { obraId: or.valor.id },
          orderBy: { fecha: "desc" },
          select: { monto: true, fecha: true, concepto: true, estado: true },
        });
        const total = pagos.reduce((a, p) => a + Number(p.monto), 0);
        return {
          estado: "ok",
          alcance: "obra",
          totalPagado: total,
          pagos: pagos.map((p) => ({
            monto: Number(p.monto),
            fecha: fechaNegocio(p.fecha),
            concepto: p.concepto,
            estado: ESTADO_PAGO_LABELS[p.estado as keyof typeof ESTADO_PAGO_LABELS] ?? p.estado,
          })),
        };
      }

      // Por cliente
      if (cliente && cliente.trim()) {
        const cr = await resolverCliente(cliente);
        if (cr.estado === "ninguno") return { estado: "ninguno", sugerencia: cr.sugerencia };
        if (cr.estado === "ambiguo") return { estado: "ambiguo", opciones: cr.opciones, sugerencia: cr.sugerencia };
        const clienteId = cr.valor.id;
        const obras = await prisma.obraActiva.findMany({ where: { clienteId }, select: { id: true } });
        const obraIds = obras.map((o) => o.id);
        const pagos = await prisma.pagoObra.findMany({
          where: { obraId: { in: obraIds } },
          orderBy: { fecha: "desc" },
          select: { monto: true, fecha: true, concepto: true, estado: true, obra: { select: { nombreComercial: true, direccionObra: true } } },
        });
        const total = pagos.reduce((a, p) => a + Number(p.monto), 0);
        return {
          estado: "ok",
          alcance: "cliente",
          totalPagado: total,
          pagos: pagos.map((p) => ({
            obra: p.obra.nombreComercial ?? p.obra.direccionObra,
            monto: Number(p.monto),
            fecha: fechaNegocio(p.fecha),
            concepto: p.concepto,
            estado: ESTADO_PAGO_LABELS[p.estado as keyof typeof ESTADO_PAGO_LABELS] ?? p.estado,
          })),
        };
      }

      // Global
      const pagos = await prisma.pagoObra.findMany({
        orderBy: { fecha: "desc" },
        take: 50,
        select: { monto: true, fecha: true, concepto: true, estado: true, obra: { select: { nombreComercial: true, direccionObra: true, cliente: { select: { nombre: true, apellidos: true } } } } },
      });
      const total = pagos.reduce((a, p) => a + Number(p.monto), 0);
      return {
        estado: "ok",
        alcance: "global",
        totalPagado: total,
        cantidad: pagos.length,
        pagos: pagos.map((p) => ({
          cliente: `${p.obra.cliente.nombre} ${p.obra.cliente.apellidos}`,
          obra: p.obra.nombreComercial ?? p.obra.direccionObra,
          monto: Number(p.monto),
          fecha: fechaNegocio(p.fecha),
          concepto: p.concepto,
          estado: ESTADO_PAGO_LABELS[p.estado as keyof typeof ESTADO_PAGO_LABELS] ?? p.estado,
        })),
      };
    },
  });
}

export default estadoFinancieroTool;
