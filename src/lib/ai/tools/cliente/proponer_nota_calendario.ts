import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type { ToolContext } from "@/lib/ai/contexto";
import { fechaNegocio, instanteNegocio } from "@/lib/ai/datos/formato";
import { resolverObra } from "@/lib/ai/datos/resolvers/obra";
import { ACCION_EXPIRACION_MIN } from "@/lib/ai/config";

export const proponerNotaCalendarioTool = (ctx: ToolContext) =>
  tool({
    description: "Propone dejar una nota en el propio calendario del cliente. Requiere confirmación humana.",
    inputSchema: z.object({
      titulo: z.string().min(1).max(120),
      descripcion: z.string().max(2000).optional(),
      fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("YYYY-MM-DD en hora de Bolivia"),
      hora: z.string().regex(/^\d{2}:\d{2}$/).optional().describe("HH:mm 24h; omitir si es todo el día"),
      obra: z.string().optional().describe("Obra (nombre o dirección), solo si el cliente la mencionó"),
    }),
    execute: async (args) => {
      if (!ctx.clienteId) return { estado: "sin_cliente", mensaje: "No hay cliente asociado a la sesión." };
      if (!ctx.usuarioId) return { estado: "sin_usuario", mensaje: "Se requiere usuario autenticado." };

      const clienteId = ctx.clienteId;
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
        : "Sin obra (nota personal)";

      // Nota del cliente siempre visible para él
      const visibleClienteEfectiva = true;

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

      const cuando = fechaNegocio(fechaInicio);

      const accion = await prisma.chatAccion.create({
        data: {
          sesionId: ctx.sesionId,
          usuarioId: ctx.usuarioId,
          herramienta: "proponer_nota_calendario",
          argumentos: {
            clienteId,
            obraId: obraFijada ?? null,
            tipo: "nota",
            titulo: args.titulo,
            descripcion: args.descripcion ?? null,
            fecha: args.fecha,
            hora: args.hora ?? null,
            visibleCliente: true,
          } as unknown as Prisma.InputJsonValue,
          resumen: {
            tipo: "evento",
            subtipo: "nota",
            titulo: args.titulo,
            descripcion: args.descripcion ?? null,
            cliente: clienteNombre,
            obra: obraEtiqueta,
            cuando,
            fecha: args.fecha,
            hora: args.hora ?? null,
            visibleCliente: true,
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
          herramienta: "proponer_nota_calendario",
          estado: "pendiente",
          resumen: {
            tipo: "evento",
            subtipo: "nota",
            titulo: args.titulo,
            descripcion: args.descripcion ?? null,
            cliente: clienteNombre,
            obra: obraEtiqueta,
            cuando,
            fecha: args.fecha,
            hora: args.hora ?? null,
            visibleCliente: true,
          },
        },
        mensaje: `Propuesta creada: nota "${args.titulo}" para el ${cuando}. Visible para usted: Sí. Requiere confirmación.`,
      };
    },
  });