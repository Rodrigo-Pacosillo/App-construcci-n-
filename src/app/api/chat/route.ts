import { NextRequest, NextResponse } from "next/server";
import { streamText, createUIMessageStreamResponse, createUIMessageStream, stepCountIs } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { nvidiaProvider, requireNvidiaKey } from "@/lib/ai/providers";
import type { AgenteId } from "@/lib/ai/agents";
import type { AudienciaConocimiento } from "@/lib/ai/conocimiento";
import { Prisma } from "@prisma/client";
import { obtenerAgente } from "@/lib/ai/agents";
import { obtenerConocimiento, buscarConocimiento } from "@/lib/ai/conocimiento";
import { verificarChatToken } from "@/lib/tokens";
import { resolverObraDeCliente } from "@/lib/ai/resolver-obra";
import type { CategoriaConocimiento } from "@/lib/ai/conocimiento";
import { chatMensajeSchema } from "@/lib/validators/chat";
import { toolsPara } from "@/lib/ai/tools";
import { buildToolContext } from "@/lib/ai/contexto";
import { obtenerOCrearSesionPublica, crearSesion } from "@/lib/ai/sesiones";
import { RATE_LIMIT_POR_HORA } from "@/lib/ai/config";

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
  herramientasUsadas: HerramientaUsada[] = []
): Promise<void> {
  try {
    const textoLimpio = limpiarRespuestaIA(textoCrudo, contexto);
    if (!textoLimpio) {
      console.error(`[CHAT ${contexto}] el stream terminó sin texto`);
      return;
    }
    await prisma.chatMensaje.create({
      data: {
        sesionId,
        rol: "assistant",
        contenido: textoLimpio,
        ...(herramientasUsadas.length > 0
          ? { metadatos: { herramientasUsadas } }
          : {}),
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
    console.error(`[CHAT ${contexto}] Error persisting assistant message:`, persistError);
  }
}

const MENSAJES_CONTEXTO = 12;

type Identidad = {
  agente: "publico" | "cliente" | "admin";
  usuarioId?: string;
  clienteId?: string;
  cotizacionId?: string;
  clienteNombre?: string;
  sitioWeb?: string;
};

type ChatBody = Record<string, unknown>;

function obtenerToken(req: NextRequest, body?: ChatBody): string | undefined {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("t") || req.headers.get("x-chat-token") || (body?.t as string | undefined);
  return token || undefined;
}

async function resolverIdentidad(
  req: NextRequest,
  body: ChatBody
): Promise<Identidad> {
  const tokenPublico = obtenerToken(req, body);

  if (tokenPublico) {
    let cotizacionId: string;
    try {
      cotizacionId = verificarChatToken(tokenPublico);
    } catch {
      throw new Error("TOKEN_INVALIDO");
    }
    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id: cotizacionId },
      select: { id: true, clienteId: true, cliente: { select: { nombre: true } } },
    });
    if (!cotizacion) throw new Error("TOKEN_INVALIDO");
    return {
      agente: "publico",
      cotizacionId: cotizacion.id,
      clienteId: cotizacion.clienteId,
      clienteNombre: cotizacion.cliente?.nombre,
      sitioWeb: req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL,
    };
  }

  const session = await auth();
  if (!session || !session.user) throw new Error("NO_AUTORIZADO");

  const role = session.user.role;
  const usuarioId = session.user.id as string;

  if (role === "admin") {
    return { agente: "admin", usuarioId, sitioWeb: req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL };
  }
  if (role === "cliente") {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: { cliente: { select: { id: true, nombre: true } } },
    });
    if (!usuario?.cliente) throw new Error("NO_AUTORIZADO");
    return {
      agente: "cliente",
      usuarioId: usuario.id,
      clienteId: usuario.cliente.id,
      clienteNombre: usuario.cliente.nombre,
      sitioWeb: req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL,
    };
  }
  throw new Error("NO_AUTORIZADO");
}

