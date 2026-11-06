import { z } from "zod";
import { prisma } from "@/lib/db";

/* ─────────────────────────────────────────────────────────────────────────────
   Ejecutor compartido de ChatAccion.

   ÚNICO punto de ejecución de las herramientas de escritura del agente admin.
   Lo consumen DOS rutas y DEBEN comportarse igual:
   1. POST /api/admin/chat-acciones/[id]/confirmar  (API)
   2. confirmarChatAccion() en src/app/admin/(panel)/chat/actions.ts (UI admin)

   Los argumentos los generó la IA: nada se ejecuta sin validación Zod.
   Solo se invoca tras la confirmación humana explícita.
   ───────────────────────────────────────────────────────────────────────────── */

const ARG_CAMBIO_ESTADO = z.object({
  cotizacionId: z.string().min(1, "cotizacionId requerido"),
  nuevoEstado: z.enum(["nuevo", "contactado", "contratado", "no_concretado"]),
});

const ARG_AGENDAR_VISITA = z.object({
  clienteId: z.string().min(1, "clienteId requerido"),
  fecha: z.string(), // ISO datetime (validado por la herramienta proponer_agendar_visita)
  notas: z.string().max(2000).optional(),
});

export type ResultadoEjecucion = Record<string, unknown>;

/**
 * Ejecuta la acción de negocio correspondiente a la herramienta propuesta
 * por el agente admin. Lanza Error con mensaje legible si algo falla.
 */
export async function ejecutarChatAccion(
  herramienta: string,
  argumentos: unknown,
  confirmadaPor: string
): Promise<ResultadoEjecucion> {
  switch (herramienta) {
    case "proponer_cambio_estado_cotizacion": {
      const args = ARG_CAMBIO_ESTADO.parse(argumentos);
      const cotizacion = await prisma.cotizacion.findUnique({
        where: { id: args.cotizacionId },
        select: { id: true, estado: true },
      });
      if (!cotizacion) {
        throw new Error("La cotización indicada no existe");
      }
      if (cotizacion.estado === args.nuevoEstado) {
        return { sinCambios: true, estado: cotizacion.estado };
      }
      const actualizada = await prisma.cotizacion.update({
        where: { id: args.cotizacionId },
        data: { estado: args.nuevoEstado },
        select: { id: true, estado: true },
      });
      return { cotizacion: actualizada, estadoAnterior: cotizacion.estado };
    }

    case "proponer_agendar_visita": {
      const args = ARG_AGENDAR_VISITA.parse(argumentos);
      const fecha = new Date(args.fecha);
      if (Number.isNaN(fecha.getTime())) {
        throw new Error("La fecha indicada no es una fecha válida");
      }
      // Vincular a la obra activa del cliente si tiene una
      const obra = await prisma.obraActiva.findFirst({
        where: { clienteId: args.clienteId },
        orderBy: { fechaInicio: "desc" },
        select: { id: true },
      });
      const evento = await prisma.eventoCalendario.create({
        data: {
          titulo: "Visita técnica",
          descripcion: args.notas ?? null,
          tipo: "reunion",
          fechaInicio: fecha,
          todoElDia: false,
          // Agenda interna del negocio: no se muestra al cliente por defecto
          visibleCliente: false,
          obraId: obra?.id ?? null,
          creadoPorUsuarioId: confirmadaPor,
        },
        select: { id: true, titulo: true, fechaInicio: true },
      });
      return { evento };
    }

    default:
      throw new Error(`Herramienta desconocida: ${herramienta}`);
  }
}
