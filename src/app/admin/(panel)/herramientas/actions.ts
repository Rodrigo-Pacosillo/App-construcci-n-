"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { z } from "zod";
import { emptyToUndefined } from "@/lib/validators/media";

const herramientaSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(100),
  codigo: emptyToUndefined(z.string().max(50)).optional(),
  estado: z.enum(["disponible", "en_uso", "mantenimiento", "baja"]),
  activo: z.boolean().default(true),
});

type HerramientaInput = z.infer<typeof herramientaSchema>;

export async function getHerramientas() {
  await requireAdmin();

  try {
    return await prisma.herramienta.findMany({
      orderBy: { nombre: "asc" },
      take: 100,
    });
  } catch (error) {
    console.error("Error en getHerramientas:", error);
    return [];
  }
}

export async function getHerramientaById(id: string) {
  await requireAdmin();

  try {
    return await prisma.herramienta.findUnique({
      where: { id },
      include: { prestamos: { include: { obra: true } } },
    });
  } catch (error) {
    console.error("Error en getHerramientaById:", error);
    return null;
  }
}

export async function createHerramienta(formData: FormData) {
  await requireAdmin();

  const data = {
    nombre: formData.get("nombre") as string,
    codigo: formData.get("codigo") as string,
    estado: formData.get("estado") as string,
    activo: formData.get("activo") === "true",
  };

  const parsed = herramientaSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  try {
    await prisma.herramienta.create({ data: parsed.data });
    revalidatePath("/admin/herramientas");
    return { success: true };
  } catch (error) {
    console.error("Error creando herramienta:", error);
    const e = error as { code?: string; meta?: { target?: string[] } };
    if (e.code === "P2002" && e.meta?.target?.includes("codigo")) {
      return { success: false, error: { codigo: ["Este código ya está en uso"] } };
    }
    return { success: false, error: { _form: ["Error al crear la herramienta"] } };
  }
}

export async function updateHerramienta(id: string, formData: FormData) {
  await requireAdmin();

  const data = {
    nombre: formData.get("nombre") as string,
    codigo: formData.get("codigo") as string,
    estado: formData.get("estado") as string,
    activo: formData.get("activo") === "true",
  };

  const parsed = herramientaSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  try {
    await prisma.herramienta.update({ where: { id }, data: parsed.data });
    revalidatePath("/admin/herramientas");
    revalidatePath(`/admin/herramientas/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Error actualizando herramienta:", error);
    const e = error as { code?: string; meta?: { target?: string[] } };
    if (e.code === "P2002" && e.meta?.target?.includes("codigo")) {
      return { success: false, error: { codigo: ["Este código ya está en uso"] } };
    }
    return { success: false, error: { _form: ["Error al actualizar la herramienta"] } };
  }
}

export async function deleteHerramienta(id: string) {
  await requireAdmin();

  try {
    await prisma.herramienta.delete({ where: { id } });
    revalidatePath("/admin/herramientas");
    return { success: true };
  } catch (error) {
    console.error("Error eliminando herramienta:", error);
    return { success: false, error: { _form: ["Error al eliminar la herramienta"] } };
  }
}

export const ESTADO_HERRAMIENTA_LABELS: Record<string, string> = {
  disponible: "Disponible",
  en_uso: "En uso",
  mantenimiento: "Mantenimiento",
  baja: "Baja",
};

export const ESTADO_HERRAMIENTA_COLORES: Record<string, string> = {
  disponible: "bg-green-100 text-green-800",
  en_uso: "bg-blue-100 text-blue-800",
  mantenimiento: "bg-yellow-100 text-yellow-800",
  baja: "bg-red-100 text-red-800",
};