export async function POST(req: NextRequest) {
  try {
    requireNvidiaKey();
    const body = await req.json();

    // ── Caso 1: __INICIO__ (saludo sin LLM) → responde JSON InicioResponse ──
    if (body.mensaje === "__INICIO__") {
      const tokenPublico = obtenerToken(req, body);
      if (!tokenPublico) return errorResponse("Token requerido para chat público", "TOKEN_INVALIDO", 401);

      let cotizacionId: string;
      try { cotizacionId = verificarChatToken(tokenPublico); }
      catch { return errorResponse("Token inválido o expirado", "TOKEN_INVALIDO", 401); }

      const sesion = await obtenerOCrearSesionPublica(cotizacionId);
      if (sesion.expiraEn && sesion.expiraEn < new Date()) {
        await prisma.chatSesion.update({ where: { id: sesion.id }, data: { estado: "cerrada" } });
        return errorResponse("Esta conversación ha finalizado. Escríbanos por WhatsApp o envíe otra cotización.", "SESION_EXPIRADA", 410);
      }

      // Obtener saludo y sugerencias
      const { construirSaludoPublico } = await import("@/lib/ai/saludos/publico");
      const cot = await prisma.cotizacion.findUnique({ where: { id: cotizacionId }, include: { cliente: { select: { nombre: true } } } });
      const saludo = await (await import("@/lib/ai/saludos/publico")).construirSaludoPublico({
        cotizacionId: cotizacionId,
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

      // Respuesta JSON (no stream)
      const response = {
        sessionId: sesion.sessionId,
        agente: { id: "publico", etiqueta: "Asistente de cotización", descripcion: "Resuelve dudas sobre su cotización" },
        mensajes: [{ id: "saludo", rol: "assistant", contenido: saludo.texto, creadoEn: new Date().toISOString(), sugerencias: saludo.sugerencias }],
        acciones: [],
        sugerencias: saludo.sugerencias,
        expiraEn: sesion.expiraEn?.toISOString() ?? null,
      };
      return NextResponse.json(response);
    }

    // ── Caso 2: mensaje normal ──
    const entrada = chatMensajeSchema.safeParse(body);
    if (!entrada.success) {
      return errorResponse(entrada.error.issues[0]?.message ?? "mensaje y sessionId son requeridos", "VALIDACION", 400);
    }
    const { mensaje, sessionId } = entrada.data;

    const sesion = await prisma.chatSesion.findUnique({ where: { sessionId } });
    if (!sesion) return errorResponse("Sesión de chat no encontrada", "SESION_NO_ENCONTRADA", 404);

    // Validar expiración sesión pública
    if (sesion.agente === "publico" && sesion.expiraEn && sesion.expiraEn < new Date()) {
      await prisma.chatSesion.update({ where: { id: sesion.id }, data: { estado: "cerrada" } });
      return errorResponse("Esta conversación ha finalizado. Escríbanos por WhatsApp o envíe otra cotización.", "SESION_EXPIRADA", 410);
    }

    // Validar propiedad de la sesión
    if (sesion.agente === "publico") {
      const token = new URL(req.url).searchParams.get("t") || req.headers.get("x-chat-token");
      if (!token) return errorResponse("Token requerido", "TOKEN_INVALIDO", 401);
      try {
        if (verificarChatToken(token) !== sesion.cotizacionId) return errorResponse("Token no coincide con la sesión", "TOKEN_INVALIDO", 401);
      } catch { return errorResponse("Token inválido o expirado", "TOKEN_INVALIDO", 401); }
    } else if (sesion.usuarioId) {
      const session = await auth();
      const userRole = session?.user?.role;
      const userId = session?.user?.id;
      const esPropietario = userId && userId === sesion.usuarioId;
      if (userRole !== "admin" && !esPropietario) return errorResponse("No autorizado", "NO_AUTORIZADO", 403);
    } else {
      return errorResponse("No autorizado para esta sesión", "NO_AUTORIZADO", 403);
    }

    const agenteConfig = obtenerAgente(sesion.agente as AgenteId);

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

    if (agenteConfig.limiteMensajesSesion !== null && sesion.mensajeCount >= agenteConfig.limiteMensajesSesion) {
      return errorResponse("Has alcanzado el límite de mensajes para esta sesión.", "SESION_LIMITE", 429);
    }

    // Guardar mensaje del usuario
    await prisma.chatMensaje.create({ data: { sesionId: sesion.id, rol: "user", contenido: mensaje } });

    // Historial solo texto (últimos N mensajes, sin resultados de tools)
    const historialPrevio = await prisma.chatMensaje.findMany({
      where: { sesionId: sesion.id },
      orderBy: { creadoEn: "desc" },
      take: MENSAJES_CONTEXTO,
    });
    const mensajesHistorial = historialPrevio
      .slice()
      .reverse()
      .map((m) => ({ role: m.rol as "user" | "assistant", content: m.contenido }));

    const conocimiento = await obtenerConocimiento({
      audiencia: agenteConfig.audienciaConocimiento,
      categorias: agenteConfig.categoriasConocimiento as CategoriaConocimiento[],
    });

    const cotizacionData = sesion.cotizacionId
      ? await prisma.cotizacion.findUnique({ where: { id: sesion.cotizacionId } })
      : null;

    const clienteNombre = sesion.clienteId
      ? (await prisma.cliente.findUnique({ where: { id: sesion.clienteId }, select: { nombre: true } }))?.nombre ?? "Cliente"
      : "Cliente";

    const systemPrompt = await (await import("@/lib/ai/agents")).obtenerAgente(sesion.agente as AgenteId).sistemaPromptBuilder({
      datosContexto: {
        cotizacion: cotizacionData,
        clienteNombre,
        sitioWeb: req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? undefined,
      },
      conocimiento,
    });

    const herramientas = toolsPara(
      sesion.agente as "publico" | "cliente" | "admin",
      buildToolContext({
        usuarioId: sesion.usuarioId ?? undefined,
        clienteId: sesion.clienteId ?? undefined,
        rol: sesion.agente as "publico" | "cliente" | "admin",
        sesionId: sesion.id,
        sitioWeb: req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? undefined,
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
      onError: (err) => console.error("[CHAT STREAM ERROR]", err),
      onFinish: async ({ text, toolResults }) => {
        const usadas = (toolResults ?? []).map((r) => ({
          herramienta: r.toolName,
          resultado: JSON.stringify(r.output ?? {}).slice(0, 600),
        }));
        await persistirRespuestaAsistente(sesion.id, text, "MENSAJE", usadas);
      },
    });

    return createUIMessageStreamResponse({ stream: result.toUIMessageStream() });
  } catch (error) {
    console.error("[CHAT] Error inesperado:", error);
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
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

    // Validar expiración sesión pública
    if (sesion.agente === "publico" && sesion.expiraEn && sesion.expiraEn < new Date()) {
      await prisma.chatSesion.update({ where: { id: sesion.id }, data: { estado: "cerrada" } });
      return errorResponse("Esta conversación ha finalizado.", "SESION_EXPIRADA", 410);
    }

    // Validar propiedad
    const session = await auth();
    const userRole = session?.user?.role;
    const userId = session?.user?.id;

    if (sesion.agente === "publico") {
      if (!tokenPublico) return errorResponse("Token requerido", "TOKEN_INVALIDO", 401);
      try {
        if (verificarChatToken(tokenPublico) !== sesion.cotizacionId) return errorResponse("Token no coincide", "TOKEN_INVALIDO", 401);
      } catch { return errorResponse("Token inválido o expirado", "TOKEN_INVALIDO", 401); }
    } else if (sesion.usuarioId) {
      if (userRole !== "admin" && userId !== sesion.usuarioId) return errorResponse("No autorizado", "NO_AUTORIZADO", 403);
    } else {
      return errorResponse("No autorizado", "NO_AUTORIZADO", 403);
    }

    const mensajes = await prisma.chatMensaje.findMany({
      where: { sesionId: sesion.id },
      orderBy: { creadoEn: "asc" },
      take: 50,
    });

    const acciones = await prisma.chatAccion.findMany({
      where: { sesionId: sesion.id },
      orderBy: { creadoEn: "asc" },
    });

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
    console.error("[CHAT GET] Error:", error);
    return errorResponse("Lo siento, tuve un problema técnico.", "DESCONOCIDO", 500);
  }
}