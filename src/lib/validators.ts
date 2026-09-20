import { z } from "zod";
import {
  ESTADOS_COTIZACION,
  ORIGENES_COTIZACION,
} from "./constants";

// ─── Cotización (forms de admin) ───────────────────────────────────
export const cotizacionAdminSchema = z.object({
  clienteId: z.string().cuid().optional(),
  tipoObra: z.enum(["vivienda_nueva", "ampliacion", "otro"]),
  tipoConstruccion: z.enum(["tradicional", "seco", "no_sabe"]),
  rangoM2: z.enum(["hasta_50", "m50_100", "m100_200", "mas_200"]),
  ubicacionObra: z.string().optional(),
  plazoInicio: z.enum(["lo_antes_posible", "en_3_meses", "no_sabe"]),
  origen: z.enum(ORIGENES_COTIZACION).optional(),
  estado: z.enum(ESTADOS_COTIZACION).optional(),
  montoEstimado: z.number().positive().optional(),
  montoCerrado: z.number().positive().optional(),
  notasInternas: z.string().optional(),
});

export type CotizacionAdminInput = z.infer<typeof cotizacionAdminSchema>;

// ─── Cotización (formulario público) ────────────────────────────────
export const cotizacionFormSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres"),
  whatsapp: z.string().min(1, "El WhatsApp es requerido"),
  email: z.string().email("Email inválido").optional(),
  tipoObra: z.enum(["vivienda_nueva", "ampliacion", "otro"]),
  tipoConstruccion: z.enum(["tradicional", "seco", "no_sabe"]),
  rangoM2: z.enum(["hasta_50", "m50_100", "m100_200", "mas_200"]),
  ubicacionObra: z.string().max(200, "Máximo 200 caracteres").optional(),
  descripcion: z.string().max(1000, "Máximo 1000 caracteres").optional(),
  plazoInicio: z.enum(["lo_antes_posible", "en_3_meses", "no_sabe"]),
});

export type CotizacionFormData = z.infer<typeof cotizacionFormSchema>;

// ─── Cliente ───────────────────────────────────────────────────────
export const clienteSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  whatsapp: z.string().min(1, "El WhatsApp es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  ciudad: z.string().optional(),
});

export type ClienteInput = z.infer<typeof clienteSchema>;

// ─── Proyecto ──────────────────────────────────────────────────────
export const proyectoSchema = z.object({
  clienteId: z.string().cuid().optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Slug solo puede contener letras, números y guiones"),
  titulo: z.string().min(1, "El título es requerido"),
  tipoConstruccion: z.enum(["tradicional", "seco", "integral"]),
  m2Construidos: z.number().int().positive(),
  diasEjecucion: z.number().int().positive(),
  ubicacion: z.string().min(1, "La ubicación es requerida"),
  problemaCliente: z.string().min(1, "El problema del cliente es requerido"),
  solucion: z.string().min(1, "La solución es requerida"),
  destacado: z.boolean().default(false),
  publicado: z.boolean().default(false),
});

export type ProyectoInput = z.infer<typeof proyectoSchema>;

// ─── Testimonio ────────────────────────────────────────────────────
export const testimonioSchema = z.object({
  proyectoId: z.string().cuid().optional(),
  clienteNombre: z.string().min(1, "El nombre del cliente es requerido"),
  texto: z.string().min(1, "El texto es requerido"),
  fotoUrl: z.string().url().optional().or(z.literal("")),
  puntaje: z.number().int().min(1).max(5).optional(),
  autorizaPublicar: z.boolean().default(false),
  publicado: z.boolean().default(false),
});

export type TestimonioInput = z.infer<typeof testimonioSchema>;

// ─── Servicio ──────────────────────────────────────────────────────
export const servicioSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Slug solo puede contener letras, números y guiones"),
  titulo: z.string().min(1, "El título es requerido"),
  descripcion: z.string().min(1, "La descripción es requerida"),
  orden: z.number().int().default(0),
  activo: z.boolean().default(true),
});

