import { createHmac, timingSafeEqual } from "crypto";

const CHAT_TOKEN_SECRET: string | undefined = process.env.CHAT_TOKEN_SECRET;
const CHAT_TOKEN_TIEMPO_EXPIRACION_MS = 14 * 24 * 60 * 60 * 1000; // 14 días

export function requireChatTokenSecret(): string {
  if (!CHAT_TOKEN_SECRET) {
    throw new Error(
      "CHAT_TOKEN_SECRET no está definida. Agregue la variable de entorno antes de usar el chat público."
    );
  }
  return CHAT_TOKEN_SECRET;
}

/**
 * Genera un token firmado de corta vida para el chat público.
 * Formato: base64url(cotizacionId.exp.firma)
 */
export function generarChatToken(cotizacionId: string): string {
  const secret = requireChatTokenSecret();
  const exp = Date.now() + CHAT_TOKEN_TIEMPO_EXPIRACION_MS;
  const payload = `${cotizacionId}.${exp}`;
  const firma = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  return Buffer.from(`${payload}.${firma}`).toString("base64url");
}

/**
 * Verifica un token de chat público y devuelve el cotizacionId si es válido.
 * Lanza error si el token es inválido o expiró.
 */
export function verificarChatToken(token: string): string {
  const secret = requireChatTokenSecret();
  let decodificado: string;
  try {
    decodificado = Buffer.from(token, "base64url").toString("utf8");
  } catch {
    throw new Error("TOKEN_INVALIDO");
  }

  const partes = decodificado.split(".");
  if (partes.length !== 3) {
    throw new Error("TOKEN_INVALIDO");
  }

  const [cotizacionId, expStr, firma] = partes;
  const exp = Number(expStr);

  if (!cotizacionId || !Number.isFinite(exp) || !firma) {
    throw new Error("TOKEN_INVALIDO");
  }

  if (Date.now() > exp) {
    throw new Error("TOKEN_INVALIDO");
  }

  const payload = `${cotizacionId}.${exp}`;
  const firmaEsperada = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  if (
    !timingSafeEqual(
      Buffer.from(firma, "base64url"),
      Buffer.from(firmaEsperada, "base64url")
    )
  ) {
    throw new Error("TOKEN_INVALIDO");
  }

  return cotizacionId;
}
