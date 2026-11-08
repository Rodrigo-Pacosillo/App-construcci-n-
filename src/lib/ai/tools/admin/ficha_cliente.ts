import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { ToolContext } from "@/lib/ai/contexto";
import { fechaNegocio } from "@/lib/ai/datos/formato";
import { ESTADO_LABELS, ESTADO_OBRA_LABELS } from "@/lib/ai/datos/labels";
import { resolverCliente } from "@/lib/ai/datos/resolvers/cliente";

export const fichaClienteTool = (ctx: ToolContext) =>
  tool({
    description: "Devuelve el resumen 360 de un cliente (contacto, cotizaciones, obras, proximo evento, contrato).",
    inputSchema: z.object({
      cliente: z.string().min(1).describe("Nombre, email o telefono del cliente"),
    }),
    execute: async ({ cliente }) => {
      const res = await resolverCliente(cliente);
      if (res.estado === "ninguno") return { estado: "ninguno", sugerencia: res.sugerencia };
      if (res.estado === "ambiguo") return { estado: "ambiguo", opciones: res.opciones, sugerencia: res.sugerencia };

      const clienteId = res.valor.id;
      const c = await prisma.cliente.findUnique({
        where: { id: clienteId },
        select: { nombre: true, apellidos: true, email: true, telefono: true, ciudad: true },
      });
      if (!c) return { estado: "ninguno", mensaje: "Cliente no encontrado." };

      const [cotizaciones, obras, proximoEvento, contratoReciente] = await Promise.all([
        prisma.cotizacion.findMany({
          where: { clienteId },
          orderBy: { creadoEn: "desc" },
          take: 5,
          select: { tipoObra: true, estado: true, creadoEn: true },
        }),
        prisma.obraActiva.findMany({
          where: { clienteId },
          orderBy: { fechaInicio: "desc" },
          select: { nombreComercial: true, direccionObra: true, estado: true, progreso: true, fechaInicio: true },
        }),
        prisma.eventoCalendario.findFirst({
          where: { obra: { clienteId }, fechaInicio: { gte: ctx.ahora } },
          orderBy: { fechaInicio: "asc" },
          select: { titulo: true, fechaInicio: true, visibleCliente: true },
        }),
        prisma.contrato.findFirst({
          where: { clienteId },
          orderBy: { creadoEn: "desc" },
          select: { estado: true, montoTotal: true, creadoEn: true },
        }),
      ]);

      return {
        estado: "ok",
        cliente: {
          nombre: `${c.nombre} ${c.apellidos}`,
          email: c.email,
          telefono: c.telefono,
          ciudad: c.ciudad,
        },
        cotizaciones: cotizaciones.map((x) => ({
          tipoObra: x.tipoObra,
          estado: ESTADO_LABELS[x.estado as keyof typeof ESTADO_LABELS] ?? x.estado,
          fecha: fechaNegocio(x.creadoEn),
        })),
        obras: obras.map((o) => ({
          nombre: o.nombreComercial ?? "Obra sin nombre",
          direccion: o.direccionObra,
          estado: ESTADO_OBRA_LABELS[o.estado as keyof typeof ESTADO_OBRA_LABELS] ?? o.estado,
          progreso: o.progreso,
          inicio: fechaNegocio(o.fechaInicio),
        })),
        proximoEvento: proximoEvento
          ? { titulo: proximoEvento.titulo, fecha: fechaNegocio(proximoEvento.fechaInicio), visibleCliente: proximoEvento.visibleCliente }
          : null,
        contratoReciente: contratoReciente
          ? { estado: contratoReciente.estado, montoTotal: Number(contratoReciente.montoTotal), fecha: fechaNegocio(contratoReciente.creadoEn) }
          : null,
      };
    },
  });

export default fichaClienteTool;