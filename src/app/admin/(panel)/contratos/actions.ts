"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { z } from "zod";

const contratoSchema = z.object({
  clienteId: z.string().cuid(),
  cotizacionId: z.string().cuid().optional().or(z.literal("")),
  archivoPdfUrl: z.string().url().optional().or(z.literal("")),
  fechaFirma: z.coerce.date({ message: "Fecha inválida" }).optional().or(z.literal("")),
  montoTotal: z.number().positive("El monto debe ser mayor a 0"),
  observaciones: z.string().optional(),
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
    return await prisma.contrato.findUnique({
      where: { id },
      include: {
        cliente: true,
        cotizacion: true,
        obras: true,
      },
    });
  } catch (error) {
    console.error("Error en getContratoById:", error);
    return null;
  }
}

export async function createContrato(formData: FormData) {
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
    const contrato = await prisma.contrato.create({
      data: {
        ...rest,
        cotizacionId: cotizacionId || null,
        fechaFirma: parsed.data.fechaFirma ? new Date(parsed.data.fechaFirma) : null,
      },
    });

    // Si hay cotización vinculada, actualizar estado a "ganado"
    if (cotizacionId) {
      await prisma.cotizacion.update({
        where: { id: cotizacionId },
        data: { estado: "ganado" },
      });
    }

    revalidatePath("/admin/contratos");
    revalidatePath("/admin/cotizaciones");
    return { success: true, data: contrato };
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

export async function getCotizacionesGanadasForSelect() {
  await requireAdmin();
  return prisma.cotizacion.findMany({
    where: { estado: "ganado", contratos: { none: {} } },
    select: { id: true, tipoObra: true, cliente: { select: { nombre: true, apellidos: true } } },
    orderBy: { creadoEn: "desc" },
  });
}