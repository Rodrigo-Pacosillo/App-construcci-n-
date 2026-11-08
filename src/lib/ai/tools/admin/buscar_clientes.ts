import { tool } from "ai";
import { z } from "zod";
import type { ToolContext } from "@/lib/ai/contexto";
import { resolverCliente } from "@/lib/ai/datos/resolvers/cliente";

export const buscarClientesTool = (ctx: ToolContext) => {
    void ctx;
    return tool({
    description: "Busca clientes por nombre, email o telefono (lenguaje natural).",
    inputSchema: z.object({
      termino: z.string().min(1).describe("Nombre, email o telefono (parcial)"),
    }),
    execute: async ({ termino }) => {
      const res = await resolverCliente(termino);
      if (res.estado === "ninguno") return { estado: "ninguno", sugerencia: res.sugerencia };
      if (res.estado === "ambiguo") return { estado: "ambiguo", opciones: res.opciones, sugerencia: res.sugerencia };

      const c = res.valor;
      return {
        estado: "ok",
        cliente: {
          nombre: `${c.nombre} ${c.apellidos}`,
          email: c.email,
          telefono: c.telefono,
          ciudad: c.ciudad,
          cotizaciones: c._count.cotizaciones,
          obras: c._count.obras,
          conCuenta: Boolean(c.usuario),
        },
      };
    },
  });
}

export default buscarClientesTool;
