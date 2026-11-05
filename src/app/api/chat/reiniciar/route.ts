import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: { code: "NO_AUTORIZADO", message: "No autorizado" } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: { code: "VALIDACION", message: "sessionId es requerido" } },
        { status: 400 }
      );
    }

    const sesion = await prisma.chatSesion.findUnique({
      where: { sessionId },
    });

    if (!sesion) {
      return NextResponse.json(
        { error: { code: "SESION_NO_ENCONTRADA", message: "Sesión no encontrada" } },
        { status: 404 }
      );
    }

    // Cerrar sesión actual
    await prisma.chatSesion.update({
      where: { id: sesion.id },
      data: { estado: "cerrada" },
    });

    // Crear nueva sesión del mismo agente
    const nuevaSesion = await prisma.chatSesion.create({
      data: {
        sessionId: crypto.randomUUID(),
        agente: sesion.agente,
        clienteId: sesion.clienteId,
        usuarioId: sesion.usuarioId ?? undefined,
        cotizacionId: sesion.cotizacionId,
        estado: "activa",
      },
    });

    return NextResponse.json({
      sessionId: nuevaSesion.sessionId,
      agente: nuevaSesion.agente,
    });
  } catch (error) {
    console.error("[CHAT REINICIAR] Error:", error);
    return NextResponse.json(
      { error: { code: "DESCONOCIDO", message: "Error al reiniciar la conversación" } },
      { status: 500 }
    );
  }
}
