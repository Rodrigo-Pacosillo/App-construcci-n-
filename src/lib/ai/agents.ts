import { z } from "zod";
import { NVIDIA_MODEL } from "./providers";
import type {
  DocConocimiento,
  AudienciaConocimiento,
} from "./conocimiento";
import type { EstadoHerramienta } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type AgenteId = "publico" | "cliente" | "admin";

export interface AgenteConfig {
  id: AgenteId;
  nombre: string;
  descripcion: string;
  model: string;
  temperature: number;
  maxTokens: number;
  limiteMensajesSesion: number | null;
  sistemaPromptBuilder: (ctx: {
    datosContexto?: Record<string, unknown>;
    conocimiento: DocConocimiento[];
  }) => Promise<string>;
  herramientas: string[];
  audienciaConocimiento: AudienciaConocimiento;
  categoriasConocimiento: string[];
}

/* ─────────────────────────────────────────────────────────────────────────────
   Prompt base común
   ───────────────────────────────────────────────────────────────────────────── */

const REGLAS_BASE = `
# REGLAS DE COMPORTAMIENTO (Constr-art)

## Tono y estilo
- Idioma: español neutro, formal pero cercano, usando tratamiento de usted.
- Prohibido el voseo ni modismos regionales.
- Longitud: respuestas concisas (máximo 3-4 oraciones por respuesta).
- Formato: listas con viñetas, párrafos cortos, sin markdown excesivo.

## Límites del bot
1. Nunca des precios exactos ni precio por m².
2. No prometas tiempos específicos. Puedes decir "24-48 horas hábiles" como referencia general.
3. No respondas sobre piscinas, jardines, decoración interior, precios de la competencia, o temas personales/políticos/religiosos.
4. No digas "tu cotización fue aprobada" ni similar.
5. NO menciones el número de WhatsApp en cada respuesta. Solo si el cliente lo pide o al cerrar.

## Proactividad
Si el cliente hace una pregunta vaga, pedir más contexto antes de responder.

Links útiles:
- Servicios: {sitioWeb}/servicios
- Cotización: {sitioWeb}/cotizacion
- FAQ: {sitioWeb}/faq
- Proyectos: {sitioWeb}/proyectos

Responde siempre en español neutro.
`.trim();

/* ─────────────────────────────────────────────────────────────────────────────
   Helper: obtener usuarioId de la sesión NextAuth
   ───────────────────────────────────────────────────────────────────────────── */

async function obtenerUsuarioIdDeSesion(): Promise<string | null> {
  const session = await auth();
  if (!session || !session.user) return null;
  return session.user.id as string;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Herramientas de lectura del cliente (filtradas por usuarioId -> clienteId)
   ───────────────────────────────────────────────────────────────────────────── */

const TOOL_OBTENER_MIS_COTIZACIONES = {
  name: "obtener_mis_cotizaciones",
  description: "Devuelve las cotizaciones del cliente autenticado.",
  parameters: z.object({}),
  execute: async ({ usuarioId }: { usuarioId: string }) => {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { clienteId: true },
    });
    if (!usuario?.clienteId) return [];
    const cotizaciones = await prisma.cotizacion.findMany({
      where: { clienteId: usuario.clienteId },
      orderBy: { creadoEn: "desc" },
      take: 10,
      select: {
        id: true,
        tipoObra: true,
        tipoConstruccion: true,
        rangoM2: true,
        plazoInicio: true,
        ubicacionObra: true,
        estado: true,
        creadoEn: true,
      },
    });
    return cotizaciones;
  },
};

