"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { certificacionSchema } from "@/lib/validators";

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

  const data = {
    titulo: formData.get("titulo") as string,
    descripcion: formData.get("descripcion") as string,
    activo: formData.get("activo") === "true",
  };

  const valid = certificacionSchema.safeParse(data);

  if (!valid.success) {
    return {
      success: false,
      error: valid.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.certificacion.create({ data: { ...valid.data } });
    revalidatePath("/admin/certificaciones");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error creando certificación:", error);
    return {
      success: false,
      error: {
        _form: ["Error al crear la certificación. Intente nuevamente."],
      },
    };
  }
}

export async function updateCertificacion(id: string, formData: FormData) {
  await requireAdmin();

  const data = {
    titulo: formData.get("titulo") as string,
    descripcion: formData.get("descripcion") as string,
    activo: formData.get("activo") === "true",
  };

  const valid = certificacionSchema.safeParse(data);

  if (!valid.success) {
    return {
      success: false,
      error: valid.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.certificacion.update({
      where: { id },
      data: { ...valid.data },
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
    await prisma.certificacion.delete({ where: { id } });
    revalidatePath("/admin/certificaciones");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error eliminando certificación:", error);
    return {
      success: false,
      error: {
        _form: ["Error al eliminar la certificación. Intente nuevamente."],
      },
    };
  }
}