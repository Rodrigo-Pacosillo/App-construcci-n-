import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type { ToolContext } from "@/lib/ai/contexto";
import { fechaNegocio, instanteNegocio } from "@/lib/ai/datos/formato";
import { resolverCliente } from "@/lib/ai/datos/resolvers/cliente";
import { resolverObra } from "@/lib/ai/datos/resolvers/obra";
import { ACCION_EXPIRACION_MIN } from "@/lib/ai/config";

export const proponerEventoCalendarioTool = (ctx: ToolContext) =>
  tool({
    description: "Propone crear un evento en el calendario de un cliente. Requiere confirmación humana.",
    inputSchema: z.object({
      cliente: z.string().min(2).describe("Cliente (nombre, apellido, teléfono o correo)"),
      obra: z.string().optional().describe("Obra (nombre o dirección), solo si el admin la mencionó"),
      tipo: z.enum(["nota", "visita_tecnica", "recordatorio", "reunion"]).default("nota"),
      titulo: z.string().min(1).max(120),
      descripcion: z.string().max(2000).optional(),
      fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("YYYY-MM-DD en hora de Bolivia"),
      hora: z.string().regex(/^\d{2}:\d{2}$/).optional().describe("HH:mm 24h; omitir si es todo el día"),
      visibleCliente: z.boolean().optional(),
    }),
    execute: async (args) => {
      if (!ctx.usuarioId) return { estado: "sin_usuario", mensaje: "Se requiere usuario autenticado." };

      const cr = await resolverCliente(args.cliente);
      if (cr.estado === "ninguno") return { estado: "ninguno", sugerencia: cr.sugerencia };
      if (cr.estado === "ambiguo") return { estado: "ambiguo", opciones: cr.opciones, sugerencia: cr.sugerencia };
      const clienteId = cr.valor.id;

      const sinObra = !args.obra || !args.obra.trim();
      let obraRes: Awaited<ReturnType<typeof resolverObra>> | null = null;
      if (!sinObra) {
        obraRes = await resolverObra(args.obra!, { clienteId });
        if (obraRes.estado === "ninguno") {
          return { estado: "ninguno", sugerencia: (obraRes as { sugerencia?: string }).sugerencia ?? "No encontré la obra." };
        }
        if (obraRes.estado === "ambiguo") {
          return { estado: "ambiguo", opciones: obraRes.opciones, sugerencia: obraRes.sugerencia };
        }
      }

      const obraUnica = !sinObra && obraRes && obraRes.estado === "unico"
        ? (obraRes as { valor: { id: string; nombreComercial: string | null; direccionObra: string } }).valor
        : undefined;
      const obraFijada = obraUnica?.id;
      const obraEtiqueta = obraFijada && obraUnica
        ? (obraUnica.nombreComercial ?? obraUnica.direccionObra)
        : "Sin obra (solo admin)";

      const defaultVisible = args.tipo === "visita_tecnica" || args.tipo === "reunion";
      const visibleClienteEfectiva = obraFijada ? (args.visibleCliente ?? defaultVisible) : false;

      let fechaInicio: Date;
      try {
        fechaInicio = instanteNegocio(args.fecha, args.hora ?? null);
      } catch (e) {
        return { estado: "fecha_invalida", mensaje: e instanceof Error ? e.message : "Fecha u hora inválida." };
      }
      if (fechaInicio < new Date()) {
        return { estado: "fecha_pasada", mensaje: "La fecha indicada ya pasó. ¿Quiere otra fecha?" };
      }

      const cliente = await prisma.cliente.findUnique({ where: { id: clienteId }, select: { nombre: true, apellidos: true } });
      const clienteNombre = cliente ? `${cliente.nombre} ${cliente.apellidos}` : "Cliente";

      const subtipo = args.tipo;
      const cuando = fechaNegocio(fechaInicio);

      const accion = await prisma.chatAccion.create({
        data: {
          sesionId: ctx.sesionId,
          usuarioId: ctx.usuarioId,
          herramienta: "proponer_evento_calendario",
          argumentos: {
            clienteId,
            obraId: obraFijada ?? null,
            tipo: subtipo,
            titulo: args.titulo,
            descripcion: args.descripcion ?? null,
            fecha: args.fecha,
            hora: args.hora ?? null,
            visibleCliente: visibleClienteEfectiva,
          } as unknown as Prisma.InputJsonValue,
          resumen: {
            tipo: "evento",
            subtipo,
            titulo: args.titulo,
            descripcion: args.descripcion ?? null,
            cliente: clienteNombre,
            obra: obraEtiqueta,
            cuando,
            fecha: args.fecha,
            hora: args.hora ?? null,
            visibleCliente: visibleClienteEfectiva,
          } as unknown as Prisma.InputJsonValue,
          precondiciones: { clienteExiste: true } as unknown as Prisma.InputJsonValue,
          estado: "pendiente",
          expiraEn: new Date(ctx.ahora.getTime() + ACCION_EXPIRACION_MIN * 60 * 1000),
        },
      });

      return {
        estado: "ok",
        pendiente: true,
        accionId: accion.id,
        ui: {
          tipo: "accion",
          accionId: accion.id,
          herramienta: "proponer_evento_calendario",
          estado: "pendiente",
          resumen: {
            tipo: "evento",
            subtipo,
            titulo: args.titulo,
            descripcion: args.descripcion ?? null,
            cliente: clienteNombre,
            obra: obraEtiqueta,
            cuando,
            fecha: args.fecha,
            hora: args.hora ?? null,
            visibleCliente: visibleClienteEfectiva,
          },
        },
        mensaje: `Propuesta creada: ${subtipo} "${args.titulo}" para el ${cuando}. Visible para el cliente: ${visibleClienteEfectiva ? "Sí" : "No"}. Requiere confirmación.`,
      };
    },
  });