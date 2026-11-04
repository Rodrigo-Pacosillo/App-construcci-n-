"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { uploadFile, deleteFile } from "@/lib/cloudinary";
import { certificacionSchema } from "@/lib/validators";

/** Solo los campos de texto; la imagen se procesa aparte (File -> Cloudinary). */
const textoSchema = z.object({
  titulo: z.string().min(1, "El título es requerido"),
  descripcion: z.string().min(1, "La descripción es requerida"),
});

export async function getCertificaciones() {
  await requireAdmin();

  try {
    return await prisma.certificacion.findMany({
      orderBy: { titulo: "asc" },
      take: 50,
    });
  } catch (error) {
    console.error("Error en getCertificaciones:", error);
    return [];
  }
}

export async function createCertificacion(formData: FormData) {
  await requireAdmin();

  const titulo = formData.get("titulo") as string;
  const descripcion = formData.get("descripcion") as string;
  const imageFile = formData.get("image") as File | null;

  const valid = textoSchema.safeParse({ titulo, descripcion });

  if (!valid.success) {
    return {
      success: false,
      error: valid.error.flatten().fieldErrors,
    };
  }

  let imageUrl: string | null = null;
  let imagePublicId: string | null = null;

  if (imageFile) {
    try {
      const bytes = await imageFile.arrayBuffer();
      const uploaded = await uploadFile(Buffer.from(bytes), {
        folder: "constr-art/certificaciones",
        resourceType: "image",
        filename: imageFile.name,
      });
      imageUrl = uploaded.secureUrl;
      imagePublicId = uploaded.publicId;
    } catch (error) {
      console.error("Error subiendo imagen de certificación:", error);
      return {
        success: false,
        error: { _form: ["Error al subir la imagen. Intente nuevamente."] },
      };
    }
  }

  try {
    await prisma.certificacion.create({
      data: {
        titulo: valid.data.titulo,
        descripcion: valid.data.descripcion,
        imageUrl,
        imagePublicId,
      },
    });
    revalidatePath("/admin/certificaciones");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error creando certificación:", error);
    return {
      success: false,
      error: { _form: ["Error al crear la certificación. Intente nuevamente."] },
    };
  }
}

export async function updateCertificacion(id: string, formData: FormData) {
  await requireAdmin();

  const titulo = formData.get("titulo") as string;
  const descripcion = formData.get("descripcion") as string;
  const imageFile = formData.get("image") as File | null;

  const valid = textoSchema.safeParse({ titulo, descripcion });

  if (!valid.success) {
    return {
      success: false,
      error: valid.error.flatten().fieldErrors,
    };
  }

  const existente = await prisma.certificacion.findUnique({
    where: { id },
    select: { imageUrl: true, imagePublicId: true },
  });
  if (!existente) {
    return {
      success: false,
      error: { _form: ["Certificación no encontrada"] },
    };
  }

  let imageUrl = existente.imageUrl ?? null;
  let imagePublicId = existente.imagePublicId ?? null;

  if (imageFile) {
    try {
      const bytes = await imageFile.arrayBuffer();
      const uploaded = await uploadFile(Buffer.from(bytes), {
        folder: "constr-art/certificaciones",
        resourceType: "image",
        filename: imageFile.name,
      });
      // Borrar la anterior de Cloudinary si existe.
      if (imagePublicId) {
        await deleteFile(imagePublicId, "image");
      }
      imageUrl = uploaded.secureUrl;
      imagePublicId = uploaded.publicId;
    } catch (error) {
      console.error("Error subiendo imagen de certificación:", error);
      return {
        success: false,
        error: { _form: ["Error al subir la imagen. Intente nuevamente."] },
      };
    }
  }

  try {
    await prisma.certificacion.update({
      where: { id },
      data: {
        titulo: valid.data.titulo,
        descripcion: valid.data.descripcion,
        imageUrl,
        imagePublicId,
      },
    });
    revalidatePath("/admin/certificaciones");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error actualizando certificación:", error);
    return {
      success: false,
      error: {
        _form: ["Error al actualizar la certificación. Intente nuevamente."],
      },
    };
  }
}

export async function toggleCertificacionActivo(id: string) {
  await requireAdmin();

  try {
    const certificacion = await prisma.certificacion.findUnique({
      where: { id },
      select: { activo: true },
    });
    if (!certificacion) {
      return {
        success: false,
        error: { _form: ["Certificación no encontrada"] },
      };
    }

    await prisma.certificacion.update({
      where: { id },
      data: { activo: !certificacion.activo },
    });
    revalidatePath("/admin/certificaciones");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error actualizando activo de certificación:", error);
    return {
      success: false,
      error: { _form: ["Error al actualizar la certificación."] },
    };
  }
}

export async function deleteCertificacion(id: string) {
  await requireAdmin();

  try {
    const existente = await prisma.certificacion.findUnique({
      where: { id },
      select: { imagePublicId: true },
    });
    if (!existente) {
      return {
        success: false,
        error: { _form: ["Certificación no encontrada"] },
      };
    }

    // Borrar archivo de Cloudinary si existe.
    if (existente.imagePublicId) {
      await deleteFile(existente.imagePublicId, "image");
    }

    await prisma.certificacion.delete({ where: { id } });
    revalidatePath("/admin/certificaciones");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error eliminando certificación:", error);
    return {
      success: false,
      error: { _form: ["Error al eliminar la certificación. Intente nuevamente."] },
    };
  }
}
