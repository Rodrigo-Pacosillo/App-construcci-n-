import type { Tool } from "ai";
import type { ToolContext } from "@/lib/ai/contexto";
import { buscarConocimientoTool } from "./publico/conocimiento";
import { miResumenTool } from "./cliente/mi_resumen";
import { misCotizacionesTool } from "./cliente/mis_cotizaciones";
import { miObraTool } from "./cliente/mi_obra";
import { misPagosTool } from "./cliente/mis_pagos";
import { misDocumentosTool } from "./cliente/mis_documentos";
import { miCalendarioTool } from "./cliente/mi_calendario";
import { proponerNotaCalendarioTool } from "./cliente/proponer_nota_calendario";
import { buscarConocimientoClienteTool } from "./cliente/buscar_conocimiento";
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
import { buscarConocimientoAdminTool } from "./admin/buscar_conocimiento";

export function toolsPara(agente: "publico" | "cliente" | "admin", ctx: ToolContext): Record<string, Tool> {
  if (agente === "publico") {
    return {
      buscar_conocimiento: buscarConocimientoTool(ctx),
    };
  }
  if (agente === "cliente") {
    return {
      mi_resumen: miResumenTool(ctx),
      mis_cotizaciones: misCotizacionesTool(ctx),
      mi_obra: miObraTool(ctx),
      mis_pagos: misPagosTool(ctx),
      mis_documentos: misDocumentosTool(ctx),
      mi_calendario: miCalendarioTool(ctx),
      proponer_nota_calendario: proponerNotaCalendarioTool(ctx),
      buscar_conocimiento: buscarConocimientoClienteTool(ctx),
    };
  }
  return {
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
    buscar_conocimiento: buscarConocimientoAdminTool(ctx),
  };
}