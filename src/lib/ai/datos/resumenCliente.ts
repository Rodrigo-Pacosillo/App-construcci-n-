import { prisma } from "@/lib/db";
import { ResumenClienteDTO } from "@/lib/ai/chat/tipos";
import { ESTADO_OBRA_LABELS } from "@/lib/constants";

export async function obtenerResumenCliente(clienteId: string): Promise<ResumenClienteDTO> {
  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    select: { nombre: true },
  });

  const [obraPrincipal, proximoEvento, cotizacionesAbiertas] = await Promise.all([
    prisma.obraActiva.findFirst({
      where: { clienteId },
      orderBy: [
        { estado: "asc" }, // en_curso primero
        { fechaInicio: "desc" },
      ],
      select: {
        nombreComercial: true,
        direccionObra: true,
        estado: true,
        progreso: true,
      },
    }),
    prisma.eventoCalendario.findFirst({
      where: {
        OR: [
          { clienteId },
          { obra: { clienteId } },
        ],
        fechaInicio: { gte: new Date() },
        visibleCliente: true,
      },
      orderBy: { fechaInicio: "asc" },
      select: { titulo: true, fechaInicio: true },
    }),
    prisma.cotizacion.count({
      where: { clienteId, estado: { in: ["nuevo", "contactado"] } },
    }),
  ]);

  return {
    nombre: cliente?.nombre ?? "Cliente",
    obraPrincipal: obraPrincipal
      ? {
          nombre: obraPrincipal.nombreComercial ?? obraPrincipal.direccionObra,
          estado: obraPrincipal.estado,
          estadoLabel: ESTADO_OBRA_LABELS[obraPrincipal.estado as keyof typeof ESTADO_OBRA_LABELS] ?? obraPrincipal.estado,
          progreso: obraPrincipal.progreso ?? 0,
        }
      : null,
    proximoEvento: proximoEvento
      ? {
          titulo: proximoEvento.titulo,
          fecha: new Date(proximoEvento.fechaInicio).toLocaleDateString("es-BO", {
            timeZone: "America/La_Paz",
            weekday: "short",
            day: "2-digit",
            month: "short",
          }),
        }
      : null,
    cotizacionesAbiertas,
  };
}