import { prisma } from "@/lib/db";
import { normalizarTexto } from "../normalizar";
import type { Resolucion } from "./cliente";

type ObraRow = {
  id: string;
  nombreComercial: string | null;
  direccionObra: string;
  estado: string;
  clienteId: string;
  fechaInicio: Date;
};

function etiqueta(o: ObraRow): string {
  const nombre = o.nombreComercial ?? "Obra sin nombre";
  return `${nombre} — ${o.direccionObra} (${o.estado})`;
}

export async function resolverObra(
  texto: string,
  opts?: { clienteId?: string }
): Promise<Resolucion<ObraRow>> {
  const norm = normalizarTexto(texto);
  const where: Record<string, unknown> = {};
  if (opts?.clienteId) where.clienteId = opts.clienteId;

  const obras = await prisma.obraActiva.findMany({
    where,
    select: {
      id: true,
      nombreComercial: true,
      direccionObra: true,
      estado: true,
      clienteId: true,
      fechaInicio: true,
    },
  });

  // Si hay un solo cliente y una sola obra activa, resolver directo.
  if (opts?.clienteId) {
    const activas = obras.filter((o) => o.estado === "en_curso" || o.estado === "pausada");
    if (activas.length === 1 && !texto.trim()) {
      return { estado: "unico", valor: activas[0] as unknown as ObraRow };
    }
  }

  const candidatos = obras.filter((o) => {
    const hay = normalizarTexto(`${o.nombreComercial ?? ""} ${o.direccionObra}`);
    return !norm || hay.includes(norm) || norm.split(" ").some((t) => hay.includes(t));
  });

  if (candidatos.length === 0) {
    return { estado: "ninguno", sugerencia: "No encontre obras. Pruebe con el nombre o la direccion." };
  }
  if (candidatos.length === 1) {
    return { estado: "unico", valor: candidatos[0] as unknown as ObraRow };
  }
  return {
    estado: "ambiguo",
    opciones: candidatos.slice(0, 5).map((o) => ({ etiqueta: etiqueta(o as unknown as ObraRow) })),
    sugerencia: "Hay varias obras que coinciden. Indique cual.",
  };
}
