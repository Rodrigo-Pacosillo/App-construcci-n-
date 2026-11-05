import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
        estado: "rechazada",
        confirmadaPorUsuarioId: session.user.id,
      },
    });

    return NextResponse.json({ ok: true, estado: "rechazada" });
  } catch (error) {
    console.error("[CHAT ACCION RECHAZAR] Error:", error);
    return NextResponse.json(
      { error: { code: "DESCONOCIDO", message: "Error al rechazar la acción" } },
      { status: 500 }
    );
  }
}
