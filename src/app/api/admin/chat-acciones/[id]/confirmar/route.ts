import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  ejecutarChatAccion,
  type ResultadoEjecucion,
} from "@/lib/ai/ejecutar-accion";

/* ─────────────────────────────────────────────────────────────────────────────
   POST /api/admin/chat-acciones/[id]/confirmar
   Confirma y EJECUTA una acción propuesta por el agente admin.
   La lógica de negocio vive en src/lib/ai/ejecutar-accion.ts (compartida
   con el server action confirmarChatAccion del panel /admin/chat).
   ───────────────────────────────────────────────────────────────────────────── */

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

    let resultado: ResultadoEjecucion;
    try {
      resultado = await ejecutarChatAccion(
        accion.herramienta,
        accion.argumentos,
        session.user.id
      );
    } catch (ejecucionError) {
      const mensajeError =
        ejecucionError instanceof Error
          ? ejecucionError.message
          : "Error desconocido al ejecutar";
      await prisma.chatAccion.update({
        where: { id },
        data: {
          estado: "fallida",
          error: mensajeError,
          confirmadaPorUsuarioId: session.user.id,
        },
      });
      return NextResponse.json(
        {
          error: {
            code: "VALIDACION",
            message: `La acción no pudo ejecutarse: ${mensajeError}`,
          },
        },
        { status: 400 }
      );
    }

    await prisma.chatAccion.update({
      where: { id },
      data: {
        estado: "ejecutada",
        ejecutadoEn: new Date(),
        confirmadaPorUsuarioId: session.user.id,
        resultado: resultado as unknown as Prisma.InputJsonObject,
      },
    });

    return NextResponse.json({ ok: true, estado: "ejecutada", resultado });
  } catch (error) {
    console.error("[CHAT ACCION CONFIRMAR] Error:", error);
    try {
      await prisma.chatAccion.update({
        where: { id },
        data: {
          estado: "fallida",
          error: error instanceof Error ? error.message : "Error desconocido",
        },
      });
    } catch {
      // la acción puede no existir: ignorar
    }
    return NextResponse.json(
      { error: { code: "DESCONOCIDO", message: "Error al ejecutar la acción" } },
      { status: 500 }
    );
  }
}
