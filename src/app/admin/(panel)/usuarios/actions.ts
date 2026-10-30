"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";

/**
 * Panel Usuarios (§7). Lista solo cuentas de `usuarios`, no fichas de
 * `clientes`. Un prospecto sin cuenta no aparece aquí.
 */
export async function getUsuarios() {
  await requireAdmin();

  try {
    const usuarios = await prisma.usuario.findMany({
      where: { rol: "cliente" },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            telefono: true,
            email: true,
            ciudad: true,
            obras: { select: { id: true, estado: true } },
          },
        },
      },
    });

    // Orden de §7.2: primero las cuentas con obras en curso/activas,
    // después el resto por fecha de creación.
    const conObraActiva = (u: (typeof usuarios)[number]) =>
      u.cliente?.obras.some((o) => o.estado === "en_curso" || o.estado === "pausada") ?? false;

    return usuarios.sort((a, b) => {
      const aActiva = conObraActiva(a);
      const bActiva = conObraActiva(b);
      if (aActiva !== bActiva) return aActiva ? -1 : 1;
      return b.creadoEn.getTime() - a.creadoEn.getTime();
    });
  } catch (error) {
    console.error("Error en getUsuarios:", error);
    return [];
  }
}

/**
 * Ficha completa de una cuenta (§7.3): datos personales, estado,
 * cotizaciones, contratos y obras del cliente asociado.
 * Nunca devuelve `passwordHash` ni datos de autenticación.
 */
export async function getUsuarioById(id: string) {
  await requireAdmin();

  try {
    const u = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        email: true,
        rol: true,
        activo: true,
        creadoEn: true,
        clienteId: true,
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            telefono: true,
            email: true,
            ciudad: true,
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
        },
      },
    });

    if (!u) return null;

    // Los `Decimal` de Prisma no cruzan a un Client Component; se
    // convierten a number explícitamente (§10.1).
    return {
      ...u,
      cliente: u.cliente
        ? {
            ...u.cliente,
            cotizaciones: u.cliente.cotizaciones.map((c) => ({
              ...c,
              montoEstimado: c.montoEstimado ? Number(c.montoEstimado) : null,
            })),
            contratos: u.cliente.contratos.map((c) => ({
              ...c,
              montoTotal: Number(c.montoTotal),
            })),
          }
        : null,
    };
  } catch (error) {
    console.error("Error en getUsuarioById:", error);
    return null;
  }
}

/**
 * Activa o suspende una cuenta (§7.5). La suspensión NO borra
 * historial, contratos, cotizaciones ni obras: solo impide iniciar sesión.
 */
export async function toggleUsuarioActivo(id: string, activo: boolean) {
  const admin = await requireAdmin();

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: { id: true, rol: true, email: true },
    });

    if (!usuario) {
      return { success: false, error: { _form: ["Usuario no encontrado"] } };
    }

    // Evitar que un admin se suspenda a sí mismo por error.
    if (usuario.email === admin.user?.email && !activo) {
      return {
        success: false,
        error: { _form: ["No puede suspender su propia cuenta"] },
      };
    }

    await prisma.usuario.update({
      where: { id },
      data: { activo },
    });

    revalidatePath("/admin/usuarios");
    revalidatePath(`/admin/usuarios/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Error al cambiar estado de usuario:", error);
    return {
      success: false,
      error: { _form: ["No se pudo actualizar la cuenta. Intente nuevamente."] },
    };
  }
}
