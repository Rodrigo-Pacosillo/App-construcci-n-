import { prisma } from "@/lib/db";

/**
 * Resolución determinista de la obra a la que cuelga una nota o visita.
 *
 * Por qué existe: `EventoCalendario` no tiene `clienteId`; el dueño del evento
 * se alcanza por `obra.clienteId`. Elegir la obra "más reciente" a ciegas
 * (findFirst + orderBy fechaInicio desc) asignaba notas a obras terminadas.
 *
 * Contrato: NUNCA elige solo cuándo hay ambigüedad. Si no puede resolver con
 * certeza, devuelve el motivo y las candidatas para que el agente pregunte.
 */

export type ObraCandidata = {
  id: string;
  etiqueta: string;
  estado: string;
};

export type ResolucionObra =
  | { estado: "unica"; obraId: string; etiqueta: string; estadoObra: string }
  | { estado: "ambigua"; candidatas: ObraCandidata[] }
  | { estado: "sinActivas"; recientes: ObraCandidata[] }
  | { estado: "sinObras" };

const ESTADOS_TERMINALES = ["finalizada", "entregada"];

function aCandidata(obra: {
  id: string;
  nombreComercial: string | null;
  direccionObra: string;
  fechaInicio: Date;
  estado: string;
}): ObraCandidata {
  const nombre = obra.nombreComercial ?? "Obra sin nombre";
  const inicio = new Date(obra.fechaInicio).toISOString().slice(0, 10);
  return {
    id: obra.id,
    etiqueta: `${nombre} — ${obra.direccionObra} (inicio ${inicio})`,
    estado: obra.estado,
  };
}

export async function resolverObraDeCliente(
  clienteId: string,
  obraIdSugerida?: string
): Promise<ResolucionObra> {
  if (obraIdSugerida) {
    const obra = await prisma.obraActiva.findFirst({
      where: { id: obraIdSugerida, clienteId },
      select: {
        id: true,
        nombreComercial: true,
        direccionObra: true,
        fechaInicio: true,
        estado: true,
      },
    });
    if (!obra) {
      throw new Error("La obra indicada no pertenece a este cliente");
    }
    return {
      estado: "unica",
      obraId: obra.id,
      etiqueta: aCandidata(obra).etiqueta,
      estadoObra: obra.estado,
    };
  }

  const obras = await prisma.obraActiva.findMany({
    where: { clienteId },
    select: {
      id: true,
      nombreComercial: true,
      direccionObra: true,
      fechaInicio: true,
      estado: true,
    },
    orderBy: { fechaInicio: "desc" },
  });

  if (obras.length === 0) return { estado: "sinObras" };

  const activas = obras.filter(
    (o) => !ESTADOS_TERMINALES.includes(o.estado)
  );

  if (activas.length === 1) {
    return {
      estado: "unica",
      obraId: activas[0].id,
      etiqueta: aCandidata(activas[0]).etiqueta,
      estadoObra: activas[0].estado,
    };
  }

  if (activas.length > 1) {
    return { estado: "ambigua", candidatas: activas.map(aCandidata) };
  }

  return { estado: "sinActivas", recientes: obras.map(aCandidata) };
}
