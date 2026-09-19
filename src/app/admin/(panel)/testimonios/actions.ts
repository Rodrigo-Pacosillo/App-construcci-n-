"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { testimonioSchema } from "@/lib/validators";

export async function getTestimonios() {
  await requireAdmin(); // ← Vulnerabilidad #1: verificar que es admin

  try {
    return await prisma.testimonio.findMany({
      orderBy: { actualizadoEn: "desc" },
      take: 50, // ← Vulnerabilidad #3: agregar límite
    });
  } catch (error) {
    console.error("Error en getTestimonios:", error);
    return [];
  }
}

export async function updateTestimonio(
  id: string,
  formData: FormData
) {
  await requireAdmin(); // ← Vulnerabilidad #1: verificar que es admin

  // Validar datos con Zod
  const data = {
    proyectoId: null as string | null,
    clienteNombre: formData.get("clienteNombre") as string,
    texto: formData.get("texto") as string,
    fotoUrl: formData.get("fotoUrl") as string,
    puntaje: parseInt(formData.get("puntaje") as string, 10) || null,
    autorizaPublicar: formData.get("autorizaPublicar") === "true",
    publicado: formData.get("publicado") === "true",
  };

  const valid = testimonioSchema.safeParse(data);

  if (!valid.success) {
    return {
      success: false,
      error: valid.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.testimonio.update({ where: { id }, data: { ...valid.data } });
    revalidatePath("/admin/testimonios");
    return { success: true };
  } catch (error) {
    console.error("Error actualizando testimonio:", error);
    return {
      success: false,
      error: {
        _form: ["Error al actualizar el testimonio. Intente nuevamente."],
      },
    };
  }
}

export async function deleteTestimonio(id: string) {
  await requireAdmin(); // ← Vulnerabilidad #1: verificar que es admin

  try {
    await prisma.testimonio.delete({ where: { id } });
    revalidatePath("/admin/testimonios");
    return { success: true };
  } catch (error) {
    console.error("Error eliminando testimonio:", error);
    return {
      success: false,
      error: {
        _form: ["Error al eliminar el testimonio. Intente nuevamente."],
      },
    };
  }
}
