import { z } from "zod";

/**
 * Esquema para iniciar una sesión de chat (__INICIO__).
 * El cliente envía sus datos de cotización para crear la sesión.
 */
export const chatInicioSchema = z.object({
  mensaje: z.literal("__INICIO__"),
  clienteId: z.string().cuid({ message: "clienteId inválido" }).optional(),
  cotizacionId: z.string().cuid({ message: "cotizacionId inválido" }).optional(),
  clienteNombre: z.string().min(1, "clienteNombre es requerido").max(100).optional(),
  whatsappNumero: z.string().optional(),
  sitioBaseUrl: z.string().optional(),
  cotizacionData: z
    .object({
      tipoObra: z.string(),
      tipoConstruccion: z.string(),
      rangoM2: z.string(),
      plazoInicio: z.string(),
    })
    .optional(),
});

export type ChatInicioInput = z.infer<typeof chatInicioSchema>;

/**
 * Esquema para enviar un mensaje normal dentro de una sesión existente.
 */
export const chatMensajeSchema = z.object({
  mensaje: z.string().min(1, "El mensaje no puede estar vacío").max(1000, "Máximo 1000 caracteres"),
  sessionId: z.string().min(1, "sessionId es requerido"),
});

export type ChatMensajeInput = z.infer<typeof chatMensajeSchema>;

/**
 * Esquema para crear/editar un documento de conocimiento (CRUD admin).
 */
export const conocimientoSchema = z.object({
  titulo: z.string().min(1, "El título es requerido").max(200),
  categoria: z.string().min(1, "La categoría es requerida"),
  audiencia: z.enum(["publico", "cliente", "admin"]),
  contenido: z.string().min(1, "El contenido es requerido"),
  activo: z.boolean().default(true),
});
