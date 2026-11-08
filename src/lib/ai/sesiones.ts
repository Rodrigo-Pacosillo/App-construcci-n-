import { prisma } from "@/lib/db";
import { SESION_PUBLICA_VIGENCIA_HORAS } from "./config";

export async function obtenerOCrearSesionPublica(cotizacionId: string) {
  const ahora = new Date();
  const existente = await prisma.chatSesion.findFirst({
    where: { cotizacionId, agente: "publico", estado: "activa" },
    orderBy: { creadoEn: "desc" },
  });
  if (existente) {
    if (existente.expiraEn && existente.expiraEn < ahora) {
      await prisma.chatSesion.update({ where: { id: existente.id }, data: { estado: "cerrada" } });
    } else {
      return existente;
    }
  }
  const expiraEn = new Date(ahora.getTime() + SESION_PUBLICA_VIGENCIA_HORAS * 60 * 60 * 1000);
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

export async function crearSesion(params: { usuarioId: string; agente: "cliente" | "admin"; clienteId?: string; cotizacionId?: string }) {
  return prisma.chatSesion.create({
    data: {
      sessionId: crypto.randomUUID(),
      agente: params.agente,
      usuarioId: params.usuarioId,
      clienteId: params.clienteId ?? null,
      cotizacionId: params.cotizacionId ?? null,
      estado: "activa",
    },
  });
}

export async function listarSesiones(usuarioId: string, agente: "cliente" | "admin", cursor?: string) {
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
