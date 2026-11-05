"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";

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

export async function confirmarChatAccion(formData: FormData) {
  await requireAdmin();

  const raw = { id: formData.get("id") as string };
  const valid = confirmarSchema.safeParse(raw);
  if (!valid.success) {
    return { success: false, error: "ID inválido" };
  }

  const session = await requireAdmin();
  const adminId = session.user.id;

  try {
    await prisma.chatAccion.update({
      where: { id: valid.data.id },
      data: {
        estado: "ejecutada",
        ejecutadoEn: new Date(),
        confirmadaPorUsuarioId: adminId,
      },
    });
    revalidatePath("/admin/chat");
    return { success: true };
  } catch (error) {
    console.error("Error confirmando acción:", error);
    return { success: false, error: "No se pudo confirmar la acción" };
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
