import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth-utils";

/**
 * Cotizaciones solo del usuario logueado (para clientes)
 * - Solo trae cotizaciones del cliente_id del usuario
 * - Filtro aplicado en DB
 * @returns Array de cotizaciones del usuario
 */
export async function getCotizacionesPropias() {
  const session = await auth();
  if (!session || session.user.role !== "cliente") {
    return [];
  }

  return await prisma.cotizacion.findMany({
    where: { clienteId: session.user.id },
    include: { cliente: true },
    orderBy: { creadoEn: "desc" },
    take: 50,
  });
}

/**
 * Cotizaciones para admin (todas las cotizaciones)
 * - Filtra por rol (requiere requireAdmin)
 * @returns Todas las cotizaciones con límite
 */
export async function getCotizacionesAdmin() {
  await requireAdmin();

  return await prisma.cotizacion.findMany({
    include: { cliente: true },
    orderBy: { creadoEn: "desc" },
    take: 1000,
  });
}

/**
 * Cotizaciones por estado (para dashboard admin)
 * @returns Mapa de estados a cotizaciones
 */
export async function getCotizacionesPorEstado() {
  await requireAdmin();

  const cotizaciones = await prisma.cotizacion.findMany({
    include: { cliente: true },
    take: 1000,
    orderBy: { creadoEn: "desc" },
  });

  const porEstado: Record<string, typeof cotizaciones> = {
    nuevo: [],
    contactado: [],
    visita_tecnica: [],
    presupuestado: [],
    ganado: [],
    perdido: [],
  };

  for (const c of cotizaciones) {
    if (porEstado[c.estado]) {
      porEstado[c.estado].push(c);
    }
  }

  return porEstado;
}

/**
 * Proyectos solo publicados (para página pública)
 * @returns Proyectos publicados ordenados
 */
export async function getProyectosPublicos() {
  return await prisma.proyecto.findMany({
    where: { publicado: true },
    orderBy: { creadoEn: "desc" },
    take: 20,
  });
}

/**
 * Proyectos destacados (para home)
 * @returns Proyectos destacados y publicados
 */
export async function getProyectosDestacados() {
  return await prisma.proyecto.findMany({
    where: { destacado: true, publicado: true },
    orderBy: { creadoEn: "desc" },
    take: 6,
  });
}

/**
 * Testimonios publicados (para página pública)
 * @returns Testimonios publicados
 */
export async function getTestimoniosPublicados() {
  return await prisma.testimonio.findMany({
    where: { publicado: true },
    orderBy: { actualizadoEn: "desc" },
    take: 10,
  });
}
