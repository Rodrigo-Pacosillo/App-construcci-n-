import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { ToolContext } from "@/lib/ai/contexto";
import { fechaNegocio } from "@/lib/ai/datos/formato";
import { resolverCliente } from "@/lib/ai/datos/resolvers/cliente";
import { resolverObra } from "@/lib/ai/datos/resolvers/obra";

export const equipoObraTool = (ctx: ToolContext) => {
    void ctx;
    return tool({
    description: "Devuelve el equipo asignado a una obra.",
    inputSchema: z.object({
      obra: z.string().min(1).describe("Nombre o direccion de la obra"),
      cliente: z.string().optional().describe("Cliente (opcional)"),
    }),
    execute: async ({ obra, cliente }) => {
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

      const asignaciones = await prisma.asignacionObra.findMany({
        where: { obraId: or.valor.id },
        select: {
          rolEnObra: true,
          fechaInicio: true,
          fechaFin: true,
          empleado: { select: { nombre: true, apellidos: true, cargo: true, telefono: true } },
        },
      });

      return {
        estado: "ok",
        obra: or.valor.nombreComercial ?? or.valor.direccionObra,
        total: asignaciones.length,
        equipo: asignaciones.map((a) => ({
          nombre: `${a.empleado.nombre} ${a.empleado.apellidos}`,
          cargo: a.empleado.cargo,
          telefono: a.empleado.telefono,
          rolEnObra: a.rolEnObra,
          desde: fechaNegocio(a.fechaInicio),
          hasta: a.fechaFin ? fechaNegocio(a.fechaFin) : null,
        })),
      };
    },
  });
}

export default equipoObraTool;
