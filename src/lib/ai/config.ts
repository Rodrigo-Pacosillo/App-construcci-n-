// Configuracion central del modulo de chat.

export const TZ_NEGOCIO = process.env.TZ_NEGOCIO || "America/La_Paz";
export const MONEDA = process.env.MONEDA_NEGOCIO || "Bs";
export const URL_SITIO =
  process.env.NEXT_PUBLIC_SITE_URL || process.env.URL_SITIO || "";

// Limite de mensajes por conversacion.
// Publico: se cuenta por cotizacion (no por sesion) para que reabrir no reinicie el cupo.
export const LIMITE_MENSAJES = {
  publico: 25,
  cliente: 60,
  admin: null as number | null,
} as const;

export const RATE_LIMIT_POR_HORA = {
  cliente: 30,
  admin: 120,
} as const;

// Ventana unica del chat publico: token, sesion y cupo vencen juntos.
export const VENTANA_PUBLICA_HORAS = 72;

// Retencion de conversaciones publicas vencidas (se borran con sus mensajes).
export const RETENCION_PUBLICA_DIAS = 7;

export const VENTANA_HISTORIAL = 12;
export const ACCION_EXPIRACION_MIN = 30;
export const REFERENCIA_RESPUESTA = "24-48 horas hábiles";
