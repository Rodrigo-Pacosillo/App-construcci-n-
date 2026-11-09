import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ejecutarChatAccion } from "@/lib/ai/acciones/ejecutar";

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
    const accion = await prisma.chatAccion.findUnique({ where: { id } });
    if (!accion) {
      return NextResponse.json({ error: { code: "SESION_NO_ENCONTRADA", message: "Accion no encontrada" } }, { status: 404 });
    }

    // Admin puede confirmar cualquier acción; cliente solo la suya
    const esAdmin = session.user.role === "admin";
    if (!esAdmin && accion.usuarioId !== session.user.id) {
      return NextResponse.json({ error: { code: "NO_AUTORIZADO", message: "No autorizado" } }, { status: 403 });
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: session.user.id }, select: { clienteId: true } });
    const result = await ejecutarChatAccion({
      accionId: id,
      actor: {
        usuarioId: session.user.id,
        rol: esAdmin ? "admin" : "cliente",
        clienteId: usuario?.clienteId ?? undefined,
      },
    });
    if (!result.ok) {
      const status = result.codigo === "ACCION_EXPIRADA" || result.codigo === "ACCION_NO_PENDIENTE" ? 409 : 400;
      return NextResponse.json({ error: { code: result.codigo, message: result.mensaje } }, { status });
    }
    return NextResponse.json({ ok: true, estado: "ejecutada", resultado: result });
  } catch (error) {
    console.error("[CHAT ACCION CONFIRMAR] Error:", error);
    return NextResponse.json({ error: { code: "DESCONOCIDO", message: "Error al ejecutar la accion" } }, { status: 500 });
  }
}
