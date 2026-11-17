import type { Tool } from "ai";
import type { ToolContext } from "@/lib/ai/contexto";
import { limpiarParaModelo } from "@/lib/ai/datos/seguridad";
import { buscarConocimientoTool } from "./conocimiento";
import { miResumenTool } from "./cliente/mi_resumen";
import { misCotizacionesTool } from "./cliente/mis_cotizaciones";
import { miObraTool } from "./cliente/mi_obra";
import { misPagosTool } from "./cliente/mis_pagos";
import { misDocumentosTool } from "./cliente/mis_documentos";
import { miCalendarioTool } from "./cliente/mi_calendario";
import { proponerNotaCalendarioTool } from "./cliente/proponer_nota_calendario";
import { buscarClientesTool } from "./admin/buscar_clientes";
import { fichaClienteTool } from "./admin/ficha_cliente";
import { listarCotizacionesTool } from "./admin/listar_cotizaciones";
import { listarObrasTool } from "./admin/listar_obras";
import { detalleObraTool } from "./admin/detalle_obra";
import { estadoFinancieroTool } from "./admin/estado_financiero";
import { agendaTool } from "./admin/agenda";
import { inventarioTool } from "./admin/inventario";
import { equipoObraTool } from "./admin/equipo_obra";
import { pendientesTool } from "./admin/pendientes";
import { proponerCambioEstadoCotizacionTool } from "./admin/proponer_cambio_estado_cotizacion";
import { proponerEventoCalendarioTool } from "./admin/proponer_evento_calendario";

/**
 * Salida de herramientas: se compacta para el modelo y se limpia con la red de
 * seguridad (ids, tokens, hashes y, para no-admin, notas internas y montos).
 * La salida completa sigue disponible para la UI por su propio canal.
 */
function compactarParaModelo(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(compactarParaModelo);
  if (valor && typeof valor === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(valor as Record<string, unknown>)) {
      if (/^id$|^accionId$|^ui$|Id$/.test(k)) continue;
      out[k] = compactarParaModelo(v);
    }
    return out;
  }
  return valor;
}

function envolver(toolOriginal: Tool, rol: ToolContext["rol"]): Tool {
  const executeOriginal = toolOriginal.execute;

  // Los resultados ambiguos llevan una tarjeta clickeable con el termino que
  // permite al resolver elegir una sola opcion sin volver a preguntar.
  const execute = executeOriginal
    ? async (input: unknown, options: unknown) => {
        const salida = await (executeOriginal as (i: unknown, o: unknown) => unknown)(
          input,
          options
        );
        if (
          salida &&
          typeof salida === "object" &&
          (salida as Record<string, unknown>).estado === "ambiguo" &&
          Array.isArray((salida as Record<string, unknown>).opciones)
        ) {
          return {
            ...(salida as Record<string, unknown>),
            ui: {
              tipo: "opciones",
              titulo: "Varias coincidencias",
              opciones: (salida as Record<string, unknown>).opciones,
            },
          };
        }
        return salida;
      }
    : undefined;

  return {
    ...toolOriginal,
    ...(execute ? { execute } : {}),
    toModelOutput: async ({ output }: { output: unknown }) => ({
      type: "json",
      value: limpiarParaModelo(compactarParaModelo(output), rol),
    }),
  } as unknown as Tool;
}

export function toolsPara(
  agente: "publico" | "cliente" | "admin",
  ctx: ToolContext
): Record<string, Tool> {
  let base: Record<string, Tool>;

  if (agente === "publico") {
    base = {
      buscar_conocimiento: buscarConocimientoTool(ctx),
    };
  } else if (agente === "cliente") {
    base = {
      mi_resumen: miResumenTool(ctx),
      mis_cotizaciones: misCotizacionesTool(ctx),
      mi_obra: miObraTool(ctx),
      mis_pagos: misPagosTool(ctx),
      mis_documentos: misDocumentosTool(ctx),
      mi_calendario: miCalendarioTool(ctx),
      proponer_nota_calendario: proponerNotaCalendarioTool(ctx),
      buscar_conocimiento: buscarConocimientoTool(ctx),
    };
  } else {
    base = {
      buscar_clientes: buscarClientesTool(ctx),
      ficha_cliente: fichaClienteTool(ctx),
      listar_cotizaciones: listarCotizacionesTool(ctx),
      listar_obras: listarObrasTool(ctx),
      detalle_obra: detalleObraTool(ctx),
      estado_financiero: estadoFinancieroTool(ctx),
      agenda: agendaTool(ctx),
      inventario: inventarioTool(ctx),
      equipo_obra: equipoObraTool(ctx),
      pendientes: pendientesTool(ctx),
      proponer_cambio_estado_cotizacion: proponerCambioEstadoCotizacionTool(ctx),
      proponer_evento_calendario: proponerEventoCalendarioTool(ctx),
      buscar_conocimiento: buscarConocimientoTool(ctx),
    };
  }

  const out: Record<string, Tool> = {};
  for (const [k, v] of Object.entries(base)) {
    out[k] = envolver(v, agente);
  }
  return out;
}
