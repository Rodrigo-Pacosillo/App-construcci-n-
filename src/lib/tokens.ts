import { createHmac, timingSafeEqual } from "crypto";

const CHAT_TOKEN_SECRET: string | undefined = process.env.CHAT_TOKEN_SECRET;

export type ChatTokenPayload = {
  cotizacionId: string;
  expiraEn: Date;
};

export function requireChatTokenSecret(): string {
  if (!CHAT_TOKEN_SECRET) {
    throw new Error(
      "CHAT_TOKEN_SECRET no está definida. Agregue la variable de entorno antes de usar el chat público."
    );
  }
  return CHAT_TOKEN_SECRET;
}

/**
 * Genera un token firmado para el chat público.
 * La expiración la decide quien llama (la misma ventana que usa la sesión),
 * para que token y conversación venzan juntos.
 * Formato: base64url(cotizacionId.exp.firma)
 */
export function generarChatToken(cotizacionId: string, expiraEn: Date): string {
  const secret = requireChatTokenSecret();
  const exp = expiraEn.getTime();
  const payload = `${cotizacionId}.${exp}`;
  const firma = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  return Buffer.from(`${payload}.${firma}`).toString("base64url");
}

/**
 * Verifica un token de chat público y devuelve su contenido si es válido.
 * Lanza error si el token es inválido o expiró.
 */
export function verificarChatToken(token: string): ChatTokenPayload {
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

  const firmaBuffer = Buffer.from(firma, "base64url");
  const firmaEsperadaBuffer = Buffer.from(firmaEsperada, "base64url");

  // timingSafeEqual lanza si las longitudes difieren: comparar largo antes
  if (
    firmaBuffer.length !== firmaEsperadaBuffer.length ||
    !timingSafeEqual(firmaBuffer, firmaEsperadaBuffer)
  ) {
    throw new Error("TOKEN_INVALIDO");
  }

  return { cotizacionId, expiraEn: new Date(exp) };
}
