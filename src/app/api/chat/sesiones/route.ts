import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { crearSesion, listarSesiones } from "@/lib/ai/sesiones";
import { prepararSaludo } from "@/lib/ai/saludos/preparar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const crearSchema = z.object({
  agente: z.enum(["cliente", "admin"]).default("cliente"),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: { code: "NO_AUTORIZADO", message: "No autorizado" } }, { status: 403 });
  }
  const agente = (req.nextUrl.searchParams.get("agente") as "cliente" | "admin") || "cliente";
  const lista = await listarSesiones(session.user.id, agente);
  return NextResponse.json(lista);
}

/**
 * Unico punto de creacion de sesiones privadas. Se llama al enviar el PRIMER
 * mensaje; abrir el chat usa /api/chat/saludo y no persiste nada.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: { code: "NO_AUTORIZADO", message: "No autorizado" } }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = crearSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDACION", message: "Agente invalido" } }, { status: 400 });
  }
  const { agente } = parsed.data;

  let saludo;
  try {
    saludo = await prepararSaludo({
      agente,
      usuarioId: session.user.id,
      nombre: session.user.name,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SIN_CLIENTE") {
      return NextResponse.json(
        { error: { code: "NO_AUTORIZADO", message: "Su usuario no tiene un cliente asociado." } },
        { status: 403 }
      );
    }
    throw error;
  }

  const sesion = await crearSesion({
    usuarioId: session.user.id,
    agente,
    clienteId: saludo.clienteId,
  });

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
