"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { servicioSchema } from "@/lib/validators";

export async function getServicios() {
  await requireAdmin(); // ← Vulnerabilidad #1: verificar que es admin

  try {
    return await prisma.servicio.findMany({
      orderBy: { orden: "asc" },
    });
  } catch (error) {
    console.error("Error en getServicios:", error);
    return [];
  }
}

export async function createServicio(formData: FormData) {
  await requireAdmin(); // ← Vulnerabilidad #1: verificar que es admin

  // Validar datos con Zod
  const data = {
    slug: formData.get("slug") as string,
    titulo: formData.get("titulo") as string,
    descripcion: formData.get("descripcion") as string,
    orden: parseInt(formData.get("orden") as string, 10) || 0,
    activo: formData.get("activo") === "true",
  };

  const valid = servicioSchema.safeParse(data);

  if (!valid.success) {
    return {
      success: false,
      error: valid.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.servicio.create({ data: { ...valid.data } });
    revalidatePath("/admin/servicios");
    return { success: true };
  } catch (error) {
    console.error("Error creando servicio:", error);
    return {
      success: false,
      error: {
        _form: ["Error al crear el servicio. Intente nuevamente."],
      },
    };
  }
}

export async function updateServicio(
  id: string,
  formData: FormData
) {
  await requireAdmin(); // ← Vulnerabilidad #1: verificar que es admin

  // Validar datos con Zod
  const data = {
    slug: formData.get("slug") as string,
    titulo: formData.get("titulo") as string,
    descripcion: formData.get("descripcion") as string,
    orden: parseInt(formData.get("orden") as string, 10) || 0,
    activo: formData.get("activo") === "true",
  };

  const valid = servicioSchema.safeParse(data);

  if (!valid.success) {
    return {
      success: false,
      error: valid.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.servicio.update({ where: { id }, data: { ...valid.data } });
    revalidatePath("/admin/servicios");
    return { success: true };
  } catch (error) {
    console.error("Error actualizando servicio:", error);
    return {
      success: false,
      error: {
        _form: ["Error al actualizar el servicio. Intente nuevamente."],
      },
    };
  }
}

export async function deleteServicio(id: string) {
  await requireAdmin(); // ← Vulnerabilidad #1: verificar que es admin

  try {
    await prisma.servicio.delete({ where: { id } });
    revalidatePath("/admin/servicios");
    return { success: true };
  } catch (error) {
    console.error("Error eliminando servicio:", error);
    return {
      success: false,
      error: {
        _form: ["Error al eliminar el servicio. Intente nuevamente."],
      },
    };
  }
}
