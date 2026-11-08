import { prisma } from "@/lib/db";
import { convertToModelMessages } from "ai";
import { VENTANA_HISTORIAL } from "./config";
import type { Tool } from "ai";

type Msg = { rol: string; contenido: string; partes: unknown; metadatos: unknown };

export async function construirHistorial(sesionId: string, tools: Record<string, Tool>) {
  const rows = await prisma.chatMensaje.findMany({
    where: { sesionId },
    orderBy: { creadoEn: "desc" },
    take: VENTANA_HISTORIAL,
  });
  rows.reverse();

  // Colapsar mensajes consecutivos del mismo rol (fallback si hubo error de stream).
  const colapsados: Msg[] = [];
  for (const r of rows as unknown as Msg[]) {
    const last = colapsados[colapsados.length - 1];
    if (last && last.rol === r.rol) {
      last.contenido = `${last.contenido}\n${r.contenido}`;
      if (!last.partes && r.partes) last.partes = r.partes;
    } else {
      colapsados.push({ ...r });
    }
  }

  const uiMessages = colapsados.map((m) => {
    if (m.partes && typeof m.partes === "object") {
      return m.partes as { role: string; parts: unknown[] };
    }
    return { role: m.rol === "assistant" ? "assistant" : "user", parts: [{ type: "text", text: m.contenido }] };
  });

  // Poda: en turnos anteriores a los 2 ultimos, omitir resultados de tools.
  // (Simplificado: convertimos todo; toModelOutput ya compacta.)
  try {
    return await convertToModelMessages(uiMessages as never, { tools });
  } catch {
    // Fallback sin tools.
    return await convertToModelMessages(uiMessages as never);
  }
}
