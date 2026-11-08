import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rechazarChatAccion } from "@/lib/ai/acciones/ejecutar";

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
    const result = await rechazarChatAccion(id, { usuarioId: session.user.id });
    if (!result.ok) {
      return NextResponse.json(
        { error: { code: "VALIDACION", message: result.mensaje } },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true, estado: "rechazada" });
  } catch (error) {
    console.error("[CHAT ACCION RECHAZAR] Error:", error);
    return NextResponse.json(
      { error: { code: "DESCONOCIDO", message: "Error al rechazar la accion" } },
      { status: 500 }
    );
  }
}
