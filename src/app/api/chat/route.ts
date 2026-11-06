import { NextRequest, NextResponse } from "next/server";
import { streamText, createUIMessageStreamResponse } from "ai";
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
import type { CategoriaConocimiento } from "@/lib/ai/conocimiento";
import {
  TOOL_OBTENER_MIS_COTIZACIONES,
  TOOL_OBTENER_AVANCE_OBRA,
  TOOL_OBTENER_PROXIMOS_EVENTOS,
  TOOL_BUSCAR_CLIENTES,
  TOOL_RESUMEN_COTIZACION,
  TOOL_RESUMEN_AVANCE_OBRA,
  TOOL_INVENTARIO_HERRAMIENTAS_MATERIALES,
} from "@/lib/ai/agents";

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
 * Limpia bloques de razonamiento (�````think`�````) de la respuesta de NVIDIA
 * y hace log para debuggear respuestas vacías.
 */
function limpiarRespuestaIA(texto: string, contexto: string): string {
  const limpio = texto.replace(/<think[\s\S]*?<\/think>/gi, "").trim();
  console.error(
    `[NVIDIA ${contexto}] Texto completo: "${texto.substring(0, 200)}" | Texto limpio: "${limpio.substring(0, 200)}"`
  );
  return limpio;
}

const MENSAJES_CONTEXTO = 20;

/* ─────────────────────────────────────────────────────────────────────────────
   Resolución de identidad
   ───────────────────────────────────────────────────────────────────────────── */

type Identidad = {
  agente: "publico" | "cliente" | "admin";
  usuarioId?: string;
  clienteId?: string;
  cotizacionId?: string;
  clienteNombre?: string;
  sitioWeb?: string;
};

type ChatBody = Record<string, unknown>;

async function resolverIdentidad(
  req: NextRequest,
  body: ChatBody
): Promise<Identidad> {
  const { searchParams } = new URL(req.url);
  const tokenPublico = searchParams.get("t") || body?.t;

  if (tokenPublico) {
    try {
      const cotizacionId = verificarChatToken(tokenPublico as string);
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
        clienteNombre: cotizacion.cliente?.nombre,
        sitioWeb: req.headers.get("origin") ?? undefined,
      };
    } catch {
      throw new Error("TOKEN_INVALIDO");
    }
  }

  const session = await auth();
  if (!session || !session.user) {
    throw new Error("NO_AUTORIZADO");
  }

  const role = session.user.role;
  const usuarioId = session.user.id as string;

  if (role === "admin") {
    return { agente: "admin", usuarioId, sitioWeb: req.headers.get("origin") ?? undefined };
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
      sitioWeb: req.headers.get("origin") ?? undefined,
    };
  }

  throw new Error("NO_AUTORIZADO");
}

/* ─────────────────────────────────────────────────────────────────────────────
   Conversión de herramientas de agents.ts al formato AI SDK
   ───────────────────────────────────────────────────────────────────────────── */

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

/* ─────────────────────────────────────────────────────────────────────────────
   Herramientas de escritura (proponer_* → ChatAccion pendiente)
   ───────────────────────────────────────────────────────────────────────────── */

async function crearChatAccion(
  sesionId: string,
  usuarioId: string,
  herramienta: string,
  argumentos: ToolArgs
) {
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

/* ─────────────────────────────────────────────────────────────────────────────
   POST /api/chat
   ───────────────────────────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  requireNvidiaKey();

  try {
    const body = await req.json();

    // ── Caso 1: __INICIO__ ──
    if (body.mensaje === "__INICIO__") {
      const identidad = await resolverIdentidad(req, body);
      const agente = obtenerAgente(identidad.agente);

      const clienteId =
        identidad.agente === "publico"
          ? await (async () => {
              const c = await prisma.cotizacion.findUnique({
                where: { id: identidad.cotizacionId! },
                select: { clienteId: true },
              });
              return c?.clienteId ?? "";
            })()
          : identidad.clienteId ?? "";

      // Usar sessionId del cliente si se provee, sino generar uno nuevo
      const clientSessionId = (body.sessionId as string) ?? crypto.randomUUID();

      // Verificar si la sesión ya existe (reconexión)
      let sesion = await prisma.chatSesion.findUnique({
        where: { sessionId: clientSessionId },
      });

      if (!sesion) {
        sesion = await prisma.chatSesion.create({
          data: {
            sessionId: clientSessionId,
            agente: identidad.agente,
            clienteId,
            usuarioId: identidad.usuarioId ?? null,
            cotizacionId: identidad.cotizacionId ?? null,
            estado: "activa",
          },
        });
      }

      const conocimiento = await obtenerConocimiento({
        audiencia: agente.audienciaConocimiento,
        categorias: agente.categoriasConocimiento as CategoriaConocimiento[],
      });

      const cotizacionData =
        identidad.cotizacionId &&
        (await prisma.cotizacion.findUnique({
          where: { id: identidad.cotizacionId },
        }));

      const datosCliente =
        identidad.agente === "cliente" && identidad.clienteId
          ? await (async () => {
              const cl = await prisma.cliente.findUnique({
                where: { id: identidad.clienteId },
                include: {
                  cotizaciones: { orderBy: { creadoEn: "desc" }, take: 3 },
                  obras: { take: 3 },
                },
              });
              return cl
                ? {
                    nombre: cl.nombre,
                    cotizaciones: cl.cotizaciones,
                    obras: cl.obras,
                  }
                : {};
            })()
          : undefined;

      const systemPrompt = await agente.sistemaPromptBuilder({
        datosContexto: {
          cotizacion: cotizacionData,
          clienteNombre: identidad.clienteNombre,
          sitioWeb: identidad.sitioWeb,
          datosCliente,
        },
        conocimiento,
      });

      const herramientas = construirHerramientas(
        agente.id,
        identidad.usuarioId,
        sesion.id
      );

      const resultado = streamText({
        model: nvidiaProvider(agente.model),
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "__INICIO__" },
        ],
        temperature: agente.temperature,
        maxOutputTokens: agente.maxTokens,
        providerOptions: {
          nvidia: {
            chat_template_kwargs: { enable_thinking: false },
          },
        },
        tools: herramientas,
      });

      // Persistir respuesta del asistente cuando el stream termine
      resultado.text.then(async (textoCompleto) => {
        try {
          const textoLimpio = limpiarRespuestaIA(textoCompleto, "INICIO");
          await prisma.chatMensaje.create({
            data: {
              sesionId: sesion.id,
              rol: "assistant",
              contenido: textoLimpio,
            },
          });

          await prisma.chatSesion.update({
            where: { id: sesion.id },
            data: { mensajeCount: { increment: 1 } },
          });
        } catch (persistError) {
          console.error("[CHAT INICIO] Error persisting assistant message:", persistError);
        }
      });

      return createUIMessageStreamResponse({ stream: resultado.toUIMessageStream() });
    }

    // ── Caso 2: mensaje normal ──
    const { mensaje, sessionId } = body;
    if (!mensaje || !sessionId) {
      return errorResponse(
        "mensaje y sessionId son requeridos",
        "VALIDACION",
        400
      );
    }

    const sesion = await prisma.chatSesion.findUnique({
      where: { sessionId },
    });

    if (!sesion) {
      return errorResponse(
        "Sesión de chat no encontrada",
        "SESION_NO_ENCONTRADA",
        404
      );
    }

    const agente = obtenerAgente(sesion.agente as AgenteId);

    if (agente.limiteMensajesSesion !== null && sesion.mensajeCount >= agente.limiteMensajesSesion) {
      return errorResponse(
        "Has alcanzado el límite de mensajes para esta sesión.",
        "SESION_LIMITE",
        429
      );
    }

    await prisma.chatMensaje.create({
      data: { sesionId: sesion.id, rol: "user", contenido: mensaje },
    });

    const historial = await prisma.chatMensaje.findMany({
      where: { sesionId: sesion.id },
      orderBy: { creadoEn: "desc" },
      take: MENSAJES_CONTEXTO,
    });

    const conocimiento = await obtenerConocimiento({
      audiencia: agente.audienciaConocimiento,
      categorias: agente.categoriasConocimiento as CategoriaConocimiento[],
    });

    const cotizacionData =
      sesion.cotizacionId &&
      (await prisma.cotizacion.findUnique({ where: { id: sesion.cotizacionId } }));

    const systemPrompt = await agente.sistemaPromptBuilder({
      datosContexto: {
        cotizacion: cotizacionData,
        clienteNombre: "Cliente",
        sitioWeb: req.headers.get("origin") ?? undefined,
      },
      conocimiento,
    });

    const mensajesHistorial = historial
      .slice()
      .reverse()
      .map((m) => ({ role: m.rol as "user" | "assistant", content: m.contenido }));

    const herramientas = construirHerramientas(
        agente.id,
        sesion.usuarioId ?? undefined,
        sesion.id
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
    });

    // Persistir respuesta del asistente cuando el stream termine
    result.text.then(async (textoCompleto) => {
      try {
        const textoLimpio = limpiarRespuestaIA(textoCompleto, "MENSAJE");
        await prisma.chatMensaje.create({
          data: {
            sesionId: sesion.id,
            rol: "assistant",
            contenido: textoLimpio,
          },
        });

        await prisma.chatSesion.update({
          where: { id: sesion.id },
          data: { mensajeCount: { increment: 1 } },
        });
      } catch (persistError) {
        console.error("[CHAT MENSAJE] Error persisting assistant message:", persistError);
      }
    });

    return createUIMessageStreamResponse({ stream: result.toUIMessageStream() });
  } catch (error) {
    console.error("[CHAT] Error inesperado:", error);
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    if (mensaje === "TOKEN_INVALIDO") {
      return errorResponse("Token inválido o expirado", "TOKEN_INVALIDO", 401);
    }
    if (mensaje === "NO_AUTORIZADO") {
      return errorResponse("No autorizado", "NO_AUTORIZADO", 403);
    }
    return errorResponse(
      "Lo siento, tuve un problema técnico. Intenta de nuevo en unos segundos.",
      "DESCONOCIDO",
      500
    );
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/chat?sessionId=... — historial
   ───────────────────────────────────────────────────────────────────────────── */

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
      include: {
        mensajes: { orderBy: { creadoEn: "asc" }, take: MENSAJES_CONTEXTO },
      },
    });

    if (!sesion) {
      return errorResponse(
        "Sesión de chat no encontrada",
        "SESION_NO_ENCONTRADA",
        404
      );
    }

    // Validar propiedad de la sesión
    const session = await auth();
    const userRole = session?.user?.role;
    const userId = session?.user?.id;

    if (sesion.usuarioId) {
      // Sesión de cliente o admin: solo el propietario o un admin puede leer
      if (userRole === "admin") {
        // admin puede leer todo
      } else if (userId && userId === sesion.usuarioId) {
        // propietario de la sesión
      } else {
        return errorResponse("No autorizado para ver esta sesión", "NO_AUTORIZADO", 403);
      }
    } else if (sesion.cotizacionId && tokenPublico) {
      // Sesión pública: validar token
      try {
        const cotizacionIdValido = verificarChatToken(tokenPublico);
        if (cotizacionIdValido !== sesion.cotizacionId) {
          return errorResponse("Token no coincide con la sesión", "TOKEN_INVALIDO", 401);
        }
      } catch {
        return errorResponse("Token inválido o expirado", "TOKEN_INVALIDO", 401);
      }
    } else {
      // Sesión sin propietario identificable
      return errorResponse("No autorizado para ver esta sesión", "NO_AUTORIZADO", 403);
    }

    return NextResponse.json({
      agente: sesion.agente,
      estado: sesion.estado,
      mensajes: sesion.mensajes.map((m) => ({
        id: m.id,
        rol: m.rol as "user" | "assistant",
        contenido: m.contenido,
        creadoEn: m.creadoEn.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[CHAT GET] Error inesperado:", error);
    return errorResponse(
      "Lo siento, tuve un problema técnico.",
      "DESCONOCIDO",
      500
    );
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   Construcción de herramientas dinámicas por agente
   ───────────────────────────────────────────────────────────────────────────── */

function construirHerramientas(
  agente: AgenteId,
  usuarioId: string | undefined,
  sesionId: string
): Record<string, AiTool> {
  const ctx = { usuarioId };
  const tools: Record<string, AiTool> = {};

  if (agente === "cliente" && usuarioId) {
    tools["obtener_mis_cotizaciones"] = aiTool(
      TOOL_OBTENER_MIS_COTIZACIONES,
      ctx
    );
    tools["obtener_avance_obra"] = aiTool(TOOL_OBTENER_AVANCE_OBRA, ctx);
    tools["obtener_proximos_eventos"] = aiTool(TOOL_OBTENER_PROXIMOS_EVENTOS, ctx);
  }

  if (agente === "admin" && usuarioId) {
    tools["buscar_clientes"] = aiTool(TOOL_BUSCAR_CLIENTES, ctx);
    tools["resumen_cotizacion"] = aiTool(TOOL_RESUMEN_COTIZACION, ctx);
    tools["resumen_avance_obra"] = aiTool(TOOL_RESUMEN_AVANCE_OBRA, ctx);
    tools["inventario_herramientas_y_materiales"] = aiTool(
      TOOL_INVENTARIO_HERRAMIENTAS_MATERIALES,
      ctx
    );
  }

  // búsqueda de conocimiento para todos
  tools["buscar_conocimiento"] = {
    description:
      "Busca documentos de conocimiento por término y categoría opcional.",
    inputSchema: z.object({
      termino: z.string().min(1),
      categoria: z.string().optional(),
    }),
    execute: async (args: ToolArgs) => {
      const configAgente = obtenerAgente(agente);
      return buscarConocimiento({
        termino: args.termino as string,
        audiencia: (configAgente.audienciaConocimiento as AudienciaConocimiento) ?? "publico",
        categoria: args.categoria as CategoriaConocimiento | undefined,
      });
    },
  };

  // herramientas de escritura (proponer_*) — solo admin
  if (agente === "admin") {
    tools["proponer_cambio_estado_cotizacion"] = {
      description:
        "Propone cambiar el estado de una cotización. Requiere confirmación humana antes de ejecutar.",
      inputSchema: z.object({
        cotizacionId: z.string().cuid(),
        nuevoEstado: z.enum(["nuevo", "contactado", "contratado", "no_concretado"]),
      }),
      execute: async (args: ToolArgs) => {
        const { cotizacionId, nuevoEstado } = args as {
          cotizacionId: string;
          nuevoEstado: string;
        };
        await crearChatAccion(
          sesionId,
          usuarioId ?? "",
          "proponer_cambio_estado_cotizacion",
          { cotizacionId, nuevoEstado }
        );
        return {
          pendiente: true,
          mensaje: `Se ha creado una propuesta para cambiar el estado de la cotización ${cotizacionId} a "${nuevoEstado}". Un administrador debe confirmar esta acción.`,
        };
      },
    };

    tools["proponer_crear_contrato_borrador"] = {
      description:
        "Propone crear un contrato borrador para un cliente. Requiere confirmación humana.",
      inputSchema: z.object({
        clienteId: z.string().cuid(),
        montoTotal: z.number().optional(),
        observaciones: z.string().optional(),
      }),
      execute: async (args: ToolArgs) => {
        const { clienteId, montoTotal, observaciones } = args as {
          clienteId: string;
          montoTotal?: number;
          observaciones?: string;
        };
        await crearChatAccion(
          sesionId,
          usuarioId ?? "",
          "proponer_crear_contrato_borrador",
          { clienteId, montoTotal, observaciones }
        );
        return {
          pendiente: true,
          mensaje: `Se ha creado una propuesta para crear un contrato borrador para el cliente ${clienteId}. Un administrador debe confirmar esta acción.`,
        };
      },
    };

    tools["proponer_agendar_visita"] = {
      description:
        "Propone agendar una visita técnica. Requiere confirmación humana.",
      inputSchema: z.object({
        clienteId: z.string().cuid(),
        fecha: z.string().datetime(),
        notas: z.string().optional(),
      }),
      execute: async (args: ToolArgs) => {
        const { clienteId, fecha, notas } = args as {
          clienteId: string;
          fecha: string;
          notas?: string;
        };
        await crearChatAccion(
          sesionId,
          usuarioId ?? "",
          "proponer_agendar_visita",
          { clienteId, fecha, notas }
        );
        return {
          pendiente: true,
          mensaje: `Se ha creado una propuesta para agendar una visita para el cliente ${clienteId} el ${fecha}. Un administrador debe confirmar esta acción.`,
        };
      },
    };
  }

  return tools;
}