export type ServicioInput = z.infer<typeof servicioSchema>;

// ─── FAQ ───────────────────────────────────────────────────────────
export const faqSchema = z.object({
  pregunta: z.string().min(1, "La pregunta es requerida"),
  respuesta: z.string().min(1, "La respuesta es requerida"),
  orden: z.number().int().default(0),
  activo: z.boolean().default(true),
});

export type FaqInput = z.infer<typeof faqSchema>;

// ─── Certificación ─────────────────────────────────────────────────
export const certificacionSchema = z.object({
  titulo: z.string().min(1, "El título es requerido"),
  descripcion: z.string().min(1, "La descripción es requerida"),
  activo: z.boolean().default(true),
});

export type CertificacionInput = z.infer<typeof certificacionSchema>;

// ─── Precio Referencia ─────────────────────────────────────────────
export const precioReferenciaSchema = z.object({
  tipoConstruccion: z.enum(["tradicional", "seco", "no_sabe"]),
  rangoM2: z.enum(["hasta_50", "m50_100", "m100_200", "mas_200"]),
  precioMin: z.number().positive(),
  precioMax: z.number().positive(),
  vigenteDesde: z.date().default(() => new Date()),
});

export type PrecioReferenciaInput = z.infer<typeof precioReferenciaSchema>;

// ─── Estimador (formulario público) ────────────────────────────────
export const estimadorSchema = z.object({
  tipoConstruccion: z.enum(["tradicional", "seco"]),
  rangoM2: z.enum(["hasta_50", "m50_100", "m100_200", "mas_200"]),
});

export type EstimadorInput = z.infer<typeof estimadorSchema>;

// ─── Login ─────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─── Registro de cliente ───────────────────────────────────────────
export const registroSchema = z
  .object({
    nombre: z.string().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres"),
    whatsapp: z.string().min(1, "El WhatsApp es requerido").max(30, "Máximo 30 caracteres"),
    email: z.string().email("Email inválido"),
    ciudad: z.string().max(100, "Máximo 100 caracteres").optional().or(z.literal("")),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .max(72, "Máximo 72 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type RegistroInput = z.infer<typeof registroSchema>;

// ─── Obra activa (Fase 2) ──────────────────────────────────────────
export const obraSchema = z.object({
  clienteId: z.string().min(1, "El cliente es requerido"),
  contratoId: z.string().optional().or(z.literal("")),
  direccionObra: z.string().min(1, "La dirección es requerida").max(200, "Máximo 200 caracteres"),
  fechaInicio: z.coerce.date({ message: "Fecha inválida" }),
  fechaFinEstimada: z.coerce.date({ message: "Fecha inválida" }).optional().or(z.literal("")),
  estado: z.enum(["en_curso", "pausada", "finalizada", "entregada"]),
  progreso: z.number().int().min(0).max(100),
});

export type ObraInput = z.infer<typeof obraSchema>;

// ─── Hito de obra (Fase 2) ─────────────────────────────────────────
export const hitoSchema = z.object({
  titulo: z.string().min(1, "El título es requerido").max(100, "Máximo 100 caracteres"),
  descripcion: z.string().min(1, "La descripción es requerida").max(500, "Máximo 500 caracteres"),
  fecha: z.coerce.date({ message: "Fecha inválida" }),
  visibleCliente: z.boolean().default(false),
});

export type HitoInput = z.infer<typeof hitoSchema>;

// ─── Pago de obra (Fase 2) ─────────────────────────────────────────
export const pagoSchema = z.object({
  monto: z.number().positive("El monto debe ser mayor a 0").max(9999999999),
  fecha: z.coerce.date({ message: "Fecha inválida" }),
  concepto: z.string().min(1, "El concepto es requerido").max(200, "Máximo 200 caracteres"),
  estado: z.enum(["registrado", "confirmado"]),
});

export type PagoInput = z.infer<typeof pagoSchema>;
