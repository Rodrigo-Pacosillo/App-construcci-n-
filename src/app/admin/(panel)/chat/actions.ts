"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { ejecutarChatAccion } from "@/lib/ai/acciones/ejecutar";

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
 * Usa el ejecutor unificado (BAD executor) que carga, valida, claima y ejecuta.
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

  // El BAD executor ya carga, valida, claima, ejecuta y actualiza.
  const result = await ejecutarChatAccion({
    accionId: id,
    actor: { usuarioId: adminId, rol: "admin" },
  });

  if (!result.ok) {
    return { success: false, error: result.mensaje };
  }

  revalidatePath("/admin/chat");
  revalidatePath("/admin");
  revalidatePath("/admin/cotizaciones");
  return { success: true, resultado: result };
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
