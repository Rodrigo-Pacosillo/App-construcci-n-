"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { obraSchema, hitoSchema, pagoSchema } from "@/lib/validators";

export async function getObras() {
  await requireAdmin();

  try {
    const obras = await prisma.obraActiva.findMany({
      include: {
        cliente: true,
        contrato: true,
        hitos: { orderBy: { fecha: "asc" } },
        pagos: { orderBy: { fecha: "desc" } },
      },
      orderBy: { fechaInicio: "desc" },
      take: 100,
    });

    return obras.map((o) => ({
      id: o.id,
      clienteId: o.clienteId,
      direccionObra: o.direccionObra,
      estado: o.estado,
      progreso: o.progreso,
      fechaInicio: o.fechaInicio.toISOString(),
      fechaFinEstimada: o.fechaFinEstimada?.toISOString() ?? null,
      cliente: o.cliente
        ? { id: o.cliente.id, nombre: o.cliente.nombre }
        : null,
      contrato: o.contrato
        ? { id: o.contrato.id, montoTotal: Number(o.contrato.montoTotal) }
        : null,
      hitos: o.hitos.map((h) => ({
        id: h.id,
        titulo: h.titulo,
        descripcion: h.descripcion,
        fecha: h.fecha.toISOString(),
        visibleCliente: h.visibleCliente,
      })),
      pagos: o.pagos.map((p) => ({
        id: p.id,
        monto: Number(p.monto),
        fecha: p.fecha.toISOString(),
        concepto: p.concepto,
        estado: p.estado,
      })),
    }));
  } catch (error) {
    console.error("Error en getObras:", error);
    return [];
  }
}

export async function getClientesParaObra() {
  await requireAdmin();

  try {
    const clientes = await prisma.cliente.findMany({
      orderBy: { nombre: "asc" },
      take: 100,
    });

    return clientes.map((c) => ({
      id: c.id,
      nombre: c.nombre,
    }));
  } catch (error) {
    console.error("Error en getClientesParaObra:", error);
    return [];
  }
}

export async function getContratosParaObra() {
  await requireAdmin();

  try {
    const contratos = await prisma.contrato.findMany({
      include: { cliente: true },
      orderBy: { fechaFirma: "desc" },
      take: 100,
    });

    return contratos.map((c) => ({
      id: c.id,
      montoTotal: Number(c.montoTotal),
      clienteNombre: c.cliente.nombre,
    }));
  } catch (error) {
    console.error("Error en getContratosParaObra:", error);
    return [];
  }
}

export async function createObra(formData: FormData) {
  await requireAdmin();

  const data = {
    clienteId: formData.get("clienteId") as string,
    contratoId: (formData.get("contratoId") as string) || undefined,
    direccionObra: formData.get("direccionObra") as string,
    fechaInicio: formData.get("fechaInicio") as string,
    fechaFinEstimada: (formData.get("fechaFinEstimada") as string) || undefined,
    estado: formData.get("estado") as string,
    progreso: Number(formData.get("progreso")) || 0,
  };

  const valid = obraSchema.safeParse(data);

  if (!valid.success) {
    return {
      success: false,
      error: valid.error.flatten().fieldErrors,
    };
  }

  const { contratoId, ...rest } = valid.data;

  try {
    await prisma.obraActiva.create({
      data: {
        ...rest,
        fechaFinEstimada: rest.fechaFinEstimada
          ? new Date(rest.fechaFinEstimada)
          : null,
        contratoId: contratoId || null,
      },
    });
    revalidatePath("/admin/obras");
    return { success: true };
  } catch (error) {
    console.error("Error creando obra:", error);
    return {
      success: false,
      error: {
        _form: ["Error al crear la obra. Intente nuevamente."],
      },
    };
  }
}

export async function updateObra(id: string, formData: FormData) {
  await requireAdmin();

  const data = {
    clienteId: formData.get("clienteId") as string,
    contratoId: (formData.get("contratoId") as string) || undefined,
    direccionObra: formData.get("direccionObra") as string,
    fechaInicio: formData.get("fechaInicio") as string,
    fechaFinEstimada: (formData.get("fechaFinEstimada") as string) || undefined,
    estado: formData.get("estado") as string,
    progreso: Number(formData.get("progreso")) || 0,
  };

  const valid = obraSchema.safeParse(data);

  if (!valid.success) {
    return {
      success: false,
      error: valid.error.flatten().fieldErrors,
    };
  }

  const { contratoId, ...rest } = valid.data;

  try {
    await prisma.obraActiva.update({
      where: { id },
      data: {
        ...rest,
        fechaFinEstimada: rest.fechaFinEstimada
          ? new Date(rest.fechaFinEstimada)
          : null,
        contratoId: contratoId || null,
      },
    });
    revalidatePath("/admin/obras");
    return { success: true };
  } catch (error) {
    console.error("Error actualizando obra:", error);
    return {
      success: false,
      error: {
        _form: ["Error al actualizar la obra. Intente nuevamente."],
      },
    };
  }
}

