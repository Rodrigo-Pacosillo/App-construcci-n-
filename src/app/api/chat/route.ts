import { NextRequest, NextResponse } from "next/server";
import { streamText, createUIMessageStreamResponse, stepCountIs } from "ai";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { nvidiaProvider, requireNvidiaKey } from "@/lib/ai/providers";
import type { AgenteId } from "@/lib/ai/agents";
import { chatMensajeSchema } from "@/lib/validators/chat";
import { toolsPara } from "@/lib/ai/tools";
import { buildToolContext } from "@/lib/ai/contexto";
import {
  obtenerOCrearSesionPublica,
  asegurarTitulo,
  contarMensajesPublicos,
  purgarConversacionesPublicas,
} from "@/lib/ai/sesiones";
import {
  LIMITE_MENSAJES,
  RATE_LIMIT_POR_HORA,
  VENTANA_HISTORIAL,
  URL_SITIO,
} from "@/lib/ai/config";
import {
  obtenerConocimiento,
  type CategoriaConocimiento,
} from "@/lib/ai/conocimiento";
import { mapearCotizacionPublica } from "@/lib/ai/datos/cotizacionPublica";
import { verificarChatToken } from "@/lib/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ErrorCode =
  | "SESION_NO_ENCONTRADA"
  | "SESION_LIMITE"
  | "SESION_EXPIRADA"
  | "NO_AUTORIZADO"
  | "TOKEN_INVALIDO"
  | "VALIDACION"
  | "PROVEEDOR_IA"
  | "DESCONOCIDO";

interface ErrorBody {
  error: { code: ErrorCode; message: string };
}

function errorResponse(
  message: string,
  code: ErrorCode = "DESCONOCIDO",
  status = 400
) {
  return NextResponse.json<ErrorBody>({ error: { code, message } }, { status });
}

function limpiarRespuestaIA(texto: string, contexto: string): string {
  const limpio = texto.replace(/<think[\s\S]*?(<\/think>|$)/gi, "").trim();
  if (process.env.NODE_ENV !== "production") {
    console.log(`[NVIDIA ${contexto}] texto=${texto.length} chars, limpio=${limpio.length} chars`);
  }
  return limpio;
}

type HerramientaUsada = { herramienta: string; resultado: string };

async function persistirRespuestaAsistente(
  sesionId: string,
  textoCrudo: string,
  contexto: string,
  herramientasUsadas: HerramientaUsada[] = [],
  accionIds: string[] = []
): Promise<void> {
  try {
    const textoLimpio = limpiarRespuestaIA(textoCrudo, contexto);
    if (!textoLimpio) {
      console.error(`[CHAT ${contexto}] el stream terminó sin texto`);
      return;
    }
    const metadatos: Prisma.InputJsonValue = {};
    if (herramientasUsadas.length > 0) (metadatos as Record<string, unknown>).herramientasUsadas = herramientasUsadas;
    if (accionIds.length > 0) (metadatos as Record<string, unknown>).accionIds = accionIds;
    await prisma.chatMensaje.create({
      data: {
        sesionId,
        rol: "assistant",
        contenido: textoLimpio,
        ...(Object.keys(metadatos as Record<string, unknown>).length > 0 ? { metadatos } : {}),
      },
    });
    await prisma.chatSesion.update({
      where: { id: sesionId },
      data: {
        mensajeCount: { increment: 1 },
        ultimoMensajeEn: new Date(),
      },
    });
  } catch (persistError) {
    console.error(`[CHAT ${contexto}] Error persisting assistant message:`, persistError instanceof Error ? persistError.message : persistError);
  }
}

function obtenerToken(req: NextRequest, body?: Record<string, unknown>): string | undefined {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("t") || req.headers.get("x-chat-token") || (body?.t as string | undefined);
  return token || undefined;
}

