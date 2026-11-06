"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";

const TIPOS_EVENTO = [
  "nota",
  "recordatorio",
  "inicio_etapa",
  "fin_etapa",
  "entrega",
  "reunion",
  "otro",
] as const;

const crearEventoSchema = z.object({
  titulo: z.string().min(1, "El título es obligatorio").max(120),
  descripcion: z.string().max(2000).optional().or(z.literal("")),
  tipo: z.enum(TIPOS_EVENTO),
  fechaInicio: z.string().min(1, "La fecha de inicio es obligatoria"),
  fechaFin: z.string().optional().or(z.literal("")),
  todoElDia: z.boolean().optional(),
  visibleCliente: z.boolean().optional(),
  obraId: z.string().optional().or(z.literal("")),
});

export async function getEventosCalendario() {
  await requireAdmin();
  try {
    const eventos = await prisma.eventoCalendario.findMany({
      include: {
        obra: {
          include: { cliente: true },
        },
      },
      orderBy: { fechaInicio: "asc" },
      take: 200,
    });
    return eventos.map((e) => ({
      id: e.id,
      titulo: e.titulo,
      descripcion: e.descripcion,
      tipo: e.tipo,
      fechaInicio: e.fechaInicio.toISOString(),
      fechaFin: e.fechaFin?.toISOString() ?? null,
      todoElDia: e.todoElDia,
      visibleCliente: e.visibleCliente,
      obraId: e.obraId,
      obraDireccion: e.obra?.direccionObra ?? null,
      clienteNombre: e.obra?.cliente
        ? `${e.obra.cliente.nombre} ${e.obra.cliente.apellidos ?? ""}`.trim()
        : null,
    }));
  } catch (error) {
    console.error("Error en getEventosCalendario:", error);
    return [];
  }
}

export async function getObrasParaCalendario() {
  await requireAdmin();
  try {
    const obras = await prisma.obraActiva.findMany({
      include: { cliente: true },
      orderBy: { fechaInicio: "desc" },
      take: 200,
    });
    return obras.map((o) => ({
      id: o.id,
      direccionObra: o.direccionObra,
      clienteNombre: o.cliente
        ? `${o.cliente.nombre} ${o.cliente.apellidos ?? ""}`.trim()
        : "Sin cliente",
    }));
  } catch (error) {
    console.error("Error en getObrasParaCalendario:", error);
    return [];
  }
}

export async function crearEventoCalendario(formData: FormData) {
  await requireAdmin();
  const session = await (await import("@/lib/auth")).auth();
  const usuarioId = session?.user?.id ?? null;

  const parsed = crearEventoSchema.safeParse({
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion") ?? "",
    tipo: formData.get("tipo"),
    fechaInicio: formData.get("fechaInicio"),
    fechaFin: formData.get("fechaFin") ?? "",
    todoElDia: formData.get("todoElDia") === "on",
    visibleCliente:
      Boolean(formData.get("obraId")) && formData.get("visibleCliente") === "on",
    obraId: formData.get("obraId") ?? "",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;
  const fechaInicio = new Date(data.fechaInicio);
  if (Number.isNaN(fechaInicio.getTime())) {
    return { ok: false, error: "La fecha de inicio no es válida" };
  }
  const fechaFin = data.fechaFin ? new Date(data.fechaFin) : null;
  if (fechaFin && Number.isNaN(fechaFin.getTime())) {
    return { ok: false, error: "La fecha de fin no es válida" };
  }
  if (fechaFin && fechaFin < fechaInicio) {
    return { ok: false, error: "La fecha de fin no puede ser anterior a la de inicio" };
  }

  try {
    await prisma.eventoCalendario.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion || null,
        tipo: data.tipo,
        fechaInicio,
        fechaFin,
        todoElDia: data.todoElDia ?? false,
        visibleCliente: data.visibleCliente ?? false,
        obraId: data.obraId || null,
        creadoPorUsuarioId: usuarioId,
      },
    });
    revalidatePath("/admin/calendario");
    return { ok: true };
  } catch (error) {
    console.error("Error al crear evento:", error);
    return { ok: false, error: "No se pudo crear el evento" };
  }
}

export async function eliminarEventoCalendario(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "ID requerido" };
  try {
    await prisma.eventoCalendario.delete({ where: { id } });
    revalidatePath("/admin/calendario");
    return { ok: true };
  } catch (error) {
    console.error("Error al eliminar evento:", error);
    return { ok: false, error: "No se pudo eliminar el evento" };
  }
}
