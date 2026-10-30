import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { chatInicioSchema, chatMensajeSchema } from "@/lib/validators/chat";
import { buildSystemPrompt } from "@/lib/chat/system-prompt";
import { nvidiaChat } from "@/lib/chat/nvidia";
import { WHATSAPP_NUMERO } from "@/lib/constants";

const MENSAJES_CONTEXTO = 20;
const RATE_LIMIT_MENSAJES = 20;

const MENSAJE_ERROR_GENERICO =
  "Lo siento, tuve un problema técnico. Intenta de nuevo en unos segundos.";

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * POST /api/chat
 * Cuerpo:
 *  - __INICIO__: { mensaje: "__INICIO__", clienteId, cotizacionId, clienteNombre, cotizacionData? }
 *  - Normal:   { mensaje: string, sessionId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // --- Caso 1: Inicio de sesión (__INICIO__) -------------------------
    if (body.mensaje === "__INICIO__") {
      const parsed = chatInicioSchema.safeParse(body);

      if (!parsed.success) {
        return errorResponse("Datos de inicio de chat inválidos");
      }

      const { clienteId, cotizacionId, clienteNombre, sitioBaseUrl, cotizacionData } =
        parsed.data;

      // Validar que la cotización pertenezca al cliente (seguridad)
      const cotizacion = await prisma.cotizacion.findUnique({
        where: { id: cotizacionId },
        select: { id: true, clienteId: true },
      });

      if (!cotizacion) {
        return errorResponse("Cotización no encontrada", 404);
      }
      if (cotizacion.clienteId !== clienteId) {
        return errorResponse(
          "La cotización no pertenece al cliente indicado",
          403
        );
      }

      // Crear sesión de chat
      const sesion = await prisma.chatSesion.create({
        data: {
          sessionId: crypto.randomUUID(),
          clienteId,
          cotizacionId,
        },
      });

      // Construir system prompt con datos de la cotización
      const systemPrompt = buildSystemPrompt({
        clienteNombre,
        tipoObra: cotizacionData?.tipoObra ?? "",
        tipoConstruccion: cotizacionData?.tipoConstruccion ?? "",
        rangoM2: cotizacionData?.rangoM2 ?? "",
        plazoInicio: cotizacionData?.plazoInicio ?? "",
        whatsappNumero: WHATSAPP_NUMERO,
        sitioBaseUrl,
      });

      // Llamar a NVIDIA para el mensaje inicial
      let respuestaIA: string;
      try {
        respuestaIA = await nvidiaChat({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "__INICIO__" },
          ],
          temperature: 0.7,
        });
      } catch (error) {
        console.error("[NVIDIA] Error al generar mensaje inicial:", error);
        // Si falla la IA, guardar mensaje de error genérico y seguir
        await prisma.chatMensaje.create({
          data: {
            sesionId: sesion.id,
            rol: "assistant",
            contenido: MENSAJE_ERROR_GENERICO,
          },
        });
        await prisma.chatSesion.update({
          where: { id: sesion.id },
          data: { mensajeCount: { increment: 1 } },
        });
        return NextResponse.json({
          sessionId: sesion.sessionId,
          mensajes: [
            {
              id: "temp-error",
              rol: "assistant",
              contenido: MENSAJE_ERROR_GENERICO,
              creadoEn: new Date().toISOString(),
            },
          ],
        });
      }

      // Guardar respuesta del asistente
      const mensajeGuardado = await prisma.chatMensaje.create({
        data: {
          sesionId: sesion.id,
          rol: "assistant",
          contenido: respuestaIA,
        },
      });

      await prisma.chatSesion.update({
        where: { id: sesion.id },
        data: { mensajeCount: { increment: 1 } },
      });

      return NextResponse.json({
        sessionId: sesion.sessionId,
        mensajes: [
          {
            id: mensajeGuardado.id,
            rol: "assistant",
            contenido: mensajeGuardado.contenido,
            creadoEn: mensajeGuardado.creadoEn.toISOString(),
          },
        ],
      });
    }

    // --- Caso 2: Mensaje normal ---------------------------------------
    const parsed = chatMensajeSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Datos de mensaje inválidos");
    }

    const { mensaje, sessionId } = parsed.data;

    // Buscar la sesión existente
    const sesion = await prisma.chatSesion.findUnique({
      where: { sessionId },
      include: {
        cliente: true,
        cotizacion: true,
        mensajes: {
          orderBy: { creadoEn: "desc" },
          take: MENSAJES_CONTEXTO,
        },
      },
    });

    if (!sesion) {
      // Sesión no encontrada: indicar al frontend que reinicie el chat
      return errorResponse(
        "Sesión de chat no encontrada. Inicia una nueva conversación.",
        404
      );
    }

    // Rate limiting
    if (sesion.mensajeCount >= RATE_LIMIT_MENSAJES) {
      return errorResponse(
        "Has alcanzado el límite de mensajes para esta sesión.",
        429
      );
    }

    // Reconstruir historial en orden cronológico (más antiguo primero)
    const historial = sesion.mensajes
      .slice()
      .reverse()
      .map((m) => ({ role: m.rol as "user" | "assistant", content: m.contenido }));

    // Construir system prompt con datos de la sesión
    const systemPrompt = buildSystemPrompt({
      clienteNombre: sesion.cliente?.nombre ?? "Cliente",
      tipoObra: sesion.cotizacion?.tipoObra ?? "",
      tipoConstruccion: sesion.cotizacion?.tipoConstruccion ?? "",
      rangoM2: sesion.cotizacion?.rangoM2 ?? "",
      plazoInicio: sesion.cotizacion?.plazoInicio ?? "",
      whatsappNumero: WHATSAPP_NUMERO,
      sitioBaseUrl: req.headers.get("origin") ?? undefined,
    });

    // Guardar mensaje del usuario
    await prisma.chatMensaje.create({
      data: {
        sesionId: sesion.id,
        rol: "user",
        contenido: mensaje,
      },
    });

    // Llamar a NVIDIA con system prompt + historial + mensaje nuevo
    let respuestaIA: string;
    try {
      respuestaIA = await nvidiaChat({
        messages: [
          { role: "system", content: systemPrompt },
          ...historial,
          { role: "user", content: mensaje },
        ],
        temperature: 0.7,
      });
    } catch (error) {
      console.error("[NVIDIA] Error al generar respuesta:", error);
      await prisma.chatMensaje.create({
        data: {
          sesionId: sesion.id,
          rol: "assistant",
          contenido: MENSAJE_ERROR_GENERICO,
        },
      });
      await prisma.chatSesion.update({
        where: { id: sesion.id },
        data: { mensajeCount: { increment: 2 } }, // user + error assistant
      });
      return NextResponse.json({
        mensajeId: "temp-error",
        respuesta: MENSAJE_ERROR_GENERICO,
      });
    }

    // Guardar respuesta del asistente
    const mensajeGuardado = await prisma.chatMensaje.create({
      data: {
        sesionId: sesion.id,
        rol: "assistant",
        contenido: respuestaIA,
      },
    });

    // Incrementar contador (2 mensajes: user + assistant)
    await prisma.chatSesion.update({
      where: { id: sesion.id },
      data: { mensajeCount: { increment: 2 } },
    });

    return NextResponse.json({
      mensajeId: mensajeGuardado.id,
      respuesta: mensajeGuardado.contenido,
    });
  } catch (error) {
    console.error("[CHAT] Error inesperado:", error);
    return errorResponse(MENSAJE_ERROR_GENERICO, 500);
  }
}
