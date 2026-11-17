import { tool } from "ai";
import { z } from "zod";
import {
  obtenerConocimiento,
  CATEGORIAS_SITIO,
} from "@/lib/ai/conocimiento";
import type { ToolContext } from "@/lib/ai/contexto";
import { normalizarTexto } from "@/lib/ai/datos/normalizar";

/**
 * Unica implementacion de busqueda de conocimiento para los tres agentes.
 * Antes habia tres copias identicas que solo cambiaban el parametro `audiencia`.
 */
const DESCRIPCIONES = {
  publico: "Busca documentos publicos del sitio por consulta (top 3).",
  cliente: "Busca documentos de conocimiento para el cliente (top 3).",
  admin: "Busca documentos de conocimiento para admin (top 3).",
} as const;

export const buscarConocimientoTool = (ctx: ToolContext) =>
  tool({
    description: DESCRIPCIONES[ctx.rol],
    inputSchema: z.object({
      consulta: z.string().min(2).describe("Consulta del usuario"),
    }),
    execute: async ({ consulta }) => {
      const docs = await obtenerConocimiento({
        audiencia: ctx.rol,
        ...(ctx.rol === "publico" ? { categorias: CATEGORIAS_SITIO } : {}),
      });

      const tokens = normalizarTexto(consulta).split(" ").filter(Boolean);
      const ranked = docs
        .map((d) => {
          const hay = normalizarTexto(`${d.titulo} ${d.contenido}`);
          const score = tokens.reduce(
            (acc, t) => acc + (hay.includes(t) ? 1 : 0),
            0
          );
          return { d, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      const resultados = (
        ranked.length ? ranked : docs.slice(0, 3).map((d) => ({ d }))
      ).map(({ d }) => ({
        titulo: d.titulo,
        fragmento: d.contenido.slice(0, 600),
      }));

      return { estado: "ok", resultados };
    },
  });
