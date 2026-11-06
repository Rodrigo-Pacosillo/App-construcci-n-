import { z } from "zod";
import { prisma } from "@/lib/db";
import { resolverObraDeCliente } from "@/lib/ai/resolver-obra";

/* ─────────────────────────────────────────────────────────────────────────────
   Ejecutor compartido de ChatAccion.

   ÚNICO punto de ejecución de las herramientas de escritura del agente admin.
   Lo consumen DOS rutas y DEBEN comportarse igual:
   1. POST /api/admin/chat-acciones/[id]/confirmar  (API)
   2. confirmarChatAccion() en src/app/admin/(panel)/chat/actions.ts (UI admin)

   Los argumentos los generó la IA: nada se ejecuta sin validación Zod.
   Solo se invoca tras la confirmación humana explícita.

   Reglas de calendario (doc 14):
   - `visibleCliente` NUNCA se hardcodea: lo decidió el admin y lo vio en la tarjeta.
   - La obra se resuelve en la fase "proponer" y acá solo se revalida la
     pertenencia (defensa en profundidad). No se re-elige por fecha.
   ───────────────────────────────────────────────────────────────────────────── */

const ARG_CAMBIO_ESTADO = z.object({
  cotizacionId: z.string().min(1, "cotizacionId requerido"),
  nuevoEstado: z.enum(["nuevo", "contactado", "contratado", "no_concretado"]),
});

const ARG_AGENDAR_VISITA = z.object({
  clienteId: z.string().min(1, "clienteId requerido"),
  // Fijado por la fase "proponer". Opcional por compatibilidad con acciones
  // creadas antes de este cambio y aún pendientes de confirmar.
  obraId: z.string().min(1).optional(),
  fecha: z.string(), // ISO datetime (validado por la herramienta proponer_agendar_visita)
  notas: z.string().max(2000).optional(),
  // Default tolerante SOLO para acciones legacy: las nuevas siempre lo traen.
  // El valor seguro es `false` (no exponer al cliente lo que no se decidió).
  visibleCliente: z.boolean().default(false),
  descripcion: z.string().max(2000).optional(),
});

const ARG_AGENDAR_NOTA = z.object({
  clienteId: z.string().min(1, "clienteId requerido"),
  // Puede faltar: "nota interna sin obra" es una salida válida y explícita.
  obraId: z.string().min(1).optional(),
  titulo: z.string().min(1, "titulo requerido").max(120),
  descripcion: z.string().max(2000).optional(),
  fechaInicio: z.string(),
  fechaFin: z.string().optional(),
  todoElDia: z.boolean().default(true),
  visibleCliente: z.boolean().default(false),
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

      const obraId = await resolverObraParaEjecutar(args.clienteId, args.obraId);

      const evento = await prisma.eventoCalendario.create({
        data: {
          titulo: "Visita técnica",
          descripcion: args.descripcion ?? args.notas ?? null,
          tipo: "reunion",
          fechaInicio: fecha,
          todoElDia: false,
          visibleCliente: args.visibleCliente,
          obraId,
          creadoPorUsuarioId: confirmadaPor,
        },
        select: {
          id: true,
          titulo: true,
          fechaInicio: true,
          visibleCliente: true,
        },
      });
      return { evento };
    }

    case "agregar_nota_calendario": {
      const args = ARG_AGENDAR_NOTA.parse(argumentos);

      const fechaInicio = new Date(args.fechaInicio);
      if (Number.isNaN(fechaInicio.getTime())) {
        throw new Error("La fecha de inicio no es una fecha válida");
      }
      const fechaFin = args.fechaFin ? new Date(args.fechaFin) : null;
      if (fechaFin && Number.isNaN(fechaFin.getTime())) {
        throw new Error("La fecha de fin no es una fecha válida");
      }
      if (fechaFin && fechaFin < fechaInicio) {
        throw new Error("La fecha de fin no puede ser anterior a la de inicio");
      }

      const obraId = await resolverObraParaEjecutar(args.clienteId, args.obraId);

      const evento = await prisma.eventoCalendario.create({
        data: {
          titulo: args.titulo,
          descripcion: args.descripcion ?? null,
          tipo: "nota",
          fechaInicio,
          fechaFin,
          todoElDia: args.todoElDia,
          visibleCliente: args.visibleCliente,
          obraId,
          creadoPorUsuarioId: confirmadaPor,
        },
        select: {
          id: true,
          titulo: true,
          fechaInicio: true,
          fechaFin: true,
          visibleCliente: true,
        },
      });
      return { evento };
    }

    default:
      throw new Error(`Herramienta desconocida: ${herramienta}`);
  }
}

/**
 * Revalida la obra fijada por la fase "proponer". Si la acción no trae
 * `obraId` (legacy o nota interna deliberada), resuelve de forma
 * determinista: única activa → esa; cualquier ambigüedad → sin obra.
 */
async function resolverObraParaEjecutar(
  clienteId: string,
  obraId?: string
): Promise<string | null> {
  if (obraId) {
    const obra = await prisma.obraActiva.findFirst({
      where: { id: obraId, clienteId },
      select: { id: true },
    });
    if (!obra) {
      throw new Error("La obra indicada no pertenece a este cliente");
    }
    return obra.id;
  }

  const resolucion = await resolverObraDeCliente(clienteId);
  if (resolucion.estado === "unica") return resolucion.obraId;
  return null;
}
