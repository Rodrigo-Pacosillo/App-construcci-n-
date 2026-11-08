import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { ToolContext } from "@/lib/ai/contexto";
import { fechaNegocio } from "@/lib/ai/datos/formato";
import { resolverObra } from "@/lib/ai/datos/resolvers/obra";

export const proponerNotaCalendarioTool = (ctx: ToolContext) =>
  tool({
    description: "Propone dejar una nota en el calendario del cliente. Requiere confirmacion humana.",
    inputSchema: z.object({
      cliente: z.string().optional().describe("Nombre o contacto del cliente (opcional, usa la sesion si falta)"),
      obra: z.string().optional().describe("Nombre o direccion de la obra (opcional)"),
      sinObra: z.boolean().default(false),
      titulo: z.string().min(1).max(120),
      descripcion: z.string().max(2000).optional(),
      fechaInicio: z.string().datetime(),
      fechaFin: z.string().datetime().optional(),
      todoElDia: z.boolean().default(true),
      visibleCliente: z.boolean().default(false),
    }),
    execute: async (args) => {
      const clienteId = ctx.clienteId ?? "";
      if (!clienteId) return { estado: "sin_cliente", mensaje: "No hay cliente asociado a la sesion." };
      if (!ctx.usuarioId) return { estado: "sin_usuario", mensaje: "Se requiere usuario autenticado." };

      const sinObra = Boolean(args.sinObra);
      const visibleCliente = Boolean(args.visibleCliente);
      const todoElDia = args.todoElDia === undefined ? true : Boolean(args.todoElDia);

      let res: Awaited<ReturnType<typeof resolverObra>>;
      if (sinObra) {
        res = { estado: "ninguno", opciones: [], sugerencia: "Sin obra" } as any;
      } else {
        res = await resolverObra(args.obra ?? "", { clienteId });
      }

      if (!sinObra) {
        if (res.estado === "ninguno") return { estado: "ninguno", sugerencia: res.sugerencia };
        if (res.estado === "ambiguo") return { estado: "ambiguo", opciones: res.opciones, sugerencia: res.sugerencia };
      }

      const obraFijada = !sinObra && res.estado === "unico" ? res.valor.id : undefined;
      const obraEtiqueta = obraFijada
        ? (res as any).valor?.nombreComercial ?? (res as any).valor?.direccionObra ?? "Obra"
        : "Sin obra (nota interna, solo admin)";
      const visibleClienteEfectiva = obraFijada ? visibleCliente : false;

      const cliente = await prisma.cliente.findUnique({ where: { id: clienteId }, select: { nombre: true, apellidos: true } });
      const clienteNombre = cliente ? `${cliente.nombre} ${cliente.apellidos}` : "Cliente";

      const accion = await prisma.chatAccion.create({
        data: {
          sesionId: ctx.sesionId,
          usuarioId: ctx.usuarioId,
          herramienta: "proponer_nota_calendario",
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
            tipo: "nota",
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
        mensaje: `Propuesta creada: nota "${args.titulo}" para el ${fechaNegocio(args.fechaInicio)}. Visible para el cliente: ${visibleClienteEfectiva ? "Si" : "No"}. Requiere confirmacion.`,
      };
    },
  });

export default proponerNotaCalendarioTool;