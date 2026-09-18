"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { faqSchema } from "@/lib/validators";

export async function getFaqs() {
  await requireAdmin(); // ← Vulnerabilidad #1: verificar que es admin

  try {
    return await prisma.faq.findMany({
      orderBy: { orden: "asc" },
      take: 50, // ← Vulnerabilidad #3: agregar límite
    });
  } catch (error) {
    console.error("Error en getFaqs:", error);
    return [];
  }
}

export async function createFaq(formData: FormData) {
  await requireAdmin(); // ← Vulnerabilidad #1: verificar que es admin

  // Validar datos con Zod
  const data = {
    pregunta: formData.get("pregunta") as string,
    respuesta: formData.get("respuesta") as string,
    orden: parseInt(formData.get("orden") as string, 10) || 0,
    activo: formData.get("activo") === "true",
  };

  const valid = faqSchema.safeParse(data);

  if (!valid.success) {
    return {
      success: false,
      error: valid.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.faq.create({ data: { ...valid.data } });
    revalidatePath("/admin/faqs");
    return { success: true };
  } catch (error) {
    console.error("Error creando FAQ:", error);
    return {
      success: false,
      error: {
        _form: ["Error al crear la FAQ. Intente nuevamente."],
      },
    };
  }
}

export async function updateFaq(
  id: string,
  formData: FormData
) {
  await requireAdmin(); // ← Vulnerabilidad #1: verificar que es admin

  // Validar datos con Zod
  const data = {
    pregunta: formData.get("pregunta") as string,
    respuesta: formData.get("respuesta") as string,
    orden: parseInt(formData.get("orden") as string, 10) || 0,
    activo: formData.get("activo") === "true",
  };

  const valid = faqSchema.safeParse(data);

  if (!valid.success) {
    return {
      success: false,
      error: valid.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.faq.update({ where: { id }, data: { ...valid.data } });
    revalidatePath("/admin/faqs");
    return { success: true };
  } catch (error) {
    console.error("Error actualizando FAQ:", error);
    return {
      success: false,
      error: {
        _form: ["Error al actualizar la FAQ. Intente nuevamente."],
      },
    };
  }
}

export async function deleteFaq(id: string) {
  await requireAdmin(); // ← Vulnerabilidad #1: verificar que es admin

  try {
    await prisma.faq.delete({ where: { id } });
    revalidatePath("/admin/faqs");
    return { success: true };
  } catch (error) {
    console.error("Error eliminando FAQ:", error);
    return {
      success: false,
      error: {
        _form: ["Error al eliminar la FAQ. Intente nuevamente."],
      },
    };
  }
}
