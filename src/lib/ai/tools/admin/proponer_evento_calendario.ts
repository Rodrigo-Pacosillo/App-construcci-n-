import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { ToolContext } from "@/lib/ai/contexto";
import { fechaNegocio } from "@/lib/ai/datos/formato";
import { resolverCliente } from "@/lib/ai/datos/resolvers/cliente";
import { resolverObra } from "@/lib/ai/datos/resolvers/obra";

export const proponerEventoCalendarioTool = (ctx: ToolContext) =>
  tool({
    description: "Propone crear un evento en el calendario de un cliente. Requiere confirmacion humana.",
    inputSchema: z.object({
      cliente: z.string().min(1).describe("Cliente (nombre, email o telefono)"),
      obra: z.string().optional().describe("Obra (opcional)"),
      sinObra: z.boolean().default(false),
      titulo: z.string().min(1).max(120),
      descripcion: z.string().max(2000).optional(),
      fechaInicio: z.string().datetime(),
      fechaFin: z.string().datetime().optional(),
      todoElDia: z.boolean().default(true),
      visibleCliente: z.boolean().default(false),
    }),
    execute: async (args) => {
      if (!ctx.usuarioId) return { estado: "sin_usuario", mensaje: "Se requiere usuario autenticado." };

      const cr = await resolverCliente(args.cliente);
      if (cr.estado === "ninguno") return { estado: "ninguno", sugerencia: cr.sugerencia };
      if (cr.estado === "ambiguo") return { estado: "ambiguo", opciones: cr.opciones, sugerencia: cr.sugerencia };
      const clienteId = cr.valor.id;

      const sinObra = Boolean(args.sinObra);
      const visibleCliente = Boolean(args.visibleCliente);
      const todoElDia = args.todoElDia === undefined ? true : Boolean(args.todoElDia);

      let res: any;
      if (sinObra) {
        res = { estado: "ninguno" };
      } else {
        res = await resolverObra(args.obra ?? "", { clienteId });
      }
      if (!sinObra) {
        if (res.estado === "ninguno" && (args.obra ?? "").trim()) {
          // permitir sin obra si no se encontro? no
        }
        if (res.estado === "ninguno" && (args.obra ?? "").trim()) return { estado: "ninguno", sugerencia: res.sugerencia };
        if (res.estado === "ambiguo") return { estado: "ambiguo", opciones: res.opciones, sugerencia: res.sugerencia };
      }

      const obraFijada = !sinObra && res && res.estado === "unico" ? res.valor.id : undefined;
      const obraEtiqueta = obraFijada
        ? (res.valor.nombreComercial ?? res.valor.direccionObra)
        : "Sin obra (solo admin)";
      const visibleClienteEfectiva = obraFijada ? visibleCliente : false;

      const cliente = await prisma.cliente.findUnique({ where: { id: clienteId }, select: { nombre: true, apellidos: true } });
      const clienteNombre = cliente ? `${cliente.nombre} ${cliente.apellidos}` : "Cliente";

      const accion = await prisma.chatAccion.create({
        data: {
          sesionId: ctx.sesionId,
          usuarioId: ctx.usuarioId,
          herramienta: "proponer_evento_calendario",
          argumentos: {
            clienteId,
            obraId: obraFijada ?? null,
            titulo: args.titulo,
            descripcion: args.descripcion ?? null,
            fechaInicio: args.fechaInicio,
            fechaFin: args.fechaFin ?? null,
            todoElDia,
            visibleCliente: visibleClienteEfectiva,
          } as any,
          resumen: {
            tipo: "evento",
            titulo: args.titulo,
            clienteNombre,
            obraEtiqueta,
            fechaInicio: args.fechaInicio,
            visibleCliente: visibleClienteEfectiva,
          } as any,
          precondiciones: { clienteExiste: true } as any,
          estado: "pendiente",
          expiraEn: new Date(ctx.ahora.getTime() + 30 * 60 * 1000),
        },
      });

      return {
        estado: "ok",
        pendiente: true,
        accionId: accion.id,
        mensaje: `Propuesta creada: evento "${args.titulo}" para el ${fechaNegocio(args.fechaInicio)}. Visible para el cliente: ${visibleClienteEfectiva ? "Si" : "No"}. Requiere confirmacion.`,
      };
    },
  });

export default proponerEventoCalendarioTool;