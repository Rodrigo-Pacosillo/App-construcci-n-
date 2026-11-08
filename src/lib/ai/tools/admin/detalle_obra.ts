import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { ToolContext } from "@/lib/ai/contexto";
import { fechaNegocio } from "@/lib/ai/datos/formato";
import { ESTADO_OBRA_LABELS, ESTADO_PAGO_LABELS } from "@/lib/ai/datos/labels";
import { resolverCliente } from "@/lib/ai/datos/resolvers/cliente";
import { resolverObra } from "@/lib/ai/datos/resolvers/obra";

export const detalleObraTool = (ctx: ToolContext) => {
    void ctx;
    return tool({
    description: "Devuelve el detalle de una obra: hitos, pagos y progreso.",
    inputSchema: z.object({
      obra: z.string().min(1).describe("Nombre o direccion de la obra"),
      cliente: z.string().optional().describe("Cliente (opcional, ayuda a desambiguar)"),
    }),
    execute: async ({ obra, cliente }) => {
      let clienteId: string | undefined;
      if (cliente && cliente.trim()) {
        const cr = await resolverCliente(cliente);
        if (cr.estado === "ninguno") return { estado: "ninguno", sugerencia: cr.sugerencia };
        if (cr.estado === "ambiguo") return { estado: "ambiguo", opciones: cr.opciones, sugerencia: cr.sugerencia };
        clienteId = cr.valor.id;
      }

      const res = await resolverObra(obra, { clienteId });
      if (res.estado === "ninguno") return { estado: "ninguno", sugerencia: res.sugerencia };
      if (res.estado === "ambiguo") return { estado: "ambiguo", opciones: res.opciones, sugerencia: res.sugerencia };

      const obraId = res.valor.id;
      const [full, hitos, pagos, asignaciones] = await Promise.all([
        prisma.obraActiva.findUnique({
          where: { id: obraId },
          select: {
            nombreComercial: true,
            direccionObra: true,
            estado: true,
            progreso: true,
            fechaInicio: true,
            fechaFinEstimada: true,
            cliente: { select: { nombre: true, apellidos: true } },
          },
        }),
        prisma.hitosObra.findMany({
          where: { obraId },
          orderBy: { fecha: "asc" },
          select: { titulo: true, descripcion: true, fecha: true, visibleCliente: true },
        }),
        prisma.pagoObra.findMany({
          where: { obraId },
          orderBy: { fecha: "desc" },
          select: { monto: true, fecha: true, concepto: true, estado: true },
        }),
        prisma.asignacionObra.findMany({
          where: { obraId },
          select: { rolEnObra: true, fechaInicio: true, fechaFin: true, empleado: { select: { nombre: true, apellidos: true, cargo: true } } },
        }),
      ]);
      if (!full) return { estado: "ninguno", mensaje: "Obra no encontrada." };

      return {
        estado: "ok",
        obra: {
          cliente: `${full.cliente.nombre} ${full.cliente.apellidos}`,
          nombre: full.nombreComercial ?? "Obra sin nombre",
          direccion: full.direccionObra,
          estado: ESTADO_OBRA_LABELS[full.estado as keyof typeof ESTADO_OBRA_LABELS] ?? full.estado,
          progreso: full.progreso,
          inicio: fechaNegocio(full.fechaInicio),
          finEstimada: full.fechaFinEstimada ? fechaNegocio(full.fechaFinEstimada) : null,
        },
        hitos: hitos.map((h) => ({
          titulo: h.titulo,
          descripcion: h.descripcion,
          fecha: fechaNegocio(h.fecha),
          visibleCliente: h.visibleCliente,
        })),
        pagos: pagos.map((p) => ({
          monto: Number(p.monto),
          fecha: fechaNegocio(p.fecha),
          concepto: p.concepto,
          estado: ESTADO_PAGO_LABELS[p.estado as keyof typeof ESTADO_PAGO_LABELS] ?? p.estado,
        })),
        equipo: asignaciones.map((a) => ({
          nombre: `${a.empleado.nombre} ${a.empleado.apellidos}`,
          cargo: a.empleado.cargo,
          rolEnObra: a.rolEnObra,
          desde: fechaNegocio(a.fechaInicio),
          hasta: a.fechaFin ? fechaNegocio(a.fechaFin) : null,
        })),
      };
    },
  });
}

export default detalleObraTool;
