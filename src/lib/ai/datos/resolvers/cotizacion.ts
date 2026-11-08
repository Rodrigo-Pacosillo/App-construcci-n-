import { prisma } from "@/lib/db";
import { normalizarTexto } from "../normalizar";
import type { Resolucion } from "./cliente";

type CotRow = {
  id: string;
  clienteId: string;
  tipoObra: string;
  estado: string;
  creadoEn: Date;
  ubicacionObra: string | null;
};

function etiqueta(c: CotRow): string {
  const fecha = c.creadoEn.toISOString().slice(0, 10);
  return `${c.tipoObra} · ${c.estado} · ${fecha}${c.ubicacionObra ? " · " + c.ubicacionObra : ""}`;
}

export async function resolverCotizacion(
  texto: string | undefined,
  opts: { clienteId: string }
): Promise<Resolucion<CotRow>> {
  const abiertas = await prisma.cotizacion.findMany({
    where: { clienteId: opts.clienteId, estado: { in: ["nuevo", "contactado"] } },
    orderBy: { creadoEn: "desc" },
    select: { id: true, clienteId: true, tipoObra: true, estado: true, creadoEn: true, ubicacionObra: true },
  });

  if (!texto || !texto.trim()) {
    if (abiertas.length === 0) {
      return { estado: "ninguno", sugerencia: "No hay cotizaciones abiertas para este cliente." };
    }
    if (abiertas.length === 1) {
      return { estado: "unico", valor: abiertas[0] as unknown as CotRow };
    }
    return {
      estado: "ambiguo",
      opciones: abiertas.slice(0, 5).map((c) => ({ etiqueta: etiqueta(c as unknown as CotRow) })),
      sugerencia: "Hay varias cotizaciones abiertas. Indique cual.",
    };
  }

  const norm = normalizarTexto(texto);
  const candidatos = abiertas.filter((c) => {
    const hay = normalizarTexto(`${c.tipoObra} ${c.ubicacionObra ?? ""}`);
    return hay.includes(norm) || norm.split(" ").some((t) => hay.includes(t));
  });

  // "la ultima" / "la mas reciente"
  if (/ultim|recient|m[aá]s nueva/i.test(texto)) {
    if (abiertas[0]) return { estado: "unico", valor: abiertas[0] as unknown as CotRow };
  }

  if (candidatos.length === 0) {
    return { estado: "ninguno", sugerencia: "No encontre esa cotizacion. Pruebe con tipo de obra o fecha." };
  }
  if (candidatos.length === 1) {
    return { estado: "unico", valor: candidatos[0] as unknown as CotRow };
  }
  return {
    estado: "ambiguo",
    opciones: candidatos.slice(0, 5).map((c) => ({ etiqueta: etiqueta(c as unknown as CotRow) })),
    sugerencia: "Hay varias cotizaciones que coinciden. Indique cual.",
  };
}
