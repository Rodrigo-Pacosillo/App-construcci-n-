"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";

/**
 * Ficha de cliente (§7.3 / §6.4). `clientes` es central para vincular
 * personas con cotizaciones, contratos y obras, aunque no exista un
 * panel principal con ese nombre (§1).
 */
export async function getClienteById(id: string) {
  await requireAdmin();

  try {
    const c = await prisma.cliente.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        telefono: true,
        email: true,
        ciudad: true,
        creadoEn: true,
        usuario: {
          select: { id: true, email: true, activo: true },
        },
        cotizaciones: {
          select: {
            id: true,
            estado: true,
            tipoObra: true,
            creadoEn: true,
            montoEstimado: true,
          },
          orderBy: { creadoEn: "desc" },
        },
        contratos: {
          select: { id: true, montoTotal: true, fechaFirma: true, creadoEn: true },
          orderBy: { creadoEn: "desc" },
        },
        obras: {
          select: {
            id: true,
            direccionObra: true,
            estado: true,
            progreso: true,
            fechaInicio: true,
          },
          orderBy: { fechaInicio: "desc" },
        },
      },
    });

    if (!c) return null;

    // Los `Decimal` no cruzan a un Client Component (§10.1).
    return {
      ...c,
      cotizaciones: c.cotizaciones.map((cot) => ({
        ...cot,
        montoEstimado: cot.montoEstimado ? Number(cot.montoEstimado) : null,
      })),
      contratos: c.contratos.map((k) => ({
        ...k,
        montoTotal: Number(k.montoTotal),
      })),
    };
  } catch (error) {
    console.error("Error en getClienteById:", error);
    return null;
  }
}

/**
 * Lista de fichas de cliente para el módulo secundario Clientes (§1).
 * No es un panel principal: sirve para encontrar la ficha de una persona.
 */
export async function getClientes() {
  await requireAdmin();

  try {
    const clientes = await prisma.cliente.findMany({
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        telefono: true,
        email: true,
        ciudad: true,
        usuario: { select: { id: true, activo: true } },
        obras: { select: { id: true, estado: true } },
        _count: { select: { cotizaciones: true, contratos: true } },
      },
      orderBy: { creadoEn: "desc" },
      take: 200,
    });

    return clientes.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      apellidos: c.apellidos,
      telefono: c.telefono,
      email: c.email,
      ciudad: c.ciudad,
      tieneCuenta: Boolean(c.usuario),
      cuentaActiva: c.usuario?.activo ?? null,
      obrasActivas: c.obras.filter(
        (o) => o.estado === "en_curso" || o.estado === "pausada"
      ).length,
      totalObras: c.obras.length,
      totalCotizaciones: c._count.cotizaciones,
      totalContratos: c._count.contratos,
    }));
  } catch (error) {
    console.error("Error en getClientes:", error);
    return [];
  }
}
