import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: { code: "NO_AUTORIZADO", message: "No autorizado" } },
        { status: 403 }
      );
    }

    const accion = await prisma.chatAccion.findUnique({
      where: { id },
    });

    if (!accion) {
      return NextResponse.json(
        { error: { code: "SESION_NO_ENCONTRADA", message: "Acción no encontrada" } },
        { status: 404 }
      );
    }

    if (accion.estado !== "pendiente") {
      return NextResponse.json(
        { error: { code: "VALIDACION", message: "La acción ya no está pendiente" } },
        { status: 400 }
      );
    }

    await prisma.chatAccion.update({
      where: { id },
      data: {
        estado: "ejecutada",
        ejecutadoEn: new Date(),
        confirmadaPorUsuarioId: session.user.id,
      },
    });

    return NextResponse.json({ ok: true, estado: "ejecutada" });
  } catch (error) {
    console.error("[CHAT ACCION CONFIRMAR] Error:", error);
    await prisma.chatAccion.update({
      where: { id },
      data: {
        estado: "fallida",
        error: error instanceof Error ? error.message : "Error desconocido",
      },
    });
    return NextResponse.json(
      { error: { code: "DESCONOCIDO", message: "Error al ejecutar la acción" } },
      { status: 500 }
    );
  }
}
