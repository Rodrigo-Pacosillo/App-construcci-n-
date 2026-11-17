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

/** Termino sin IDs que permite a las tarjetas de opciones resolver sin ambigüedad. */
function termino(c: CotRow, todas: CotRow[]): string {
  const fecha = c.creadoEn.toISOString().slice(0, 10);
  const indice = todas.filter((x) => x.creadoEn.toISOString().slice(0, 10) === fecha).indexOf(c) + 1;
  return `${c.tipoObra} ${fecha} opcion ${indice}`;
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
      opciones: abiertas.slice(0, 5).map((c) => ({
        etiqueta: etiqueta(c as unknown as CotRow),
        termino: termino(c as unknown as CotRow, abiertas as unknown as CotRow[]),
      })),
      sugerencia: "Hay varias cotizaciones abiertas. Indique cual.",
    };
  }

  // Seleccion desde tarjeta de opciones: "tipo YYYY-MM-DD opcion N" (sin IDs).
  const seleccion = texto.match(/^(.+?)\s+(\d{4}-\d{2}-\d{2})\s+opcion\s+(\d+)$/i);
  if (seleccion) {
    const porFecha = abiertas.filter(
      (c) => c.creadoEn.toISOString().slice(0, 10) === seleccion[2]
    );
    const elegida = porFecha[Number(seleccion[3]) - 1] as unknown as CotRow | undefined;
    if (elegida) return { estado: "unico", valor: elegida };
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
    opciones: candidatos.slice(0, 5).map((c) => ({
      etiqueta: etiqueta(c as unknown as CotRow),
      termino: termino(c as unknown as CotRow, abiertas as unknown as CotRow[]),
    })),
    sugerencia: "Hay varias cotizaciones que coinciden. Indique cual.",
  };
}
