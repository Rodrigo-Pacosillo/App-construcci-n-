import { prisma } from "@/lib/db";
import { PendientesDTO } from "@/lib/ai/chat/tipos";
import { TZ_NEGOCIO } from "@/lib/ai/config";

export async function obtenerPendientes(): Promise<PendientesDTO> {
  const ahora = new Date();
  const inicioHoy = new Date(ahora.toLocaleString("en-US", { timeZone: TZ_NEGOCIO }));
  inicioHoy.setHours(0, 0, 0, 0);
  const finHoy = new Date(inicioHoy);
  finHoy.setHours(23, 59, 59, 999);

  const [
    cotizacionesNuevas,
    cotMasAntigua,
    eventosHoy,
    obrasEnCurso,
    materialesBajoStock,
    herramientasSinDevolver,
  ] = await Promise.all([
    prisma.cotizacion.count({ where: { estado: "nuevo" } }),
    prisma.cotizacion.findFirst({
      where: { estado: "nuevo" },
      orderBy: { creadoEn: "asc" },
      select: { creadoEn: true },
    }),
    prisma.eventoCalendario.count({
      where: { fechaInicio: { gte: inicioHoy, lte: finHoy } },
    }),
    prisma.obraActiva.count({ where: { estado: "en_curso" } }),
    prisma.material.count({
      where: {
        activo: true,
        stockActual: { lt: prisma.material.fields.stockMinimo },
      },
    }),
    prisma.herramienta.count({
      where: {
        activo: true,
        prestamos: { some: { fechaDevolucion: null } },
      },
    }),
  ]);

  return {
    cotizacionesNuevas,
    cotizacionMasAntiguaDias: cotMasAntigua
      ? Math.floor((ahora.getTime() - new Date(cotMasAntigua.creadoEn).getTime()) / (1000 * 60 * 60 * 24))
      : null,
    eventosHoy,
    obrasEnCurso,
    materialesBajoStock,
    herramientasSinDevolver,
  };
}