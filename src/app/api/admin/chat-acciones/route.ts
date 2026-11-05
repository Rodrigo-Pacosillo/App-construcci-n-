import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: { code: "NO_AUTORIZADO", message: "No autorizado" } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get("estado") ?? "pendiente";

    const acciones = await prisma.chatAccion.findMany({
      where: { estado },
      include: {
        sesion: {
          select: { sessionId: true, agente: true },
        },
        usuario: {
          select: { id: true, nombre: true, email: true },
        },
      },
      orderBy: { creadoEn: "desc" },
      take: 50,
    });

    return NextResponse.json({ acciones });
  } catch (error) {
    console.error("[CHAT ACCIONES] Error:", error);
    return NextResponse.json(
      { error: { code: "DESCONOCIDO", message: "Error al obtener acciones" } },
      { status: 500 }
    );
  }
}
