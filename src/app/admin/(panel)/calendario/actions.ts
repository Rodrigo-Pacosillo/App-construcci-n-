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

const eventoBaseSchema = z
  .object({
    titulo: z.string().min(3, "El título es requerido").max(120, "Máximo 120 caracteres"),
    descripcion: z.string().max(1000, "Máximo 1000 caracteres").optional().or(z.literal("")),
    tipo: z.enum(TIPOS_EVENTO).default("nota"),
    fechaInicio: z.string().min(1, "Fecha de inicio inválida"),
    fechaFin: z.string().optional().or(z.literal("")),
    todoElDia: z.boolean().default(true),
    visibleCliente: z.boolean().default(true),
    obraId: z.string().optional().or(z.literal("")),
  })
  .refine(
    (v) => !v.fechaFin || new Date(v.fechaFin) > new Date(v.fechaInicio),
    { message: "La fecha de fin debe ser posterior a la de inicio" }
  );

type EventoBase = z.infer<typeof eventoBaseSchema>;

function datosDesdeForm(formData: FormData) {
  const raw = {
    titulo: (formData.get("titulo") as string) ?? "",
    descripcion: (formData.get("descripcion") as string) || "",
    tipo: (formData.get("tipo") as string) || "nota",
    fechaInicio: (formData.get("fechaInicio") as string) ?? "",
    fechaFin: (formData.get("fechaFin") as string) || "",
    todoElDia: formData.get("todoElDia") === "on" || formData.get("todoElDia") === "true",
    visibleCliente:
      (formData.get("obraId") ? (formData.get("visibleCliente") === "on" || formData.get("visibleCliente") === "true") : false),
    obraId: (formData.get("obraId") as string) || "",
  };
  return eventoBaseSchema.safeParse(raw);
}

function fechaInicioNormalizada(e: EventoBase): Date {
  const d = new Date(e.fechaInicio);
  if (e.todoElDia) d.setUTCHours(12, 0, 0, 0);
  return d;
}

function fechaFinNormalizada(e: EventoBase): Date | null {
  if (!e.fechaFin) return null;
  const d = new Date(e.fechaFin);
  if (e.todoElDia) d.setUTCHours(12, 0, 0, 0);
  return d;
}

export async function getEventosCalendario() {
  await requireAdmin();
  try {
    const eventos = await prisma.eventoCalendario.findMany({
      include: {
        obra: {
          include: {
            cliente: { select: { id: true, nombre: true, apellidos: true } },
          },
        },
        creadoPor: { select: { nombre: true } },
      },
      orderBy: { fechaInicio: "asc" },
      take: 500,
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
      clienteId: e.obra?.cliente?.id ?? null,
      clienteNombre: e.obra
        ? `${e.obra.cliente.nombre} ${e.obra.cliente.apellidos}`
        : null,
      creadoPor: e.creadoPor?.nombre ?? null,
      creadoEn: e.creadoEn.toISOString(),
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
      include: { cliente: { select: { nombre: true, apellidos: true } } },
      orderBy: { fechaInicio: "desc" },
      take: 200,
    });
    return obras.map((o) => ({
      id: o.id,
      direccionObra: o.direccionObra,
      clienteId: o.clienteId,
      clienteNombre: `${o.cliente.nombre} ${o.cliente.apellidos}`,
    }));
  } catch (error) {
    console.error("Error en getObrasParaCalendario:", error);
    return [];
  }
}

export async function crearEventoCalendario(formData: FormData) {
  await requireAdmin();
  const valid = datosDesdeForm(formData);
  if (!valid.success) {
    return { success: false, error: valid.error.flatten().fieldErrors };
  }
  const e = valid.data;
  try {
    if (e.obraId) {
      const obra = await prisma.obraActiva.findUnique({ where: { id: e.obraId }, select: { id: true } });
      if (!obra) return { success: false, error: { _form: ["La obra indicada no existe"] } };
    }
    await prisma.eventoCalendario.create({
      data: {
        titulo: e.titulo,
        descripcion: e.descripcion || null,
        tipo: e.tipo,
        fechaInicio: fechaInicioNormalizada(e),
        fechaFin: fechaFinNormalizada(e),
        todoElDia: e.todoElDia,
        visibleCliente: e.visibleCliente,
        obraId: e.obraId || null,
      },
    });
    revalidatePath("/admin/calendario");
    return { success: true };
  } catch (error) {
    console.error("Error creando evento:", error);
    return { success: false, error: { _form: ["Error al crear el evento. Intente nuevamente."] } };
  }
}

export async function actualizarEventoCalendario(id: string, formData: FormData) {
  await requireAdmin();
  const existente = await prisma.eventoCalendario.findUnique({ where: { id }, select: { id: true } });
  if (!existente) return { success: false, error: { _form: ["Evento no encontrado"] } };
  const valid = datosDesdeForm(formData);
  if (!valid.success) {
    return { success: false, error: valid.error.flatten().fieldErrors };
  }
  const e = valid.data;
  try {
    if (e.obraId) {
      const obra = await prisma.obraActiva.findUnique({ where: { id: e.obraId }, select: { id: true } });
      if (!obra) return { success: false, error: { _form: ["La obra indicada no existe"] } };
    }
    await prisma.eventoCalendario.update({
      where: { id },
      data: {
        titulo: e.titulo,
        descripcion: e.descripcion || null,
        tipo: e.tipo,
        fechaInicio: fechaInicioNormalizada(e),
        fechaFin: fechaFinNormalizada(e),
        todoElDia: e.todoElDia,
        visibleCliente: e.visibleCliente,
        obraId: e.obraId || null,
      },
    });
    revalidatePath("/admin/calendario");
    return { success: true };
  } catch (error) {
    console.error("Error actualizando evento:", error);
    return { success: false, error: { _form: ["Error al actualizar el evento."] } };
  }
}

export async function eliminarEventoCalendario(id: string) {
  await requireAdmin();
  try {
    await prisma.eventoCalendario.delete({ where: { id } });
    revalidatePath("/admin/calendario");
    return { success: true };
  } catch (error) {
    console.error("Error eliminando evento:", error);
    return { success: false, error: { _form: ["Error al eliminar el evento."] } };
  }
}

export async function alternarEventoVisible(id: string, visibleCliente: boolean) {
  await requireAdmin();
  try {
    await prisma.eventoCalendario.update({ where: { id }, data: { visibleCliente } });
    revalidatePath("/admin/calendario");
    return { success: true };
  } catch (error) {
    console.error("Error alternando visibilidad:", error);
    return { success: false, error: { _form: ["Error al actualizar la visibilidad."] } };
  }
}