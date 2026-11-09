import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { crearSesion, listarSesiones } from "@/lib/ai/sesiones";
import { construirSaludoCliente } from "@/lib/ai/saludos/cliente";
import { construirSaludoAdmin } from "@/lib/ai/saludos/admin";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: { code: "NO_AUTORIZADO", message: "No autorizado" } }, { status: 403 });
  }
  const agente = (req.nextUrl.searchParams.get("agente") as "cliente" | "admin") || "cliente";
  const lista = await listarSesiones(session.user.id, agente);
  return NextResponse.json(lista);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: { code: "NO_AUTORIZADO", message: "No autorizado" } }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const agente = (body.agente as "cliente" | "admin") || "cliente";

  // Resolver clienteId real (fix B1 + B2)
  let clienteId: string | undefined;
  if (agente === "cliente") {
    const usuario = await prisma.usuario.findUnique({
      where: { id: session.user.id },
      select: { clienteId: true, nombre: true, apellidos: true },
    });
    clienteId = usuario?.clienteId ?? undefined;
    if (!clienteId) {
      return NextResponse.json(
        { error: { code: "NO_AUTORIZADO", message: "Su usuario no tiene un cliente asociado." } },
        { status: 403 }
      );
    }
  }

  const sesion = await crearSesion({ usuarioId: session.user.id, agente, clienteId });

  // Persistir saludo como mensaje assistant (fix B8)
  const saludo = agente === "admin"
    ? await construirSaludoAdmin({ nombre: session.user.name ?? "Admin" })
    : await construirSaludoCliente({ clienteId: clienteId! });

  await prisma.chatMensaje.create({
    data: {
      sesionId: sesion.id,
      rol: "assistant",
      contenido: saludo.texto,
      partes: { role: "assistant", parts: [{ type: "text", text: saludo.texto }] },
      metadatos: { tipo: "saludo", sugerencias: saludo.sugerencias },
    },
  });
  await prisma.chatSesion.update({
    where: { id: sesion.id },
    data: { mensajeCount: { increment: 1 }, ultimoMensajeEn: new Date() },
  });

  return NextResponse.json({
    sessionId: sesion.sessionId,
    saludo: saludo.texto,
    sugerencias: saludo.sugerencias,
    mensajes: [{
      id: "saludo",
      rol: "assistant",
      contenido: saludo.texto,
      creadoEn: new Date().toISOString(),
      sugerencias: saludo.sugerencias,
    }],
  });
}