export async function updateObraEstado(id: string, estado: string) {
  await requireAdmin();

  if (!["en_curso", "pausada", "finalizada", "entregada"].includes(estado)) {
    return { success: false, error: { _form: ["Estado inválido"] } };
  }

  try {
    await prisma.obraActiva.update({
      where: { id },
      data: { estado: estado as "en_curso" | "pausada" | "finalizada" | "entregada" },
    });
    revalidatePath("/admin/obras");
    return { success: true };
  } catch (error) {
    console.error("Error actualizando estado de obra:", error);
    return { success: false, error: { _form: ["Error al actualizar el estado."] } };
  }
}

export async function updateObraProgreso(id: string, progreso: number) {
  await requireAdmin();

  if (Number.isNaN(progreso) || progreso < 0 || progreso > 100) {
    return { success: false, error: { _form: ["Progreso inválido"] } };
  }

  try {
    await prisma.obraActiva.update({
      where: { id },
      data: { progreso },
    });
    revalidatePath("/admin/obras");
    return { success: true };
  } catch (error) {
    console.error("Error actualizando progreso de obra:", error);
    return { success: false, error: { _form: ["Error al actualizar el progreso."] } };
  }
}

export async function deleteObra(id: string) {
  await requireAdmin();

  try {
    await prisma.obraActiva.delete({ where: { id } });
    revalidatePath("/admin/obras");
    return { success: true };
  } catch (error) {
    console.error("Error eliminando obra:", error);
    return {
      success: false,
      error: {
        _form: ["Error al eliminar la obra. Intente nuevamente."],
      },
    };
  }
}

export async function createHito(obraId: string, formData: FormData) {
  await requireAdmin();

  const data = {
    titulo: formData.get("titulo") as string,
    descripcion: formData.get("descripcion") as string,
    fecha: formData.get("fecha") as string,
    visibleCliente: formData.get("visibleCliente") === "true",
  };

  const valid = hitoSchema.safeParse(data);

  if (!valid.success) {
    return {
      success: false,
      error: valid.error.flatten().fieldErrors,
    };
  }

  try {
    const obra = await prisma.obraActiva.findUnique({
      where: { id: obraId },
      select: { id: true },
    });
    if (!obra) {
      return { success: false, error: { _form: ["Obra no encontrada"] } };
    }

    await prisma.hitosObra.create({
      data: { ...valid.data, obraId },
    });
    revalidatePath("/admin/obras");
    return { success: true };
  } catch (error) {
    console.error("Error creando hito:", error);
    return {
      success: false,
      error: {
        _form: ["Error al crear el hito. Intente nuevamente."],
      },
    };
  }
}

export async function toggleHitoVisible(id: string, visibleCliente: boolean) {
  await requireAdmin();

  try {
    await prisma.hitosObra.update({
      where: { id },
      data: { visibleCliente },
    });
    revalidatePath("/admin/obras");
    return { success: true };
  } catch (error) {
    console.error("Error actualizando hito:", error);
    return { success: false, error: { _form: ["Error al actualizar el hito."] } };
  }
}

export async function deleteHito(id: string) {
  await requireAdmin();

  try {
    await prisma.hitosObra.delete({ where: { id } });
    revalidatePath("/admin/obras");
    return { success: true };
  } catch (error) {
    console.error("Error eliminando hito:", error);
    return { success: false, error: { _form: ["Error al eliminar el hito."] } };
  }
}

export async function createPago(obraId: string, formData: FormData) {
  await requireAdmin();

  const data = {
    monto: Number(formData.get("monto")) || 0,
    fecha: formData.get("fecha") as string,
    concepto: formData.get("concepto") as string,
    estado: formData.get("estado") as string,
  };

  const valid = pagoSchema.safeParse(data);

  if (!valid.success) {
    return {
      success: false,
      error: valid.error.flatten().fieldErrors,
    };
  }

  try {
    const obra = await prisma.obraActiva.findUnique({
      where: { id: obraId },
      select: { id: true },
    });
    if (!obra) {
      return { success: false, error: { _form: ["Obra no encontrada"] } };
    }

    await prisma.pagoObra.create({
      data: { ...valid.data, obraId },
    });
    revalidatePath("/admin/obras");
    return { success: true };
  } catch (error) {
    console.error("Error creando pago:", error);
    return {
      success: false,
      error: {
        _form: ["Error al crear el pago. Intente nuevamente."],
      },
    };
  }
}

export async function togglePagoEstado(id: string, estado: string) {
  await requireAdmin();

  if (!["registrado", "confirmado"].includes(estado)) {
    return { success: false, error: { _form: ["Estado inválido"] } };
  }

  try {
    await prisma.pagoObra.update({
      where: { id },
      data: { estado: estado as "registrado" | "confirmado" },
    });
    revalidatePath("/admin/obras");
    return { success: true };
  } catch (error) {
    console.error("Error actualizando pago:", error);
    return { success: false, error: { _form: ["Error al actualizar el pago."] } };
  }
}

export async function deletePago(id: string) {
  await requireAdmin();

  try {
    await prisma.pagoObra.delete({ where: { id } });
    revalidatePath("/admin/obras");
    return { success: true };
  } catch (error) {
    console.error("Error eliminando pago:", error);
    return { success: false, error: { _form: ["Error al eliminar el pago."] } };
  }
}