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
import { toolsPara } from "@/lib/ai/tools";
import { buildToolContext } from "@/lib/ai/contexto";
import { obtenerConocimiento, buscarConocimiento } from "@/lib/ai/conocimiento";
import { verificarChatToken } from "@/lib/tokens";
import { resolverObraDeCliente } from "@/lib/ai/resolver-obra";
import type { CategoriaConocimiento } from "@/lib/ai/conocimiento";
import { chatInicioSchema, chatMensajeSchema } from "@/lib/validators/chat";
// (tools antiguos eliminados; ahora se usa toolsPara de @/lib/ai/tools)

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ErrorCode =
  | "SESION_NO_ENCONTRADA"
  | "SESION_LIMITE"
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

/**
 * Limpia bloques de razonamiento (<think>...</think>) de la respuesta de NVIDIA
 * antes de PERSISTIRLA (lo que ve el usuario tambiÃ©n se limpia en el frontend).
 */
function limpiarRespuestaIA(texto: string, contexto: string): string {
  const limpio = texto.replace(/<think[\s\S]*?(<\/think>|$)/gi, "").trim();
  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[NVIDIA ${contexto}] texto=${texto.length} chars, limpio=${limpio.length} chars`
    );
  }
  return limpio;
}

/**
 * Persiste la respuesta del asistente cuando el stream termina.
 * Se invoca desde `onFinish` de streamText (NO como promesa flotante):
 * onFinish corre dentro del ciclo de vida de la respuesta, asÃ­ que el
 * mensaje del asistente no se pierde en entornos serverless.
 */
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
      console.error(`[CHAT ${contexto}] el stream terminÃ³ sin texto`);
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
    console.error(
      `[CHAT ${contexto}] Error persisting assistant message:`,
      persistError
    );
  }
}

const MENSAJES_CONTEXTO = 20;

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   ResoluciÃ³n de identidad
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

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
  const token = searchParams.get("t") || (body?.t as string | undefined);
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
      select: {
        id: true,
        clienteId: true,
        cliente: { select: { nombre: true } },
      },
    });
    if (!cotizacion) {
      throw new Error("TOKEN_INVALIDO");
    }
    return {
      agente: "publico",
      cotizacionId: cotizacion.id,
      clienteId: cotizacion.clienteId,
      clienteNombre: cotizacion.cliente?.nombre,
      sitioWeb:
        req.headers.get("origin") ??
        process.env.NEXT_PUBLIC_SITE_URL ??
        undefined,
    };
  }

  const session = await auth();
  if (!session || !session.user) {
    throw new Error("NO_AUTORIZADO");
  }

  const role = session.user.role;
  const usuarioId = session.user.id as string;

  if (role === "admin") {
    return {
      agente: "admin",
      usuarioId,
      sitioWeb:
        req.headers.get("origin") ??
        process.env.NEXT_PUBLIC_SITE_URL ??
        undefined,
    };
  }

  if (role === "cliente") {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            cotizaciones: {
              orderBy: { creadoEn: "desc" },
              take: 1,
              select: {
                id: true,
                tipoObra: true,
                tipoConstruccion: true,
                rangoM2: true,
                plazoInicio: true,
                ubicacionObra: true,
              },
            },
          },
        },
      },
    });
    if (!usuario || !usuario.cliente) {
      throw new Error("NO_AUTORIZADO");
    }
    const cotizacionReciente = usuario.cliente.cotizaciones[0];
    return {
      agente: "cliente",
      usuarioId: usuario.id,
      clienteId: usuario.cliente.id,
      cotizacionId: cotizacionReciente?.id,
      clienteNombre: usuario.cliente.nombre,
      sitioWeb:
        req.headers.get("origin") ??
        process.env.NEXT_PUBLIC_SITE_URL ??
        undefined,
    };
  }

  throw new Error("NO_AUTORIZADO");
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   ConversiÃ³n de herramientas de agents.ts al formato AI SDK
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

type ToolArgs = Record<string, unknown>;

type AiTool = {
  description: string;
  inputSchema: z.ZodTypeAny;
  execute: (args: ToolArgs) => Promise<unknown>;
};

function aiTool(
  def: unknown,
  ctx: { usuarioId?: string }
): AiTool {
  const d = def as {
    name: string;
    description: string;
    parameters: z.ZodTypeAny;
    execute: unknown;
  };
  return {
    description: d.description,
    inputSchema: d.parameters,
    execute: async (args: ToolArgs) =>
      (d.execute as (
        args: ToolArgs & { usuarioId?: string }
      ) => Promise<unknown>)(...[{ ...args, usuarioId: ctx.usuarioId }]),
  };
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Herramientas de escritura (proponer_* â†’ ChatAccion pendiente)
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

async function crearChatAccion(
  sesionId: string,
  usuarioId: string,
  herramienta: string,
  argumentos: ToolArgs
) {
  if (!usuarioId) {
    throw new Error(
      "La propuesta requiere un usuario administrador autenticado."
    );
  }
  return prisma.chatAccion.create({
    data: {
      sesionId,
      usuarioId,
      herramienta,
      argumentos: argumentos as unknown as Prisma.JsonObject,
      estado: "pendiente",
    },
  });
}

type ResumenAccionCalendario = {
  tipo: "nota" | "visita";
  titulo: string;
  clienteNombre: string;
  obraEtiqueta: string | null;
  obraEstado: string | null;
  fechaInicio: string;
  fechaFin?: string | null;
  todoElDia: boolean;
  visibleCliente: boolean;
};

async function nombreDeCliente(clienteId: string): Promise<string> {
  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    select: { nombre: true },
  });
  return cliente?.nombre ?? "Cliente sin nombre";
}

/** Mensaje legible para que el modelo pregunte cuÃ¡l obra usar. */
function mensajeObraNoResuelta(
  resolucion: Awaited<ReturnType<typeof resolverObraDeCliente>>
): string | null {
  if (resolucion.estado === "ambigua") {
    const lista = resolucion.candidatas
      .map((c, i) => `${i + 1}) ${c.etiqueta}`)
      .join("  ");
    return `El cliente tiene varias obras activas. PregÃºntale al admin a cuÃ¡l corresponde: ${lista}`;
  }
  if (resolucion.estado === "sinActivas") {
    const reciente = resolucion.recientes[0];
    return `El cliente no tiene obras activas (solo finalizada/entregada). Pregunta si va con la obra mÃ¡s reciente${
      reciente ? ` (${reciente.etiqueta})` : ""
    }, o si es una nota interna sin obra. Si el admin elige sin obra, vuelve a invocar la herramienta con sinObra=true.`;
  }
  return null;
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   POST /api/chat
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export async function POST(req: NextRequest) {
  try {
    requireNvidiaKey();

    const body = await req.json();

    // â”€â”€ Caso 1: __INICIO__ (saludo sin LLM) â”€â”€
    if (body.mensaje === "__INICIO__") {
      const inicio = chatInicioSchema.safeParse(body);
      if (!inicio.success) {
        return errorResponse(
          inicio.error.issues[0]?.message ?? "Solicitud de inicio invalida",
          "VALIDACION",
          400
        );
      }
      const identidad = await resolverIdentidad(req, body);

      let clientSessionId =
        typeof body.sessionId === "string" && body.sessionId.length > 0
          ? body.sessionId
          : crypto.randomUUID();

      let sesion = await prisma.chatSesion.findUnique({ where: { sessionId: clientSessionId } });
      const sesionAjena =
        sesion &&
        ((sesion.agente === "publico" && sesion.cotizacionId !== identidad.cotizacionId) ||
          (sesion.agente !== "publico" && identidad.usuarioId != null && sesion.usuarioId !== identidad.usuarioId));
      if (sesionAjena) {
        clientSessionId = crypto.randomUUID();
        sesion = null;
      }
      if (!sesion) {
        sesion = await prisma.chatSesion.create({
          data: {
            sessionId: clientSessionId,
            agente: identidad.agente,
            clienteId: identidad.clienteId ?? null,
            usuarioId: identidad.usuarioId ?? null,
            cotizacionId: identidad.cotizacionId ?? null,
            estado: "activa",
          },
        });
      }

      let saludoTexto = "";
      let sugerencias: string[] = [];
      if (identidad.agente === "publico" && identidad.cotizacionId) {
        const cot = await prisma.cotizacion.findUnique({ where: { id: identidad.cotizacionId } });
        const { construirSaludoPublico } = await import("@/lib/ai/saludos/publico");
        const { TIPO_OBRA_LABELS, TIPO_CONSTRUCCION_LABELS, RANGO_M2_LABELS, PLAZO_INICIO_LABELS } = await import("@/lib/constants");
        const saludo = await construirSaludoPublico({
          nombre: identidad.clienteNombre ?? "Cliente",
          tipoObraLabel: (TIPO_OBRA_LABELS as Record<string, string>)[String(cot?.tipoObra ?? "")] ?? String(cot?.tipoObra ?? ""),
          tipoConstruccionLabel: (TIPO_CONSTRUCCION_LABELS as Record<string, string>)[String(cot?.tipoConstruccion ?? "")] ?? String(cot?.tipoConstruccion ?? ""),
          rangoM2Label: (RANGO_M2_LABELS as Record<string, string>)[String(cot?.rangoM2 ?? "")] ?? String(cot?.rangoM2 ?? ""),
          plazoLabel: (PLAZO_INICIO_LABELS as Record<string, string>)[String(cot?.plazoInicio ?? "")] ?? String(cot?.plazoInicio ?? ""),
          ubicacionObra: cot?.ubicacionObra,
          requerimiento: cot?.requerimiento,
        });
        saludoTexto = saludo.texto;
        sugerencias = saludo.sugerencias;
      } else if (identidad.agente === "cliente" && identidad.clienteId) {
        const cl = await prisma.cliente.findUnique({ where: { id: identidad.clienteId }, include: { obras: { take: 1 } } });
        const obra = (cl as { obras?: { nombreComercial: string | null; direccionObra: string; estado: string; progreso: number }[] } | null)?.obras?.[0];
        const { construirSaludoCliente } = await import("@/lib/ai/saludos/cliente");
        const saludo = await construirSaludoCliente({
          nombre: identidad.clienteNombre ?? "Cliente",
          obra: obra?.nombreComercial ?? obra?.direccionObra,
          estado: obra?.estado,
          progreso: obra?.progreso,
        });
        saludoTexto = saludo.texto;
        sugerencias = saludo.sugerencias;
      } else {
        const { construirSaludoAdmin } = await import("@/lib/ai/saludos/admin");
        const saludo = await construirSaludoAdmin({ nombre: identidad.clienteNombre ?? "Admin" });
        saludoTexto = saludo.texto;
        sugerencias = saludo.sugerencias;
      }

      await prisma.chatMensaje.create({
        data: {
          sesionId: sesion.id,
          rol: "assistant",
          contenido: saludoTexto,
          partes: { role: "assistant", parts: [{ type: "text", text: saludoTexto }] },
          metadatos: { tipo: "saludo" },
        },
      });
      await prisma.chatSesion.update({
        where: { id: sesion.id },
        data: { mensajeCount: { increment: 1 }, ultimoMensajeEn: new Date() },
      });

      const stream = createUIMessageStream({
        execute: async ({ writer }) => {
          writer.write({ type: "text-delta", id: "saludo", delta: saludoTexto });
          writer.write({ type: "finish" });
        },
      });

      return createUIMessageStreamResponse({ stream });
    }

    // â”€â”€ Caso 2: mensaje normal â”€â”€
    const entrada = chatMensajeSchema.safeParse(body);
    if (!entrada.success) {
      return errorResponse(
        entrada.error.issues[0]?.message ?? "mensaje y sessionId son requeridos",
        "VALIDACION",
        400
      );
    }
    const { mensaje, sessionId } = entrada.data;

    const sesion = await prisma.chatSesion.findUnique({
      where: { sessionId },
    });

    if (!sesion) {
      return errorResponse(
        "SesiÃ³n de chat no encontrada",
        "SESION_NO_ENCONTRADA",
        404
      );
    }

    // â”€â”€ Identidad y propiedad de la sesiÃ³n â”€â”€
    // Sesiones pÃºblicas: exigir token vÃ¡lido de la misma cotizaciÃ³n.
    // Sesiones con usuario: exigir ser el propietario o un admin.
    if (sesion.agente === "publico") {
      const token = obtenerToken(req, body);
      if (!token) {
        return errorResponse("Token requerido", "TOKEN_INVALIDO", 401);
      }
      try {
        if (verificarChatToken(token) !== sesion.cotizacionId) {
          return errorResponse("Token no coincide con la sesiÃ³n", "TOKEN_INVALIDO", 401);
        }
      } catch {
        return errorResponse("Token invÃ¡lido o expirado", "TOKEN_INVALIDO", 401);
      }
    } else if (sesion.usuarioId) {
      const session = await auth();
      const userRole = session?.user?.role;
      const userId = session?.user?.id;
      const esPropietario = userId && userId === sesion.usuarioId;
      if (userRole !== "admin" && !esPropietario) {
        return errorResponse("No autorizado", "NO_AUTORIZADO", 403);
      }
    } else {
      return errorResponse("No autorizado para esta sesiÃ³n", "NO_AUTORIZADO", 403);
    }

    const agente = obtenerAgente(sesion.agente as AgenteId);

    if (agente.limiteMensajesSesion !== null && sesion.mensajeCount >= agente.limiteMensajesSesion) {
      return errorResponse(
        "Has alcanzado el lÃ­mite de mensajes para esta sesiÃ³n.",
        "SESION_LIMITE",
        429
      );
    }

    // Historial ANTES de guardar el mensaje nuevo (evita duplicarlo al final)
    const historialPrevio = await prisma.chatMensaje.findMany({
      where: { sesionId: sesion.id },
      orderBy: { creadoEn: "desc" },
      take: MENSAJES_CONTEXTO,
    });

    await prisma.chatMensaje.create({
      data: { sesionId: sesion.id, rol: "user", contenido: mensaje },
    });

    const conocimiento = await obtenerConocimiento({
      audiencia: agente.audienciaConocimiento,
      categorias: agente.categoriasConocimiento as CategoriaConocimiento[],
    });

    const cotizacionData =
      sesion.cotizacionId &&
      (await prisma.cotizacion.findUnique({ where: { id: sesion.cotizacionId } }));

    // Nombre real del cliente vinculado a la sesiÃ³n (para el prompt)
    const clienteNombre = sesion.clienteId
      ? (
          await prisma.cliente.findUnique({
            where: { id: sesion.clienteId },
            select: { nombre: true },
          })
        )?.nombre ?? "Cliente"
      : "Cliente";

    // Datos del cliente (mismo patrÃ³n que __INICIO__) para no perder contexto
    // desde el segundo turno (corrige H03 de forma mÃ­nima; se rehace en Fase 4/6).
    const datosCliente =
      sesion.agente === "cliente" && sesion.clienteId
        ? await (async () => {
            const cl = await prisma.cliente.findUnique({
              where: { id: sesion.clienteId as string },
              include: {
                cotizaciones: { orderBy: { creadoEn: "desc" }, take: 3 },
                obras: { take: 3 },
              },
            });
            return cl
              ? { nombre: cl.nombre, cotizaciones: cl.cotizaciones, obras: cl.obras }
              : {};
          })()
        : undefined;

    const systemPrompt = await agente.sistemaPromptBuilder({
      datosContexto: {
        cotizacion: cotizacionData,
        clienteNombre,
        sitioWeb:
          req.headers.get("origin") ??
          process.env.NEXT_PUBLIC_SITE_URL ??
          undefined,
        datosCliente,
      },
      conocimiento,
    });

    const mensajesHistorial = historialPrevio
      .slice()
      .reverse()
      .map((m) => {
        const meta = m.metadatos as
          | { herramientasUsadas?: { herramienta: string; resultado: string }[] }
          | null;
        const bloque = meta?.herramientasUsadas?.length
          ? " " +
            meta.herramientasUsadas
              .map((h) => `âŸ¦toolâŸ§ ${h.herramienta} â†’ ${h.resultado}âŸ¦/toolâŸ§`)
              .join(" ")
          : "";
        return { role: m.rol as "user" | "assistant", content: m.contenido + bloque };
      });

    const herramientas = toolsPara(
      sesion.agente as "publico" | "cliente" | "admin",
      buildToolContext({
        usuarioId: sesion.usuarioId ?? undefined,
        clienteId: sesion.clienteId ?? undefined,
        rol: sesion.agente as "publico" | "cliente" | "admin",
        sesionId: sesion.id,
        sitioWeb:
          req.headers.get("origin") ??
          process.env.NEXT_PUBLIC_SITE_URL ??
          undefined,
      })
    );

    const result = streamText({
      model: nvidiaProvider(agente.model),
      system: systemPrompt,
      messages: [...mensajesHistorial, { role: "user", content: mensaje }],
      temperature: agente.temperature,
      maxOutputTokens: agente.maxTokens,
      providerOptions: {
        nvidia: {
          chat_template_kwargs: { enable_thinking: false },
        },
      },
      tools: herramientas,
      stopWhen: stepCountIs(8),
      // Persistir respuesta del asistente cuando el stream termine
      // (onFinish corre dentro del ciclo de vida de la respuesta: no se
      // pierde el mensaje en serverless, a diferencia de una promesa flotante).
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
    if (mensaje === "TOKEN_INVALIDO") {
      return errorResponse("Token invÃ¡lido o expirado", "TOKEN_INVALIDO", 401);
    }
    if (mensaje === "NO_AUTORIZADO") {
      return errorResponse("No autorizado", "NO_AUTORIZADO", 403);
    }
    if (mensaje.startsWith("NVIDIA_API_KEY")) {
      return errorResponse(
        "El servicio de IA no estÃ¡ configurado.",
        "PROVEEDOR_IA",
        503
      );
    }
    return errorResponse(
      "Lo siento, tuve un problema tÃ©cnico. Intenta de nuevo en unos segundos.",
      "DESCONOCIDO",
      500
    );
  }
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   GET /api/chat?sessionId=... â€” historial
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const tokenPublico = searchParams.get("t");

    if (!sessionId) {
      return errorResponse("sessionId es requerido", "VALIDACION", 400);
    }

    const sesion = await prisma.chatSesion.findUnique({
      where: { sessionId },
    });

    if (!sesion) {
      return errorResponse(
        "SesiÃ³n de chat no encontrada",
        "SESION_NO_ENCONTRADA",
        404
      );
    }

    // Validar propiedad de la sesiÃ³n
    const session = await auth();
    const userRole = session?.user?.role;
    const userId = session?.user?.id;

    if (sesion.usuarioId) {
      // SesiÃ³n de cliente o admin: solo el propietario o un admin puede leer
      if (userRole === "admin") {
        // admin puede leer todo
      } else if (userId && userId === sesion.usuarioId) {
        // propietario de la sesiÃ³n
      } else {
        return errorResponse("No autorizado para ver esta sesiÃ³n", "NO_AUTORIZADO", 403);
      }
    } else if (sesion.agente === "publico" && sesion.cotizacionId && tokenPublico) {
      // SesiÃ³n pÃºblica: validar token
      try {
        const cotizacionIdValido = verificarChatToken(tokenPublico);
        if (cotizacionIdValido !== sesion.cotizacionId) {
          return errorResponse("Token no coincide con la sesiÃ³n", "TOKEN_INVALIDO", 401);
        }
      } catch {
        return errorResponse("Token invÃ¡lido o expirado", "TOKEN_INVALIDO", 401);
      }
    } else {
      // SesiÃ³n sin propietario identificable
      return errorResponse("No autorizado para ver esta sesiÃ³n", "NO_AUTORIZADO", 403);
    }

    // Ãšltimos N mensajes en orden ascendente (los mÃ¡s recientes, no los mÃ¡s viejos)
    const mensajes = await prisma.chatMensaje.findMany({
      where: { sesionId: sesion.id },
      orderBy: { creadoEn: "desc" },
      take: MENSAJES_CONTEXTO,
    });
    mensajes.reverse();

    return NextResponse.json({
      agente: sesion.agente,
      estado: sesion.estado,
      mensajes: mensajes.map((m) => ({
        id: m.id,
        rol: m.rol as "user" | "assistant",
        contenido: m.contenido,
        creadoEn: m.creadoEn.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[CHAT GET] Error inesperado:", error);
    return errorResponse(
      "Lo siento, tuve un problema tÃ©cnico.",
      "DESCONOCIDO",
      500
    );
  }
}
