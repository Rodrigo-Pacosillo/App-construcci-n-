import { tool } from "ai";
import { z } from "zod";
import { obtenerConocimiento } from "@/lib/ai/conocimiento";
import type { ToolContext } from "@/lib/ai/contexto";
import { normalizarTexto } from "@/lib/ai/datos/normalizar";

export const buscarConocimientoTool = (ctx: ToolContext) =>
  tool({
    description: "Busca documentos de conocimiento por consulta (top 3).",
    inputSchema: z.object({
      consulta: z.string().min(2).describe("Consulta del usuario"),
    }),
    execute: async ({ consulta }) => {
      const docs = await obtenerConocimiento({
        audiencia: ctx.rol === "admin" ? "admin" : ctx.rol === "cliente" ? "cliente" : "publico",
      });
      const q = normalizarTexto(consulta);
      const tokens = q.split(" ").filter(Boolean);
      const ranked = docs
        .map((d) => {
          const hay = normalizarTexto(`${d.titulo} ${d.contenido}`);
          const score = tokens.reduce((acc, t) => acc + (hay.includes(t) ? 1 : 0), 0);
          return { d, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
      const resultados = (ranked.length ? ranked : docs.slice(0, 3).map((d) => ({ d, score: 0 }))).map(
        ({ d }) => ({
          titulo: d.titulo,
          fragmento: d.contenido.slice(0, 600),
        })
      );
      return { estado: "ok", resultados };
    },
  });
