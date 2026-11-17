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

export async function crearSesion(params: {
  usuarioId: string;
  agente: "cliente" | "admin";
  clienteId?: string;
  cotizacionId?: string;
  titulo?: string;
}) {
  const ahora = new Date();
  const tituloAuto =
    params.titulo ??
    `Chat ${ahora.toLocaleString("es-BO", {
      timeZone: "America/La_Paz",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  return prisma.chatSesion.create({
    data: {
      sessionId: crypto.randomUUID(),
      agente: params.agente,
      usuarioId: params.usuarioId,
      clienteId: params.clienteId ?? null,
      cotizacionId: params.cotizacionId ?? null,
      estado: "activa",
      titulo: tituloAuto,
    },
  });
}

export async function listarSesiones(
  usuarioId: string,
  agente: "cliente" | "admin",
  cursor?: string
) {
  return prisma.chatSesion.findMany({
    where: { usuarioId, agente, estado: { not: "archivada" } },
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
