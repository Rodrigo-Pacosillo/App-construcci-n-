import { NVIDIA_MODEL } from "./providers";
import type {
  DocConocimiento,
  AudienciaConocimiento,
  CategoriaConocimiento,
} from "./conocimiento";
import { CATEGORIAS_SITIO } from "./conocimiento";
import { LIMITE_MENSAJES } from "./config";
import { reglasComunes, bloqueFecha } from "./prompts/base";
import { buildPublicoPrompt } from "./prompts/publico";

export type AgenteId = "publico" | "cliente" | "admin";

export interface AgenteConfig {
  id: AgenteId;
  nombre: string;
  descripcion: string;
  etiquetaUI?: string;
  descripcionUI?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  limiteMensajesSesion: number | null;
  sistemaPromptBuilder: (ctx: {
    datosContexto?: Record<string, unknown>;
    conocimiento: DocConocimiento[];
  }) => Promise<string>;
  audienciaConocimiento: AudienciaConocimiento;
  categoriasConocimiento: CategoriaConocimiento[];
}

/* ─────────────────────────────────────────────────────────────────────────────
   Registro de agentes
   El prompt público vive en ./prompts/publico.ts (fuente única).
   ───────────────────────────────────────────────────────────────────────────── */

export const AGENTES: Record<AgenteId, AgenteConfig> = {
  publico: {
    id: "publico",
    nombre: "Asistente Público",
    descripcion:
      "Atiende a visitantes del sitio web sin cuenta, vinculados a una cotización específica.",
    model: NVIDIA_MODEL,
    temperature: 0.5,
    maxTokens: 500,
    // El cupo público se cuenta por cotización en la ruta, no por sesión.
    limiteMensajesSesion: null,
    etiquetaUI: "Asistente de cotización",
    descripcionUI: "Resuelve dudas sobre su cotización",
    sistemaPromptBuilder: buildPublicoPrompt,
    audienciaConocimiento: "publico",
    categoriasConocimiento: CATEGORIAS_SITIO,
  },

  cliente: {
    id: "cliente",
    nombre: "Asistente de Cliente",
    descripcion:
      "Atiende a clientes autenticados con sus propios datos de cotizaciones, obra y eventos.",
    model: NVIDIA_MODEL,
    temperature: 0.3,
    maxTokens: 700,
    limiteMensajesSesion: LIMITE_MENSAJES.cliente,
    etiquetaUI: "Asistente de su cuenta",
    descripcionUI: "Consulta sus datos y gestiona su cuenta",
    sistemaPromptBuilder: async ({ datosContexto, conocimiento }) => {
      const clienteNombre =
        (datosContexto?.clienteNombre as string) ?? "Cliente";
      const sitioWeb = (datosContexto?.sitioWeb as string) ?? "";
      const contextoDatos = datosContexto?.datosCliente as
        | Record<string, unknown>
        | undefined;
      const docsTexto = conocimiento
        .map((d) => `- ${d.titulo}: ${d.contenido}`)
        .join("\n");

      return [
        `Eres el asistente virtual de Constr-art para clientes autenticados. Atiendes a ${clienteNombre}.`,
        "",
        bloqueFecha(),
        "",
        "# DATOS DEL CLIENTE",
        contextoDatos
          ? JSON.stringify(contextoDatos, null, 2).slice(0, 2000)
          : "(sin datos adicionales)",
        "",
        "# CONOCIMIENTO DISPONIBLE",
        docsTexto || "(ningún documento de conocimiento cargado)",
        "",
        reglasComunes(sitioWeb),
        "",
        "Cuando el cliente pregunte por sus cotizaciones, avance de obra o próximos eventos, use las herramientas disponibles para obtener sus datos reales. Nunca invente información. Ya es cliente: no venda.",
      ]
        .join("\n")
        .trim();
    },
    audienciaConocimiento: "cliente",
    categoriasConocimiento: CATEGORIAS_SITIO,
  },

  admin: {
    id: "admin",
    nombre: "Agente Admin",
    descripcion:
      "Agente para el panel de administración con herramientas de lectura y escritura segura (vía confirmación humana).",
    model: NVIDIA_MODEL,
    temperature: 0.2,
    maxTokens: 1000,
    limiteMensajesSesion: LIMITE_MENSAJES.admin,
    etiquetaUI: "Asistente del panel",
    descripcionUI: "Gestión del negocio con confirmación humana",
    sistemaPromptBuilder: async ({ datosContexto, conocimiento }) => {
      const sitioWeb = (datosContexto?.sitioWeb as string) ?? "";
      const docsTexto = conocimiento
        .map((d) => `- ${d.titulo}: ${d.contenido}`)
        .join("\n");

      return [
        "Eres el agente de administración de Constr-art. Atiendes a un administrador del negocio. Tienes acceso a herramientas de lectura y escritura segura.",
        "",
        bloqueFecha(),
        "",
        "# CONOCIMIENTO DISPONIBLE",
        docsTexto || "(ningún documento de conocimiento cargado)",
        "",
        reglasComunes(sitioWeb),
        "",
        "## Herramientas de escritura (siempre vía confirmación humana)",
        "Cuando necesite realizar una escritura (cambiar estado de cotización, agendar una visita o dejar una nota en el calendario):",
        "1. Llame a la herramienta proponer_* correspondiente.",
        "2. El sistema creará una acción pendiente (ChatAccion) que el administrador debe confirmar o rechazar.",
        "3. NUNCA ejecute escrituras directamente.",
        "",
        "Los contratos NO se crean desde el chat: si el administrador pide crear un contrato, indíquele que lo haga desde el panel Contratos (o desde la cotización correspondiente) para respetar la regla de un solo contrato por cotización.",
        "",
        "Para notas: el admin decide si es visible para el cliente; si no queda claro, pregunte antes de invocar la herramienta. Un evento puede colgar de una obra (visible para el cliente) o ser una nota interna sin obra (solo admin).",
        "",
        "## Herramientas de lectura (ÚSELAS ANTES de pedir datos al administrador)",
        "",
        "1. NUNCA pida al administrador IDs ni datos que pueda buscar con buscar_clientes (un nombre parcial, un email o un teléfono son suficientes).",
        "2. Un solo resultado → úselo directamente y preséntelo: \"Encontré a Juan Pérez (juan@…)\".",
        "3. Varios resultados → muéstrelos numerados (nombre — email — teléfono) y pregunte cuál.",
        "4. Ningún resultado → dígalo y sugiera buscar con otro dato. No insista con el mismo término.",
        "5. Los resultados de herramientas ya obtenidos en esta conversación SIGUEN VÁLIDOS: no vuelva a ejecutar la misma búsqueda.",
        "6. Preguntas de conteo (\"¿cuántos…?\") → resumen del panel. Panorama completo de un cliente → ficha del cliente (una vez que tenga su identificador interno).",
        "",
        "# EJEMPLO DE FLUJO CORRECTO",
        "Admin: \"dame el resumen de cotizaciones de juan y deja una nota en su calendario para mañana\"",
        "Tú: buscar_clientes(\"juan\") → 1 resultado → ficha_cliente → presentas cotizaciones y obras → proponer_evento_calendario con la obra correcta y visibilidad explícita → esperas confirmación. Todo en el mismo turno, sin preguntar nada que ya pudiste resolver tú.",
      ]
        .join("\n")
        .trim();
    },
    audienciaConocimiento: "admin",
    categoriasConocimiento: [...CATEGORIAS_SITIO, "otro"],
  },
};

export function obtenerAgente(id: AgenteId): AgenteConfig {
  const agente = AGENTES[id];
  if (!agente) {
    throw new Error(`Agente no encontrado: ${id}`);
  }
  return agente;
}
