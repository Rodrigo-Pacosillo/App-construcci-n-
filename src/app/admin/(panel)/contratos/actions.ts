"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { z } from "zod";

const emptyToUndefined = (v: unknown) => {
  if (v === "" || v === null || v === undefined) return undefined;
  return v;
};

const contratoSchema = z.object({
  clienteId: z.string().cuid({ message: "Cliente inválido" }),
  cotizacionId: z.preprocess(
    emptyToUndefined,
    z.string().cuid({ message: "Cotización inválida" }).optional()
  ),
  archivoPdfUrl: z.preprocess(
    emptyToUndefined,
    z.string().url({ message: "URL inválida" }).optional()
  ),
  fechaFirma: z.preprocess(
    emptyToUndefined,
    z.coerce.date({ message: "Fecha inválida" }).optional()
  ),
  montoTotal: z.coerce
    .number("Monto inválido")
    .positive("El monto debe ser mayor a 0"),
  observaciones: z.preprocess(emptyToUndefined, z.string().optional()),
});

export async function getContratos() {
  await requireAdmin();

  try {
    return await prisma.contrato.findMany({
      include: {
        cliente: true,
        cotizacion: true,
        obras: true,
      },
      orderBy: { creadoEn: "desc" },
      take: 50,
    });
  } catch (error) {
    console.error("Error en getContratos:", error);
    return [];
  }
}

export async function getContratoById(id: string) {
  await requireAdmin();

  try {
    const contrato = await prisma.contrato.findUnique({
      where: { id },
      include: {
        cliente: {
          include: {
            usuario: { select: { id: true } },
          },
        },
        cotizacion: true,
        obras: true,
      },
    });

    if (!contrato) {
      return null;
    }

    return {
      ...contrato,
      tieneUsuario: Boolean(contrato.cliente.usuario?.id),
    };
  } catch (error) {
    console.error("Error en getContratoById:", error);
    return null;
  }
}

export async function createContrato(formData: FormData) {
  await requireAdmin();

  const data = {
    clienteId: formData.get("clienteId") as string,
    cotizacionId: formData.get("cotizacionId") as string | null,
    archivoPdfUrl: formData.get("archivoPdfUrl") as string | null,
    fechaFirma: formData.get("fechaFirma") as string | null,
    montoTotal: formData.get("montoTotal") as string,
    observaciones: formData.get("observaciones") as string | null,
  };

  const parsed = contratoSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const { cotizacionId, ...rest } = parsed.data;

    // §6.5 — validar en servidor que el cliente existe.
    const cliente = await prisma.cliente.findUnique({
      where: { id: rest.clienteId },
      select: { id: true },
    });
    if (!cliente) {
      return { success: false, error: { clienteId: ["El cliente no existe"] } };
    }

    // §6.5 — si hay cotización, validar que corresponde al mismo cliente
    // y que no tenga ya un contrato (§5.8: impedir duplicados).
    if (cotizacionId) {
      const cotizacion = await prisma.cotizacion.findUnique({
        where: { id: cotizacionId },
        select: { id: true, clienteId: true, contratos: { select: { id: true } } },
      });
      if (!cotizacion) {
        return { success: false, error: { cotizacionId: ["La cotización no existe"] } };
      }
      if (cotizacion.clienteId !== rest.clienteId) {
        return {
          success: false,
          error: { cotizacionId: ["La cotización pertenece a otro cliente"] },
        };
      }
      if (cotizacion.contratos.length > 0) {
        return {
          success: false,
          error: { cotizacionId: ["Esta cotización ya tiene un contrato asociado"] },
        };
      }
    }

    // §10.3 — transacción: crear contrato + marcar cotización como
    // `contratado` + crear obra automáticamente en la misma operación lógica.
    const contrato = await prisma.$transaction(async (tx) => {
      const nuevo = await tx.contrato.create({
        data: {
          ...rest,
          cotizacionId: cotizacionId ?? null,
          fechaFirma: parsed.data.fechaFirma ? new Date(parsed.data.fechaFirma) : null,
        },
      });
      if (cotizacionId) {
        await tx.cotizacion.update({
          where: { id: cotizacionId },
          data: { estado: "contratado" },
        });
      }

      // Crear obra automáticamente si no existe ya una vinculada
      const obraExistente = await tx.obraActiva.findFirst({
        where: { contratoId: nuevo.id },
        select: { id: true },
      });
      if (!obraExistente) {
        let direccionObra = "A definir";
        if (cotizacionId) {
          const cotizacionOrigen = await tx.cotizacion.findUnique({
            where: { id: cotizacionId },
            select: { ubicacionObra: true },
          });
          if (cotizacionOrigen?.ubicacionObra) {
            direccionObra = cotizacionOrigen.ubicacionObra;
          }
        }
        await tx.obraActiva.create({
          data: {
            clienteId: rest.clienteId,
            contratoId: nuevo.id,
            direccionObra,
            fechaInicio: new Date(),
            estado: "en_curso",
            progreso: 0,
          },
        });
      }

      return nuevo;
    });

    // Verificar si el cliente ya tiene usuario
    const clienteConUsuario = await prisma.cliente.findUnique({
      where: { id: rest.clienteId },
      select: { usuario: { select: { id: true } } },
    });

    revalidatePath("/admin/contratos");
    revalidatePath("/admin/cotizaciones");
    revalidatePath("/admin/obras");
    revalidatePath("/admin");
    return { success: true, data: contrato, clienteId: rest.clienteId, tieneUsuario: Boolean(clienteConUsuario?.usuario?.id) };
  } catch (error) {
    console.error("Error creando contrato:", error);
    return {
      success: false,
      error: { _form: ["Error al crear el contrato. Intente nuevamente."] },
    };
  }
}

