"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { conocimientoSchema } from "@/lib/validators/chat";

export async function getConocimiento() {
  await requireAdmin();

  try {
    return await prisma.conocimiento.findMany({
      orderBy: [{ categoria: "asc" }, { audiencia: "asc" }, { titulo: "asc" }],
      take: 100,
    });
  } catch (error) {
    console.error("Error en getConocimiento:", error);
    return [];
  }
}

export async function createConocimiento(formData: FormData) {
  await requireAdmin();

  const raw = {
    titulo: formData.get("titulo") as string,
    categoria: formData.get("categoria") as string,
    audiencia: formData.get("audiencia") as string,
    contenido: formData.get("contenido") as string,
    activo: formData.get("activo") === "true",
  };

  const valid = conocimientoSchema.safeParse(raw);
  if (!valid.success) {
    return {
      success: false,
      error: valid.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.conocimiento.create({ data: valid.data });
    revalidatePath("/admin/conocimiento");
    return { success: true };
  } catch (error) {
    console.error("Error creando conocimiento:", error);
    return {
      success: false,
      error: { _form: ["No se pudo crear el documento de conocimiento."] },
    };
  }
}

export async function updateConocimiento(id: string, formData: FormData) {
  await requireAdmin();

  const raw = {
    titulo: formData.get("titulo") as string,
    categoria: formData.get("categoria") as string,
    audiencia: formData.get("audiencia") as string,
    contenido: formData.get("contenido") as string,
    activo: formData.get("activo") === "true",
  };

  const valid = conocimientoSchema.safeParse(raw);
  if (!valid.success) {
    return {
      success: false,
      error: valid.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.conocimiento.update({
      where: { id },
      data: valid.data,
    });
    revalidatePath("/admin/conocimiento");
    return { success: true };
  } catch (error) {
    console.error("Error actualizando conocimiento:", error);
    return {
      success: false,
      error: { _form: ["No se pudo actualizar el documento de conocimiento."] },
    };
  }
}

export async function deleteConocimiento(id: string) {
  await requireAdmin();

  try {
    await prisma.conocimiento.delete({ where: { id } });
    revalidatePath("/admin/conocimiento");
    return { success: true };
  } catch (error) {
    console.error("Error eliminando conocimiento:", error);
    return {
      success: false,
      error: { _form: ["No se pudo eliminar el documento de conocimiento."] },
    };
  }
}
