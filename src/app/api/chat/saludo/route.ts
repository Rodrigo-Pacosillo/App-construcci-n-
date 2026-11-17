import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prepararSaludo } from "@/lib/ai/saludos/preparar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  agente: z.enum(["cliente", "admin"]),
});

/**
 * Saludo del chat privado SIN crear sesión ni persistir mensajes.
 * El contexto de fecha vive en el system prompt (bloqueFecha), no se muestra acá.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json(
      { error: { code: "NO_AUTORIZADO", message: "No autorizado" } },
      { status: 403 }
    );
  }

  const parsed = querySchema.safeParse({
    agente: req.nextUrl.searchParams.get("agente"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDACION", message: "Agente invalido" } },
      { status: 400 }
    );
  }
  const { agente } = parsed.data;

  try {
    const saludo = await prepararSaludo({
      agente,
      usuarioId: session.user.id,
      nombre: session.user.name,
    });
    return NextResponse.json({
      saludo: saludo.texto,
      sugerencias: saludo.sugerencias,
      agente:
        agente === "admin"
          ? {
              id: "admin",
              etiqueta: "Asistente del panel",
              descripcion: "Gestión del negocio con confirmación humana",
            }
          : {
              id: "cliente",
              etiqueta: "Asistente de su cuenta",
              descripcion: "Consulta sus datos y gestiona su cuenta",
            },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SIN_CLIENTE") {
      return NextResponse.json(
        {
          error: {
            code: "NO_AUTORIZADO",
            message: "Su usuario no tiene un cliente asociado.",
          },
        },
        { status: 403 }
      );
    }
    console.error("[CHAT SALUDO] Error:", error);
    return NextResponse.json(
      { error: { code: "DESCONOCIDO", message: "No se pudo cargar el saludo." } },
      { status: 500 }
    );
  }
}