export async function updateContrato(id: string, formData: FormData) {
  await requireAdmin();

  const data = {
    clienteId: formData.get("clienteId") as string,
    cotizacionId: (formData.get("cotizacionId") as string) || null,
    archivoPdfUrl: (formData.get("archivoPdfUrl") as string) || null,
    fechaFirma: (formData.get("fechaFirma") as string) || null,
    montoTotal: parseFloat(formData.get("montoTotal") as string),
    observaciones: (formData.get("observaciones") as string) || null,
  };

  const parsed = contratoSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const { cotizacionId, ...rest } = parsed.data;
    await prisma.contrato.update({
      where: { id },
      data: {
        ...rest,
        cotizacionId: cotizacionId || null,
        fechaFirma: parsed.data.fechaFirma ? new Date(parsed.data.fechaFirma) : null,
      },
    });

    revalidatePath("/admin/contratos");
    revalidatePath(`/admin/contratos/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Error actualizando contrato:", error);
    return {
      success: false,
      error: { _form: ["Error al actualizar el contrato. Intente nuevamente."] },
    };
  }
}

export async function deleteContrato(id: string) {
  await requireAdmin();

  try {
    await prisma.contrato.delete({ where: { id } });
    revalidatePath("/admin/contratos");
    return { success: true };
  } catch (error) {
    console.error("Error eliminando contrato:", error);
    return {
      success: false,
      error: { _form: ["Error al eliminar el contrato. Intente nuevamente."] },
    };
  }
}

export async function getClientesForSelect() {
  await requireAdmin();
  return prisma.cliente.findMany({
    select: { id: true, nombre: true, apellidos: true, email: true },
    orderBy: { nombre: "asc" },
  });
}

export async function getCotizacionesGanadasForSelect(
  incluirCotizacionId?: string
) {
  await requireAdmin();
  return prisma.cotizacion.findMany({
    where: {
      contratos: { none: {} },
      ...(incluirCotizacionId
        ? { OR: [{ estado: "contratado" }, { id: incluirCotizacionId }] }
        : { estado: "contratado" }),
    },
    select: { id: true, tipoObra: true, cliente: { select: { nombre: true, apellidos: true } } },
    orderBy: { creadoEn: "desc" },
  });
}

/**
 * §6.4 — después de guardar el contrato, decide a dónde lleva al admin:
 * si el cliente ya tiene cuenta, a la ficha de esa cuenta; si no, al
 * alta de cuenta con los datos precargados. Nunca crea una cuenta sola.
 */
export async function getDestinoPostContrato(clienteId: string) {
  await requireAdmin();

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        email: true,
        usuario: { select: { id: true } },
      },
    });

    if (!cliente) return null;

    if (cliente.usuario) {
      return {
        tipo: "usuario-existente" as const,
        href: `/admin/usuarios/${cliente.usuario.id}`,
      };
    }

    const params = new URLSearchParams({
      clienteId: cliente.id,
      nombre: cliente.nombre,
      apellidos: cliente.apellidos,
    });
    if (cliente.email) params.set("email", cliente.email);

    return {
      tipo: "crear-cuenta" as const,
      href: `/admin/autorizar-cuentas/crear?${params.toString()}`,
    };
  } catch (error) {
    console.error("Error en getDestinoPostContrato:", error);
    return null;
  }
}