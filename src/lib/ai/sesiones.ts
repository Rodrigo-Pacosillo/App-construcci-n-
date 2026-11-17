import { prisma } from "@/lib/db";
import { RETENCION_PUBLICA_DIAS } from "./config";

/**
 * Una cotización tiene UNA sola conversación pública.
 *
 * La ventana la fija el token (misma fecha de expiración). Si la sesión ya
 * existe, se devuelve tal cual: no se extiende ni se reemplaza. Así recargar
 * la página o reabrir el enlace no reinicia el tiempo ni el cupo.
 */
export async function obtenerOCrearSesionPublica(
  cotizacionId: string,
  expiraEn: Date
) {
  const existente = await prisma.chatSesion.findFirst({
    where: { cotizacionId, agente: "publico" },
    orderBy: { creadoEn: "desc" },
  });

  if (existente) {
    // Sesiones antiguas sin fecha: se les fija la ventana del token una vez.
    if (!existente.expiraEn) {
      return prisma.chatSesion.update({
        where: { id: existente.id },
        data: { expiraEn },
      });
    }
    return existente;
  }

  return prisma.chatSesion.create({
    data: {
      sessionId: crypto.randomUUID(),
      agente: "publico",
      cotizacionId,
      estado: "activa",
      expiraEn,
    },
  });
}

/** Mensajes del visitante en TODAS las sesiones publicas de la cotizacion. */
export async function contarMensajesPublicos(
  cotizacionId: string
): Promise<number> {
  return prisma.chatMensaje.count({
    where: {
      rol: "user",
      sesion: { cotizacionId, agente: "publico" },
    },
  });
}

/**
 * Borra conversaciones publicas vencidas hace mas de RETENCION_PUBLICA_DIAS.
 * El chat publico es efimero: si se vence, no queda para siempre en la BD.
 */
export async function purgarConversacionesPublicas(): Promise<number> {
  const corte = new Date(
    Date.now() - RETENCION_PUBLICA_DIAS * 24 * 60 * 60 * 1000
  );
  const { count } = await prisma.chatSesion.deleteMany({
    where: { agente: "publico", expiraEn: { lt: corte } },
  });
  return count;
}

/** Titulo que se genera solo con fecha: se reemplaza con el primer mensaje. */
const TITULO_AUTO_RE = /^Chat \d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}$/;

/** Titulo corto y determinista derivado del primer mensaje del usuario. */
export function generarTitulo(mensaje: string): string {
  const limpio = mensaje.replace(/[`*_>#]/g, "").replace(/\s+/g, " ").trim();
  if (!limpio) return "Conversacion";

  const MAX = 42;
  if (limpio.length <= MAX) return limpio;
  const corte = limpio.lastIndexOf(" ", MAX);
  return `${(corte > 20 ? limpio.slice(0, corte) : limpio.slice(0, MAX)).trim()}…`;
}

/**
 * Genera el titulo de la sesion con el primer mensaje. Nunca pisa un titulo
 * escrito a mano por el usuario; solo rellena ausencia o titulos de fecha vieja.
 */
export async function asegurarTitulo(
  sesion: { id: string; titulo: string | null },
  mensaje: string
): Promise<void> {
  if (sesion.titulo && !TITULO_AUTO_RE.test(sesion.titulo)) return;
  await prisma.chatSesion.update({
    where: { id: sesion.id },
    data: { titulo: generarTitulo(mensaje) },
  });
}

export async function crearSesion(params: {
  usuarioId: string;
  agente: "cliente" | "admin";
  clienteId?: string;
  cotizacionId?: string;
  titulo?: string;
}) {
  return prisma.chatSesion.create({
    data: {
      sessionId: crypto.randomUUID(),
      agente: params.agente,
      usuarioId: params.usuarioId,
      clienteId: params.clienteId ?? null,
      cotizacionId: params.cotizacionId ?? null,
      estado: "activa",
      titulo: params.titulo ?? null,
    },
  });
}

export async function listarSesiones(
  usuarioId: string,
  agente: "cliente" | "admin",
  cursor?: string
) {
  return prisma.chatSesion.findMany({
    where: {
      usuarioId,
      agente,
      estado: { not: "archivada" },
      // Una sesion sin mensajes del usuario es un borrador abandonado: no se muestra.
      mensajes: { some: { rol: "user" } },
    },
    orderBy: { ultimoMensajeEn: "desc" },
    take: 20,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      sessionId: true,
      titulo: true,
      estado: true,
      ultimoMensajeEn: true,
      expiraEn: true,
    },
  });
}

export async function archivarSesion(sessionId: string) {
  return prisma.chatSesion.update({
    where: { sessionId },
    data: { estado: "archivada", archivadaEn: new Date() },
  });
}

export async function renombrarSesion(sessionId: string, titulo: string) {
  return prisma.chatSesion.update({
    where: { sessionId },
    data: { titulo: titulo.slice(0, 60) },
  });
}
