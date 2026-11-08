// Red de seguridad para datos que llegan al modelo/navegador por chat (Fase 2).

const PROHIBIDOS_BASE = [
  /^id$/,
  /Id$/,
  /^token$/,
  /hash/i,
  /password/i,
  /publicId/i,
  /salario/i,
  /^ci$/i,
];

// Campos prohibidos solo para agentes no-admin.
const PROHIBIDOS_NO_ADMIN = [/notasInternas/i, /montoEstimado/i];

export type AgenteSeguridad = "publico" | "cliente" | "admin";

export function camposProhibidos(agente: AgenteSeguridad): RegExp[] {
  const base = [...PROHIBIDOS_BASE];
  if (agente !== "admin") base.push(...PROHIBIDOS_NO_ADMIN);
  return base;
}

export function esClaveProhibida(clave: string, agente: AgenteSeguridad): boolean {
  return camposProhibidos(agente).some((r) => r.test(clave));
}

export function limpiarParaModelo<T>(obj: T, agente: AgenteSeguridad): T {
  if (Array.isArray(obj)) {
    return obj.map((v) => limpiarParaModelo(v, agente)) as unknown as T;
  }
  if (obj && typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (esClaveProhibida(k, agente)) continue;
      out[k] = limpiarParaModelo(v, agente);
    }
    return out as unknown as T;
  }
  return obj;
}

const CUID_RE = /\bc[a-z0-9]{24}\b/;

export function assertSinProhibidos(obj: unknown, agente: AgenteSeguridad = "publico"): void {
  if (Array.isArray(obj)) {
    obj.forEach((v) => assertSinProhibidos(v, agente));
    return;
  }
  if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (esClaveProhibida(k, agente)) {
        throw new Error(`Campo prohibido detectado: ${k}`);
      }
      if (typeof v === "string" && CUID_RE.test(v)) {
        throw new Error(`Valor con forma de cuid detectado en ${k}`);
      }
      assertSinProhibidos(v, agente);
    }
  }
}