async function validarSesionPublica(req: NextRequest, sessionId: string, token?: string | null) {
  if (!token) return errorResponse("Token requerido", "TOKEN_INVALIDO", 401);

  let cotizacionId: string;
  try {
    cotizacionId = verificarChatToken(token).cotizacionId;
  } catch {
    return errorResponse("Token inválido o expirado", "TOKEN_INVALIDO", 401);
  }

  const sesion = await prisma.chatSesion.findUnique({ where: { sessionId } });
  if (!sesion) return errorResponse("Sesión de chat no encontrada", "SESION_NO_ENCONTRADA", 404);

  // Si el token no coincide con la sesión actual, buscar la única sesión de esa cotización.
  if (sesion.cotizacionId !== cotizacionId) {
    const sesionCorrecta = await prisma.chatSesion.findFirst({
      where: { cotizacionId, agente: "publico" },
      orderBy: { creadoEn: "desc" },
    });
    if (sesionCorrecta) {
      return sesionCorrecta;
    }
    return errorResponse("Token no coincide con la sesión", "TOKEN_INVALIDO", 401);
  }
  return sesion;
}

async function validarSesionPrivada(sesion: { usuarioId?: string | null; agente: string }, req: NextRequest) {
  const session = await auth();
  const userRole = session?.user?.role;
  const userId = session?.user?.id;
  if (sesion.usuarioId) {
    const esPropietario = userId && userId === sesion.usuarioId;
    if (userRole !== "admin" && !esPropietario) return errorResponse("No autorizado", "NO_AUTORIZADO", 403);
  } else {
    return errorResponse("No autorizado para esta sesión", "NO_AUTORIZADO", 403);
  }
  return sesion;
}

