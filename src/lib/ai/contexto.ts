import { TZ_NEGOCIO } from "./config";

export type ToolContext = {
  usuarioId?: string;
  clienteId?: string;
  rol: "publico" | "cliente" | "admin";
  sesionId: string;
  ahora: Date;
  sitioWeb?: string;
};

export function buildToolContext(params: {
  usuarioId?: string;
  clienteId?: string;
  rol: "publico" | "cliente" | "admin";
  sesionId: string;
  sitioWeb?: string;
}): ToolContext {
  return {
    usuarioId: params.usuarioId,
    clienteId: params.clienteId,
    rol: params.rol,
    sesionId: params.sesionId,
    ahora: new Date(),
    sitioWeb: params.sitioWeb,
  };
}

export function fechaNegocioISO(d: Date): string {
  return d.toLocaleString("es-BO", { timeZone: TZ_NEGOCIO });
}
