"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { z } from "zod";

const materialSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(100),
  unidad: z.string().min(1, "Unidad requerida").max(50),
  stockActual: z.number().min(0, "Stock actual no puede ser negativo"),
  stockMinimo: z.number().min(0, "Stock mínimo no puede ser negativo"),
  precioUnitario: z.number().positive("Precio debe ser mayor a 0"),
  activo: z.boolean().default(true),
});

type MaterialInput = z.infer<typeof materialSchema>;

export async function getMateriales() {
  await requireAdmin();

  try {
    return await prisma.material.findMany({
      orderBy: { nombre: "asc" },
      take: 100,
    });
  } catch (error) {
    console.error("Error en getMateriales:", error);
    return [];
  }
}

export async function getMaterialById(id: string) {
  await requireAdmin();

  try {
    return await prisma.material.findUnique({
      where: { id },
      include: { usos: { include: { obra: true } } },
    });
  } catch (error) {
    console.error("Error en getMaterialById:", error);
    return null;
  }
}

export async function createMaterial(formData: FormData) {
  await requireAdmin();

  const data = {
    nombre: formData.get("nombre") as string,
    unidad: formData.get("unidad") as string,
    stockActual: parseFloat(formData.get("stockActual") as string),
    stockMinimo: parseFloat(formData.get("stockMinimo") as string),
    precioUnitario: parseFloat(formData.get("precioUnitario") as string),
    activo: formData.get("activo") === "true",
  };

  const parsed = materialSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  try {
    await prisma.material.create({ data: parsed.data });
    revalidatePath("/admin/materiales");
    return { success: true };
  } catch (error) {
    console.error("Error creando material:", error);
    return { success: false, error: { _form: ["Error al crear el material"] } };
  }
}

export async function updateMaterial(id: string, formData: FormData) {
  await requireAdmin();

  const data = {
    nombre: formData.get("nombre") as string,
    unidad: formData.get("unidad") as string,
    stockActual: parseFloat(formData.get("stockActual") as string),
    stockMinimo: parseFloat(formData.get("stockMinimo") as string),
    precioUnitario: parseFloat(formData.get("precioUnitario") as string),
    activo: formData.get("activo") === "true",
  };

  const parsed = materialSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  try {
    await prisma.material.update({ where: { id }, data: parsed.data });
    revalidatePath("/admin/materiales");
    revalidatePath(`/admin/materiales/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Error actualizando material:", error);
    return { success: false, error: { _form: ["Error al actualizar el material"] } };
  }
}

export async function deleteMaterial(id: string) {
  await requireAdmin();

  try {
    await prisma.material.delete({ where: { id } });
    revalidatePath("/admin/materiales");
    return { success: true };
  } catch (error) {
    console.error("Error eliminando material:", error);
    return { success: false, error: { _form: ["Error al eliminar el material"] } };
  }
}