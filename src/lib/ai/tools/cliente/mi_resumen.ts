import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { ToolContext } from "@/lib/ai/contexto";
import { fechaNegocio } from "@/lib/ai/datos/formato";
import { ESTADO_LABELS, ESTADO_OBRA_LABELS } from "@/lib/ai/datos/labels";

export const miResumenTool = (ctx: ToolContext) =>
  tool({
    description: "Devuelve un resumen de la cuenta del cliente autenticado: contacto, cotizaciones, obra actual y proximo evento.",
    inputSchema: z.object({}),
    execute: async () => {
      const clienteId = ctx.clienteId;
      if (!clienteId) return { estado: "sin_cliente", mensaje: "No hay cliente asociado a la sesion." };
      const cliente = await prisma.cliente.findUnique({
        where: { id: clienteId },
        select: { nombre: true, apellidos: true, email: true, telefono: true, ciudad: true },
      });
      if (!cliente) return { estado: "ninguno", mensaje: "Cliente no encontrado." };

      const [cotCount, cotPorEstado, obras, proximoEvento] = await Promise.all([
        prisma.cotizacion.count({ where: { clienteId } }),
        prisma.cotizacion.groupBy({ by: ["estado"], where: { clienteId }, _count: { _all: true } }),
        prisma.obraActiva.findMany({
          where: { clienteId },
          orderBy: { fechaInicio: "desc" },
          take: 5,
          select: { nombreComercial: true, direccionObra: true, estado: true, progreso: true, fechaInicio: true, fechaFinEstimada: true },
        }),
        prisma.eventoCalendario.findFirst({
          where: { clienteId, fechaInicio: { gte: ctx.ahora }, visibleCliente: true },
          orderBy: { fechaInicio: "asc" },
          select: { titulo: true, fechaInicio: true, todoElDia: true },
        }),
      ]);

      const porEstado = cotPorEstado.reduce<Record<string, number>>((acc, r) => {
        acc[ESTADO_LABELS[r.estado as keyof typeof ESTADO_LABELS] ?? r.estado] = r._count._all;
        return acc;
      }, {});

      return {
        estado: "ok",
        cliente: {
          nombre: `${cliente.nombre} ${cliente.apellidos}`,
          email: cliente.email,
          telefono: cliente.telefono,
          ciudad: cliente.ciudad,
        },
        cotizaciones: { total: cotCount, porEstado },
        obras: obras.map((o) => ({
          nombre: o.nombreComercial ?? "Obra sin nombre",
          direccion: o.direccionObra,
          estado: ESTADO_OBRA_LABELS[o.estado as keyof typeof ESTADO_OBRA_LABELS] ?? o.estado,
          progreso: o.progreso,
          inicio: fechaNegocio(o.fechaInicio),
          finEstimada: o.fechaFinEstimada ? fechaNegocio(o.fechaFinEstimada) : null,
        })),
        proximoEvento: proximoEvento
          ? { titulo: proximoEvento.titulo, fecha: fechaNegocio(proximoEvento.fechaInicio), todoElDia: proximoEvento.todoElDia }
          : null,
      };
    },
  });

export default miResumenTool;