const TOOL_OBTENER_AVANCE_OBRA = {
  name: "obtener_avance_obra",
  description: "Devuelve el avance de obra y hitos visibles del cliente autenticado.",
  parameters: z.object({}),
  execute: async ({ usuarioId }: { usuarioId: string }) => {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { clienteId: true },
    });
    if (!usuario?.clienteId) return { obra: null, avance: 0, hitos: [] };
    const obras = await prisma.obraActiva.findMany({
      where: { clienteId: usuario.clienteId },
      take: 5,
      select: {
        id: true,
        direccionObra: true,
        estado: true,
        progreso: true,
      },
    });
    if (!obras[0]) return { obra: null, avance: 0, hitos: [] };
    const obra = obras[0];
    const hitos = await prisma.hitosObra.findMany({
      where: { obraId: obra.id, visibleCliente: true },
      orderBy: { fecha: "asc" },
      select: {
        titulo: true,
        descripcion: true,
        fecha: true,
        visibleCliente: true,
      },
    });
    const total = hitos.length;
    const completados = hitos.filter((h) => h.visibleCliente).length;
    const avance = total === 0 ? 0 : Math.round((completados / total) * 100);
    return {
      obra: {
        id: obra.id,
        nombre: obra.direccionObra,
        estado: obra.estado,
      },
      avance,
      hitos: hitos.map((h) => ({
        titulo: h.titulo,
        descripcion: h.descripcion,
        fecha: h.fecha,
        visibleCliente: h.visibleCliente,
      })),
    };
  },
};

const TOOL_OBTENER_PROXIMOS_EVENTOS = {
  name: "obtener_proximos_eventos",
  description: "Devuelve los próximos eventos del calendario vinculados a las obras del cliente.",
  parameters: z.object({}),
  execute: async ({ usuarioId }: { usuarioId: string }) => {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { clienteId: true },
    });
    if (!usuario?.clienteId) return { eventos: [] };
    const obras = await prisma.obraActiva.findMany({
      where: { clienteId: usuario.clienteId },
      select: { id: true },
    });
    const obraIds = obras.map((o) => o.id);
    const eventos =
      obraIds.length > 0
        ? await prisma.eventoCalendario.findMany({
            where: {
              obraId: { in: obraIds },
              fechaInicio: { gte: new Date() },
              visibleCliente: true,
            },
            orderBy: { fechaInicio: "asc" },
            take: 10,
            select: {
              id: true,
              titulo: true,
              descripcion: true,
              fechaInicio: true,
            },
          })
        : [];
    return { eventos };
  },
};

/* ─────────────────────────────────────────────────────────────────────────────
   Herramientas de lectura del admin
   ───────────────────────────────────────────────────────────────────────────── */

const TOOL_BUSCAR_CLIENTES = {
  name: "buscar_clientes",
  description: "Busca clientes por nombre, email o teléfono.",
  parameters: z.object({ termino: z.string().min(1) }),
  execute: async ({ termino }: { termino: string }) => {
    const clientes = await prisma.cliente.findMany({
      where: {
        OR: [
          { nombre: { contains: termino, mode: "insensitive" } },
          { email: { contains: termino, mode: "insensitive" } },
          { telefono: { contains: termino, mode: "insensitive" } },
        ],
      },
      take: 10,
      select: { id: true, nombre: true, email: true, telefono: true },
    });
    return clientes;
  },
};

const TOOL_RESUMEN_COTIZACION = {
  name: "resumen_cotizacion",
  description: "Devuelve el resumen de una cotización por su ID.",
  parameters: z.object({ cotizacionId: z.string().cuid() }),
  execute: async ({ cotizacionId }: { cotizacionId: string }) => {
    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id: cotizacionId },
      include: { cliente: true },
    });
    if (!cotizacion) return { encontrado: false };
    return { encontrado: true, cotizacion };
  },
};

const TOOL_RESUMEN_AVANCE_OBRA = {
  name: "resumen_avance_obra",
  description: "Devuelve el resumen de avance de una obra.",
  parameters: z.object({ proyectoId: z.string().cuid() }),
  execute: async ({ proyectoId }: { proyectoId: string }) => {
    const obra = await prisma.obraActiva.findUnique({
      where: { id: proyectoId },
      select: {
        id: true,
        direccionObra: true,
        estado: true,
      },
    });
    if (!obra) return { encontrado: false };
    const totalHitos = await prisma.hitosObra.count({
      where: { obraId: proyectoId },
    });
    return {
      encontrado: true,
      obra: {
        id: obra.id,
        nombre: obra.direccionObra,
        estado: obra.estado,
      },
      totalHitos,
    };
  },
};

