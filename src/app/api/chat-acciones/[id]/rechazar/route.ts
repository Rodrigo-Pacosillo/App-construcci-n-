import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rechazarChatAccion } from "@/lib/ai/acciones/ejecutar";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: "NO_AUTORIZADO", message: "No autorizado" } }, { status: 403 });
    }
    const esAdmin = session.user.role === "admin";

    // Validar propiedad
    const accion = await prisma.chatAccion.findUnique({ where: { id } });
    if (!accion) {
      return NextResponse.json({ error: { code: "SESION_NO_ENCONTRADA", message: "Acción no encontrada" } }, { status: 404 });
    }
    if (!esAdmin && accion.usuarioId !== session.user.id) {
      return NextResponse.json({ error: { code: "NO_AUTORIZADO", message: "No autorizado" } }, { status: 403 });
    }

    const result = await rechazarChatAccion(id, { usuarioId: session.user.id });
    if (!result.ok) {
      return NextResponse.json({ error: { code: "VALIDACION", message: result.mensaje } }, { status: 400 });
    }
    return NextResponse.json({ ok: true, estado: "rechazada" });
  } catch (error) {
    console.error("[CHAT ACCION RECHAZAR] Error:", error);
    return NextResponse.json({ error: { code: "DESCONOCIDO", message: "Error al rechazar la accion" } }, { status: 500 });
  }
}
