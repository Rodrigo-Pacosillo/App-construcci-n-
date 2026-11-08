import { z } from "zod";

export const chatInicioSchema = z.object({
  mensaje: z.literal("__INICIO__"),
  sessionId: z.string().min(1).optional(),
});

export type ChatInicioInput = z.infer<typeof chatInicioSchema>;

export const chatMensajeSchema = z.object({
  mensaje: z.string().min(1, "El mensaje no puede estar vacio").max(1000, "Maximo 1000 caracteres"),
  sessionId: z.string().min(1, "sessionId es requerido"),
});

export type ChatMensajeInput = z.infer<typeof chatMensajeSchema>;

export const conocimientoSchema = z.object({
  titulo: z.string().min(1, "El titulo es requerido").max(200),
  categoria: z.string().min(1, "La categoria es requerida"),
  audiencia: z.enum(["publico", "cliente", "admin"]),
  contenido: z.string().min(1, "El contenido es requerido"),
  activo: z.boolean().default(true),
});
