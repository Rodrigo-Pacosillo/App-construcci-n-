import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { archivarSesion, renombrarSesion } from "@/lib/ai/sesiones";

async function validarPropiedad(sessionId: string, userId: string, esAdmin: boolean) {
  const sesion = await prisma.chatSesion.findUnique({ where: { sessionId } });
  if (!sesion) return { ok: false as const, status: 404, code: "SESION_NO_ENCONTRADA", message: "Sesión no encontrada" };
  if (!esAdmin && sesion.usuarioId !== userId) {
    return { ok: false as const, status: 403, code: "NO_AUTORIZADO", message: "No autorizado para esta sesión" };
  }
  return { ok: true as const, sesion };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: { code: "NO_AUTORIZADO", message: "No autorizado" } }, { status: 403 });
  }
  const esAdmin = session.user.role === "admin";
  const validacion = await validarPropiedad(id, session.user.id, esAdmin);
  if (!validacion.ok) {
    return NextResponse.json({ error: { code: validacion.code, message: validacion.message } }, { status: validacion.status });
  }
  const body = await req.json().catch(() => ({}));
  if (body.archivada) {
    await archivarSesion(id);
  }
  if (body.titulo) {
    await renombrarSesion(id, String(body.titulo));
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: { code: "NO_AUTORIZADO", message: "No autorizado" } }, { status: 403 });
  }
  const esAdmin = session.user.role === "admin";
  const validacion = await validarPropiedad(id, session.user.id, esAdmin);
  if (!validacion.ok) {
    return NextResponse.json({ error: { code: validacion.code, message: validacion.message } }, { status: validacion.status });
  }
  await archivarSesion(id);
  return NextResponse.json({ ok: true });
}