const TOOL_INVENTARIO_HERRAMIENTAS_MATERIALES = {
  name: "inventario_herramientas_y_materiales",
  description: "Consulta el inventario de herramientas y materiales con filtros opcionales.",
  parameters: z.object({
    filtro: z.string().optional(),
    estado: z.string().optional(),
  }),
  execute: async ({ filtro, estado }: { filtro?: string; estado?: string }) => {
    const [herramientas, materiales] = await Promise.all([
      prisma.herramienta.findMany({
        where: {
          ...(filtro
            ? { nombre: { contains: filtro, mode: "insensitive" } }
            : {}),
          ...(estado ? { estado: estado as EstadoHerramienta } : {}),
          activo: true,
        },
        take: 20,
        select: { id: true, nombre: true, codigo: true, estado: true },
      }),
      prisma.material.findMany({
        where: {
          ...(filtro
            ? { nombre: { contains: filtro, mode: "insensitive" } }
            : {}),
          activo: true,
        },
        take: 20,
        select: { id: true, nombre: true, unidad: true },
      }),
    ]);
    return { herramientas, materiales };
  },
};

/* ─────────────────────────────────────────────────────────────────────────────
   Registro de agentes
   ───────────────────────────────────────────────────────────────────────────── */

export const AGENTES: Record<AgenteId, AgenteConfig> = {
  publico: {
    id: "publico",
    nombre: "Asistente Público",
    descripcion: "Atiende a visitantes del sitio web sin cuenta, vinculados a una cotización específica.",
    model: NVIDIA_MODEL,
    temperature: 0.7,
    maxTokens: 700,
    limiteMensajesSesion: 20,
    sistemaPromptBuilder: async ({ datosContexto, conocimiento }) => {
      const cotizacion = datosContexto?.cotizacion as
        | {
            tipoObra?: string;
            tipoConstruccion?: string;
            rangoM2?: string;
            plazoInicio?: string;
            ubicacionObra?: string;
          }
        | undefined;
      const clienteNombre = (datosContexto?.clienteNombre as string) ?? "Cliente";
      const sitioWeb = (datosContexto?.sitioWeb as string) ?? "";

      const docsTexto = conocimiento
        .map((d) => `- ${d.titulo}: ${d.contenido}`)
        .join("\n");

      return `
Eres el asistente virtual de Constr-art, empresa de construcción en seco (Steel Frame) y tradicional. Atiendes a un cliente que acaba de enviar una cotización en el sitio web.

# DATOS DE LA COTIZACIÓN DEL CLIENTE
- Nombre: ${clienteNombre}
- Tipo de obra: ${cotizacion?.tipoObra ?? "No especificado"}
- Tipo de construcción: ${cotizacion?.tipoConstruccion ?? "No especificado"}
- Superficie estimada: ${cotizacion?.rangoM2 ?? "No especificada"}
- Plazo de inicio: ${cotizacion?.plazoInicio ?? "No especificado"}
- Ubicación: ${cotizacion?.ubicacionObra ?? "No especificada"}

# CONOCIMIENTO DISPONIBLE
${docsTexto || "(ningún documento de conocimiento cargado)"}

${REGLAS_BASE.replace("{sitioWeb}", sitioWeb)}

En tu PRIMERA respuesta, analiza los datos de la cotización y haz 2-3 preguntas concretas basadas en lo que el cliente llenó. Usa el nombre del cliente al inicio.
`.trim();
    },
    herramientas: [],
    audienciaConocimiento: "publico",
    categoriasConocimiento: [
      "sitio_web",
      "servicios",
      "faq",
      "tecnico",
      "proceso",
      "politica",
    ],
  },
  cliente: {
    id: "cliente",
    nombre: "Asistente de Cliente",
    descripcion:
      "Atiende a clientes autenticados con sus propios datos de cotizaciones, obra y eventos.",
    model: NVIDIA_MODEL,
    temperature: 0.7,
    maxTokens: 900,
    limiteMensajesSesion: 60,
    sistemaPromptBuilder: async ({ datosContexto, conocimiento }) => {
      const clienteNombre = (datosContexto?.clienteNombre as string) ?? "Cliente";
      const sitioWeb = (datosContexto?.sitioWeb as string) ?? "";
      const contextoDatos = datosContexto?.datosCliente as
        | Record<string, unknown>
        | undefined;

      const docsTexto = conocimiento
        .map((d) => `- ${d.titulo}: ${d.contenido}`)
        .join("\n");

      return `
Eres el asistente virtual de Constr-art para clientes autenticados. Atiendes a ${clienteNombre}.

# DATOS DEL CLIENTE
${contextoDatos ? JSON.stringify(contextoDatos, null, 2) : "(sin datos adicionales)"}

# CONOCIMIENTO DISPONIBLE
${docsTexto || "(ningún documento de conocimiento cargado)"}

${REGLAS_BASE.replace("{sitioWeb}", sitioWeb)}

Cuando el cliente pregunte por sus cotizaciones, avance de obra o próximos eventos, utiliza las herramientas disponibles para obtener sus datos reales. Nunca inventes información.
`.trim();
    },
    herramientas: [
      "obtener_mis_cotizaciones",
      "obtener_avance_obra",
      "obtener_proximos_eventos",
      "buscar_conocimiento",
    ],
    audienciaConocimiento: "cliente",
    categoriasConocimiento: [
      "sitio_web",
      "servicios",
      "faq",
      "tecnico",
      "proceso",
      "politica",
    ],
  },
  admin: {
    id: "admin",
    nombre: "Agente Admin",
    descripcion:
      "Agente para el panel de administración con herramientas de lectura y escritura segura (vía confirmación humana).",
    model: NVIDIA_MODEL,
    temperature: 0.4,
    maxTokens: 1200,
    limiteMensajesSesion: null,
    sistemaPromptBuilder: async ({ datosContexto, conocimiento }) => {
      const sitioWeb = (datosContexto?.sitioWeb as string) ?? "";

      const docsTexto = conocimiento
        .map((d) => `- ${d.titulo}: ${d.contenido}`)
        .join("\n");

      return `
Eres el agente de administración de Constr-art. Atiendes a un administrador del negocio. Tienes acceso a herramientas de lectura y escritura segura.

# CONOCIMIENTO DISPONIBLE
${docsTexto || "(ningún documento de conocimiento cargado)"}

${REGLAS_BASE.replace("{sitioWeb}", sitioWeb)}

## Herramientas de escritura (siempre vía confirmación humana)
Cuando necesites realizar una escritura (cambiar estado de cotización o agendar visita), debes:
1. Llamar a la herramienta proponer_* correspondiente.
2. El sistema creará una acción pendiente (ChatAccion) que el administrador debe confirmar o rechazar.
3. NUNCA ejecutes escrituras directamente.

Los contratos NO se crean desde el chat: si el administrador pide crear un contrato, indícale que lo haga desde el panel Contratos (o desde la cotización correspondiente) para respetar la regla de un solo contrato por cotización.

Cuando el administrador te pida cambiar el estado de una cotización o agendar una visita, usa las herramientas de propuesta y espera la confirmación.
`.trim();
    },
    herramientas: [
      "buscar_clientes",
      "resumen_cotizacion",
      "resumen_avance_obra",
      "inventario_herramientas_y_materiales",
      "proponer_cambio_estado_cotizacion",
      "proponer_agendar_visita",
      "buscar_conocimiento",
    ],
    audienciaConocimiento: "admin",
    categoriasConocimiento: [
      "sitio_web",
      "servicios",
      "faq",
      "tecnico",
      "proceso",
      "politica",
      "otro",
    ],
  },
};

export function obtenerAgente(id: AgenteId): AgenteConfig {
  const agente = AGENTES[id];
  if (!agente) {
    throw new Error(`Agente no encontrado: ${id}`);
  }
  return agente;
}

export {
  TOOL_OBTENER_MIS_COTIZACIONES,
  TOOL_OBTENER_AVANCE_OBRA,
  TOOL_OBTENER_PROXIMOS_EVENTOS,
  TOOL_BUSCAR_CLIENTES,
  TOOL_RESUMEN_COTIZACION,
  TOOL_RESUMEN_AVANCE_OBRA,
  TOOL_INVENTARIO_HERRAMIENTAS_MATERIALES,
  obtenerUsuarioIdDeSesion,
};