async function validarExpiracionYPropiedad(sesion: { id: string; sessionId: string; agente: string; expiraEn?: Date | null; cotizacionId?: string | null; usuarioId?: string | null }, req: NextRequest, token?: string | null) {
  if (sesion.agente === "publico" && sesion.expiraEn && sesion.expiraEn < new Date()) {
    await prisma.chatSesion.update({ where: { id: sesion.id }, data: { estado: "cerrada" } });
    return errorResponse("Esta conversación ha finalizado. Escríbanos por WhatsApp o envíe otra cotización.", "SESION_EXPIRADA", 410);
  }
  if (sesion.agente === "publico") return validarSesionPublica(req, sesion.sessionId, token);
  if (sesion.usuarioId) return validarSesionPrivada(sesion, req);
  return errorResponse("No autorizado para esta sesión", "NO_AUTORIZADO", 403);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ── Caso 1: __INICIO__ (saludo sin LLM) → responde JSON InicioResponse ──
    if (body.mensaje === "__INICIO__") {
      const tokenPublico = obtenerToken(req, body);
      if (!tokenPublico) return errorResponse("Token requerido para chat público", "TOKEN_INVALIDO", 401);

      let payload: { cotizacionId: string; expiraEn: Date };
      try {
        payload = verificarChatToken(tokenPublico);
      } catch {
        return errorResponse("Token inválido o expirado", "TOKEN_INVALIDO", 401);
      }

      // Best effort: el chat público es efímero, no se acumula en la BD.
      try {
        await purgarConversacionesPublicas();
      } catch (purgaError) {
        console.error("[CHAT] No se pudo purgar conversaciones públicas vencidas:", purgaError instanceof Error ? purgaError.message : purgaError);
      }

      const sesion = await obtenerOCrearSesionPublica(payload.cotizacionId, payload.expiraEn);
      if (sesion.expiraEn && sesion.expiraEn < new Date()) {
        await prisma.chatSesion.update({ where: { id: sesion.id }, data: { estado: "cerrada" } });
        return errorResponse("Esta conversación ha finalizado. Escríbanos por WhatsApp o envíe otra cotización.", "SESION_EXPIRADA", 410);
      }

      // Obtener saludo y sugerencias
      const { construirSaludoPublico } = await import("@/lib/ai/saludos/publico");

      // Si la conversación ya tiene historial (recarga de página), se devuelve tal
      // cual: no se duplica el saludo ni se abre otra sesión.
      const mensajesPrevios = await prisma.chatMensaje.findMany({
        where: { sesionId: sesion.id },
        orderBy: { creadoEn: "asc" },
        take: 50,
      });
      if (mensajesPrevios.length > 0) {
        const metaSaludo = mensajesPrevios[0].metadatos as { sugerencias?: string[] } | undefined;
        const sugerenciasPrevias = metaSaludo?.sugerencias ?? [];
        return NextResponse.json({
          sessionId: sesion.sessionId,
          agente: { id: "publico", etiqueta: "Asistente de cotización", descripcion: "Resuelve dudas sobre su cotización" },
          mensajes: mensajesPrevios.map((m) => ({
            id: m.id,
            rol: m.rol,
            contenido: m.contenido,
            creadoEn: m.creadoEn.toISOString(),
            sugerencias: (m.metadatos as { sugerencias?: string[] } | undefined)?.sugerencias,
          })),
          acciones: [],
          sugerencias: sugerenciasPrevias,
          expiraEn: sesion.expiraEn?.toISOString() ?? null,
        });
      }

      const cot = await prisma.cotizacion.findUnique({
        where: { id: payload.cotizacionId },
        select: { cliente: { select: { nombre: true } } },
      });
      const saludo = await construirSaludoPublico({
        cotizacionId: payload.cotizacionId,
        nombre: cot?.cliente?.nombre ?? "Cliente",
      });

      // Persistir saludo como mensaje assistant
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
        agente: { id: "publico", etiqueta: "Asistente de cotización", descripcion: "Resuelve dudas sobre su cotización" },
        mensajes: [{ id: "saludo", rol: "assistant", contenido: saludo.texto, creadoEn: new Date().toISOString(), sugerencias: saludo.sugerencias }],
        acciones: [],
        sugerencias: saludo.sugerencias,
        expiraEn: sesion.expiraEn?.toISOString() ?? null,
      });
    }

    // ── Caso 2: mensaje normal (la sesión privada ya fue creada al primer envío) ──

    // Validar mensaje normal (requiere sessionId y mensaje)
    const entrada = chatMensajeSchema.safeParse(body);
    if (!entrada.success) {
      return errorResponse(entrada.error.issues[0]?.message ?? "mensaje y sessionId son requeridos", "VALIDACION", 400);
    }
    const { mensaje, sessionId } = entrada.data;

    const sesion = await prisma.chatSesion.findUnique({ where: { sessionId } });
    if (!sesion) return errorResponse("Sesión de chat no encontrada", "SESION_NO_ENCONTRADA", 404);

    const token = obtenerToken(req, body);
    const validacion = await validarExpiracionYPropiedad(sesion, req, token);
    if (validacion instanceof NextResponse) return validacion;

    const agenteConfig = (await import("@/lib/ai/agents")).obtenerAgente(sesion.agente as AgenteId);

    // Rate limit por hora para cliente/admin
    if (sesion.agente !== "publico" && sesion.usuarioId) {
      const horaAtras = new Date(Date.now() - 60 * 60 * 1000);
      const msgsUltimaHora = await prisma.chatMensaje.count({
        where: { rol: "user", creadoEn: { gte: horaAtras }, sesion: { usuarioId: sesion.usuarioId } },
      });
      const limite = sesion.agente === "cliente" ? RATE_LIMIT_POR_HORA.cliente : RATE_LIMIT_POR_HORA.admin;
      if (msgsUltimaHora >= limite) {
        return errorResponse("Has alcanzado el límite de mensajes por hora.", "SESION_LIMITE", 429);
      }
    }

    if (sesion.agente === "publico") {
      // Cupo por cotización: reabrir la conversación no regala mensajes nuevos.
      if (!sesion.cotizacionId) {
        return errorResponse("Sesión sin cotización asociada", "SESION_NO_ENCONTRADA", 404);
      }
      const usados = await contarMensajesPublicos(sesion.cotizacionId);
      if (usados >= LIMITE_MENSAJES.publico) {
        return errorResponse(
          `Ha alcanzado el límite de ${LIMITE_MENSAJES.publico} mensajes para esta cotización. Escríbanos por WhatsApp para continuar.`,
          "SESION_LIMITE",
          429
        );
      }
    } else if (
      agenteConfig.limiteMensajesSesion !== null &&
      sesion.mensajeCount >= agenteConfig.limiteMensajesSesion
    ) {
      return errorResponse("Has alcanzado el límite de mensajes para esta sesión.", "SESION_LIMITE", 429);
    }

    // Historial solo texto (últimos N mensajes, sin resultados de tools).
    // Se lee ANTES de persistir para que el mensaje actual no quede duplicado.
    const historialPrevio = await prisma.chatMensaje.findMany({
      where: { sesionId: sesion.id },
      orderBy: { creadoEn: "desc" },
      take: VENTANA_HISTORIAL - 1,
    });
    const mensajesHistorial = historialPrevio
      .slice()
      .reverse()
      .map((m) => ({ role: m.rol as "user" | "assistant", content: m.contenido }));

    // Guardar mensaje del usuario y generar el título solo si aún no existe
    await prisma.chatMensaje.create({ data: { sesionId: sesion.id, rol: "user", contenido: mensaje } });
    await asegurarTitulo(sesion, mensaje);

    const conocimiento = await obtenerConocimiento({
      audiencia: agenteConfig.audienciaConocimiento,
      categorias: agenteConfig.categoriasConocimiento as CategoriaConocimiento[],
    });

    // Solo campos públicos: nunca notas internas, montos ni identificadores.
    const cotizacionData = sesion.cotizacionId
      ? await prisma.cotizacion.findUnique({
          where: { id: sesion.cotizacionId },
          select: {
            tipoObra: true,
            tipoConstruccion: true,
            rangoM2: true,
            plazoInicio: true,
            ubicacionObra: true,
            requerimiento: true,
            fotoLoteUrl: true,
            cliente: { select: { nombre: true } },
          },
        })
      : null;

    // Las sesiones públicas no tienen clienteId: el nombre sale de la cotización.
    const clienteNombre =
      (sesion.clienteId
        ? (
            await prisma.cliente.findUnique({
              where: { id: sesion.clienteId },
              select: { nombre: true },
            })
          )?.nombre
        : null) ??
      cotizacionData?.cliente?.nombre ??
      "Cliente";

    const sitioWeb = URL_SITIO;

    const systemPrompt = await agenteConfig.sistemaPromptBuilder({
      datosContexto: {
        cotizacion:
          sesion.agente === "publico" && cotizacionData
            ? mapearCotizacionPublica(cotizacionData)
            : cotizacionData,
        clienteNombre,
        sitioWeb,
      },
      conocimiento,
    });

    // Recién acá se necesita el proveedor de IA: el saludo (__INICIO__) no lo usa.
    requireNvidiaKey();

    const herramientas = toolsPara(
      sesion.agente as "publico" | "cliente" | "admin",
      buildToolContext({
        usuarioId: sesion.usuarioId || undefined,
        clienteId: sesion.clienteId || undefined,
        rol: sesion.agente as "publico" | "cliente" | "admin",
        sesionId: sesion.id,
        sitioWeb,
      })
    );

    const result = streamText({
      model: nvidiaProvider(agenteConfig.model),
      system: systemPrompt,
      messages: [...mensajesHistorial, { role: "user", content: mensaje }],
      temperature: agenteConfig.temperature,
      maxOutputTokens: agenteConfig.maxTokens,
      providerOptions: {
        nvidia: { chat_template_kwargs: { enable_thinking: false } },
      },
      tools: herramientas,
      stopWhen: stepCountIs(sesion.agente === "publico" ? 3 : sesion.agente === "cliente" ? 5 : 8),
      abortSignal: req.signal,
      onError: (err) => console.error("[CHAT STREAM ERROR]", err instanceof Error ? err.message : err),
      onFinish: async ({ text, toolResults }) => {
        const usadas = (toolResults ?? []).map((r) => ({
          herramienta: r.toolName,
          resultado: JSON.stringify(r.output ?? {}).slice(0, 600),
        }));
        const accionIds = (toolResults ?? [])
          .map((r) => {
            const out = r.output as { accionId?: string } | undefined;
            return out?.accionId;
          })
          .filter((x): x is string => Boolean(x));
        await persistirRespuestaAsistente(sesion.id, text, "MENSAJE", usadas, accionIds);
      },
    });

    return createUIMessageStreamResponse({ stream: result.toUIMessageStream() });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    // Se registra el stack como texto: formatear el objeto Error dispara el
    // renderizador de marcos de código del servidor de desarrollo.
    console.error("[CHAT] Error inesperado:", mensaje, error instanceof Error ? error.stack : "");
    if (mensaje === "TOKEN_INVALIDO") return errorResponse("Token inválido o expirado", "TOKEN_INVALIDO", 401);
    if (mensaje === "NO_AUTORIZADO") return errorResponse("No autorizado", "NO_AUTORIZADO", 403);
    if (mensaje.startsWith("NVIDIA_API_KEY")) return errorResponse("El servicio de IA no está configurado.", "PROVEEDOR_IA", 503);
    return errorResponse("Lo siento, tuve un problema técnico. Intenta de nuevo en unos segundos.", "DESCONOCIDO", 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const tokenPublico = searchParams.get("t") || req.headers.get("x-chat-token");

    if (!sessionId) return errorResponse("sessionId es requerido", "VALIDACION", 400);

    const sesion = await prisma.chatSesion.findUnique({ where: { sessionId } });
    if (!sesion) return errorResponse("Sesión de chat no encontrada", "SESION_NO_ENCONTRADA", 404);

    const validacion = await validarExpiracionYPropiedad(sesion, req, tokenPublico);
    if (validacion instanceof NextResponse) return validacion;

    const [mensajes, acciones] = await Promise.all([
      prisma.chatMensaje.findMany({
        where: { sesionId: sesion.id },
        orderBy: { creadoEn: "asc" },
        take: 50,
      }),
      prisma.chatAccion.findMany({
        where: { sesionId: sesion.id },
        orderBy: { creadoEn: "asc" },
      }),
    ]);

    type MetadatosMensaje = { sugerencias?: string[]; accionIds?: string[] };
    const mensajesDTO = mensajes.map((m) => {
      const meta = m.metadatos as MetadatosMensaje | undefined;
      return {
        id: m.id,
        rol: m.rol,
        contenido: m.contenido,
        creadoEn: m.creadoEn.toISOString(),
        sugerencias: meta?.sugerencias,
        accionIds: meta?.accionIds,
      };
    });
    return NextResponse.json({
      sessionId: sesion.sessionId,
      agente: { id: sesion.agente, etiqueta: sesion.agente === "admin" ? "Asistente del panel" : sesion.agente === "cliente" ? "Asistente de su cuenta" : "Asistente de cotización", descripcion: "" },
      mensajes: mensajesDTO,
      acciones: acciones.map((a) => ({
        accionId: a.id,
        herramienta: a.herramienta,
        estado: a.estado,
        expiraEn: a.expiraEn?.toISOString() ?? null,
        resumen: a.resumen,
        error: a.error,
      })),
      expiraEn: sesion.expiraEn?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("[CHAT GET] Error:", error instanceof Error ? error.message : error, error instanceof Error ? error.stack : "");
    return errorResponse("Lo siento, tuve un problema técnico.", "DESCONOCIDO", 500);
  }
}
