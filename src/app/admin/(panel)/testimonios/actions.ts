"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { testimonioSchema } from "@/lib/validators";
import { uploadFile, deleteFile } from "@/lib/cloudinary";

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

  // Obtener testimonio actual para preservar obraId y foto previa
  const existing = await prisma.testimonio.findUnique({
    where: { id },
    select: { obraId: true, fotoUrl: true, fotoPublicId: true },
  });
  if (!existing) {
    return { success: false, error: { _form: ["Testimonio no encontrado"] } };
  }

  // Validar datos con Zod (fotoUrl se maneja aparte, viene del archivo subido)
  const data = {
    obraId: existing.obraId,
    nombrePublico: formData.get("nombrePublico") as string,
    texto: formData.get("texto") as string,
    puntaje: parseInt(formData.get("puntaje") as string, 10) || null,
    estado: (formData.get("estado") as string) || "pendiente",
    publicado: formData.get("publicado") === "true",
  };

  const valid = testimonioSchema.safeParse(data);

  if (!valid.success) {
    return {
      success: false,
      error: valid.error.flatten().fieldErrors,
    };
  }

  // Subir nueva foto si se envía una.
  let fotoUrl = existing.fotoUrl ?? null;
  let fotoPublicId = existing.fotoPublicId ?? null;
  const fotoFile = formData.get("foto") as File | null;
  if (fotoFile) {
    try {
      const bytes = await fotoFile.arrayBuffer();
      const uploaded = await uploadFile(Buffer.from(bytes), {
        folder: "constr-art/testimonios",
        resourceType: "image",
        filename: fotoFile.name,
      });
      // Borrar la anterior de Cloudinary si existe.
      if (fotoPublicId) {
        await deleteFile(fotoPublicId, "image");
      }
      fotoUrl = uploaded.secureUrl;
      fotoPublicId = uploaded.publicId;
    } catch (error) {
      console.error("Error subiendo foto de testimonio:", error);
      return {
        success: false,
        error: { _form: ["Error al subir la foto del testimonio. Intente nuevamente."] },
      };
    }
  }

  try {
    await prisma.testimonio.update({
      where: { id },
      data: {
        ...valid.data,
        fotoUrl,
        fotoPublicId,
      },
    });
    revalidatePath("/admin/testimonios");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    // Si falla la BD, borrar la foto nueva subida a Cloudinary.
    if (fotoPublicId && fotoPublicId !== existing.fotoPublicId) {
      await deleteFile(fotoPublicId, "image");
    }
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
    const existente = await prisma.testimonio.findUnique({
      where: { id },
      select: { fotoPublicId: true },
    });
    if (!existente) {
      return { success: false, error: { _form: ["Testimonio no encontrado"] } };
    }

    // Borrar foto de Cloudinary si existe.
    if (existente.fotoPublicId) {
      await deleteFile(existente.fotoPublicId, "image");
    }

    await prisma.testimonio.delete({ where: { id } });
    revalidatePath("/admin/testimonios");
    revalidatePath("/");
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
