"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { testimonioSchema } from "@/lib/validators";

export async function getTestimonios() {
  await requireAdmin();

  try {
    return await prisma.testimonio.findMany({
      // Orden ESTABLE por recepción: togglear publicado NUNCA mueve filas
      // (ordenar por actualizadoEn hacía saltar la fila recién toggléeada al tope).
      orderBy: { creadoEn: "asc" },
      take: 50,
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
  await requireAdmin();

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

export async function toggleTestimonioPublicado(id: string) {
  await requireAdmin();

  try {
    const testimonio = await prisma.testimonio.findUnique({
      where: { id },
      select: { publicado: true },
    });
    if (!testimonio) {
      return { success: false, error: { _form: ["Testimonio no encontrado"] } };
    }

    await prisma.testimonio.update({
      where: { id },
      data: { publicado: !testimonio.publicado },
    });
    revalidatePath("/admin/testimonios");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error actualizando publicado de testimonio:", error);
    return { success: false, error: { _form: ["Error al actualizar el testimonio."] } };
  }
}

export async function deleteTestimonio(id: string) {
  await requireAdmin();

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
