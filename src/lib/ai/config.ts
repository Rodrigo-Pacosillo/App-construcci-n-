// Configuracion central del modulo de chat (Fase 0/2).
// Valores por defecto segun PLAN-chat-agentes-v2 Apendice G.

export const TZ_NEGOCIO = process.env.TZ_NEGOCIO || "America/La_Paz";
export const MONEDA = process.env.MONEDA_NEGOCIO || "Bs";
export const URL_SITIO =
  process.env.NEXT_PUBLIC_SITE_URL || process.env.URL_SITIO || "";

export const LIMITE_MENSAJES = {
  publico: 20,
  cliente: 60,
  admin: null as number | null,
} as const;

export const RATE_LIMIT_POR_HORA = {
  cliente: 30,
  admin: 120,
} as const;

export const VENTANA_HISTORIAL = 12;
export const ACCION_EXPIRACION_MIN = 30;
export const SESION_PUBLICA_VIGENCIA_HORAS = 24;
export const REFERENCIA_RESPUESTA = "24-48 horas habiles";
