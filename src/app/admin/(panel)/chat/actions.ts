"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { ejecutarChatAccion } from "@/lib/ai/ejecutar-accion";

export async function getChatAccionesPendientes() {
  await requireAdmin();

  try {
    return await prisma.chatAccion.findMany({
      where: { estado: "pendiente" },
      include: {
        sesion: {
          select: {
            sessionId: true,
            agente: true,
            cotizacionId: true,
            clienteId: true,
            usuarioId: true,
          },
        },
        usuario: {
          select: { id: true, nombre: true, email: true },
        },
      },
      orderBy: { creadoEn: "desc" },
    });
  } catch (error) {
    console.error("Error en getChatAccionesPendientes:", error);
    return [];
  }
}

export async function getChatSesiones() {
  await requireAdmin();

  try {
    return await prisma.chatSesion.findMany({
      include: {
        mensajes: {
          orderBy: { creadoEn: "desc" },
          take: 5,
        },
        cotizacion: {
          select: { id: true, estado: true, cliente: { select: { nombre: true } } },
        },
        usuario: { select: { id: true, nombre: true, email: true, rol: true } },
      },
      orderBy: { ultimoMensajeEn: "desc" },
      take: 50,
    });
  } catch (error) {
    console.error("Error en getChatSesiones:", error);
    return [];
  }
}

const confirmarSchema = z.object({ id: z.string().cuid() });

/**
 * Confirma y EJECUTA de verdad la acción propuesta por el agente admin.
 * Usa el MISMO ejecutor que la API (/api/admin/chat-acciones/[id]/confirmar):
 * src/lib/ai/ejecutar-accion.ts. Marcar "ejecutada" sin ejecutar era el bug C3.
 */
export async function confirmarChatAccion(formData: FormData) {
  const session = await requireAdmin();
  const adminId = session.user.id;

  const raw = { id: formData.get("id") as string };
  const valid = confirmarSchema.safeParse(raw);
  if (!valid.success) {
    return { success: false, error: "ID inválido" };
  }
  const id = valid.data.id;

  const accion = await prisma.chatAccion.findUnique({ where: { id } });
  if (!accion) {
    return { success: false, error: "Acción no encontrada" };
  }
  if (accion.estado !== "pendiente") {
    return { success: false, error: "La acción ya no está pendiente" };
  }

  try {
    // 1. Ejecutar la acción de negocio (valida argumentos con Zod dentro).
    const resultado = await ejecutarChatAccion(
      accion.herramienta,
      accion.argumentos,
      adminId
    );

    // 2. Recién ahora marcar como ejecutada, guardando qué se ejecutó.
    await prisma.chatAccion.update({
      where: { id },
      data: {
        estado: "ejecutada",
        ejecutadoEn: new Date(),
        confirmadaPorUsuarioId: adminId,
        resultado: resultado as unknown as Prisma.InputJsonObject,
      },
    });

    revalidatePath("/admin/chat");
    revalidatePath("/admin");
    revalidatePath("/admin/cotizaciones");
    return { success: true, resultado };
  } catch (error) {
    const mensajeError =
      error instanceof Error ? error.message : "Error desconocido al ejecutar";
    console.error("Error confirmando acción:", error);
    // Trazabilidad: la acción queda "fallida" con el motivo, no "ejecutada" mentirosa.
    try {
      await prisma.chatAccion.update({
        where: { id },
        data: {
          estado: "fallida",
          error: mensajeError,
          confirmadaPorUsuarioId: adminId,
        },
      });
    } catch {
      // si ni eso sale, el log de arriba ya quedó
    }
    return {
      success: false,
      error: `La acción no pudo ejecutarse: ${mensajeError}`,
    };
  }
}

const rechazarSchema = z.object({ id: z.string().cuid() });

export async function rechazarChatAccion(formData: FormData) {
  await requireAdmin();

  const raw = { id: formData.get("id") as string };
  const valid = rechazarSchema.safeParse(raw);
  if (!valid.success) {
    return { success: false, error: "ID inválido" };
  }

  const session = await requireAdmin();
  const adminId = session.user.id;

  try {
    await prisma.chatAccion.update({
      where: { id: valid.data.id },
      data: {
        estado: "rechazada",
        confirmadaPorUsuarioId: adminId,
      },
    });
    revalidatePath("/admin/chat");
    return { success: true };
  } catch (error) {
    console.error("Error rechazando acción:", error);
    return { success: false, error: "No se pudo rechazar la acción" };
  }
}
