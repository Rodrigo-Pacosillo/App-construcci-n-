import { z } from "zod";

/**
 * Esquema para iniciar una sesión de chat (__INICIO__).
 * El cliente envía sus datos de cotización para crear la sesión.
 */
export const chatInicioSchema = z.object({
  mensaje: z.literal("__INICIO__"),
  clienteId: z.string().cuid({ message: "clienteId inválido" }),
  cotizacionId: z.string().cuid({ message: "cotizacionId inválido" }),
  clienteNombre: z.string().min(1, "clienteNombre es requerido").max(100),
  whatsappNumero: z.string().optional(),
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
