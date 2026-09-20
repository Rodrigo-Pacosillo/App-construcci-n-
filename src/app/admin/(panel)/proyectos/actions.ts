"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { proyectoSchema } from "@/lib/validators";

export async function getProyectos() {
  await requireAdmin();

  try {
    return await prisma.proyecto.findMany({
      include: { fotos: true },
      orderBy: { creadoEn: "desc" },
      take: 50,
    });
  } catch (error) {
    console.error("Error en getProyectos:", error);
    return [];
  }
}

export async function createProyecto(formData: FormData) {
  await requireAdmin();

  // Validar datos con Zod
  const data = {
    clienteId: null as string | null,
    slug: formData.get("slug") as string,
    titulo: formData.get("titulo") as string,
    tipoConstruccion: formData.get("tipoConstruccion") as string,
    m2Construidos: parseInt(formData.get("m2Construidos") as string, 10),
    diasEjecucion: parseInt(formData.get("diasEjecucion") as string, 10),
    ubicacion: formData.get("ubicacion") as string,
    problemaCliente: formData.get("problemaCliente") as string,
    solucion: formData.get("solucion") as string,
    destacado: formData.get("destacado") === "true",
    publicado: false,
  };

  const valid = proyectoSchema.safeParse(data);

  if (!valid.success) {
    return {
      success: false,
      error: valid.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.proyecto.create({ data: { ...valid.data } });
    revalidatePath("/admin/proyectos");
    return { success: true };
  } catch (error) {
    console.error("Error creando proyecto:", error);
    return {
      success: false,
      error: {
        _form: ["Error al crear el proyecto. Intente nuevamente."],
      },
    };
  }
}

export async function updateProyecto(id: string, formData: FormData) {
  await requireAdmin();

  // Validar datos con Zod
  const data = {
    clienteId: null as string | null,
    slug: formData.get("slug") as string,
    titulo: formData.get("titulo") as string,
    tipoConstruccion: formData.get("tipoConstruccion") as string,
    m2Construidos: parseInt(formData.get("m2Construidos") as string, 10),
    diasEjecucion: parseInt(formData.get("diasEjecucion") as string, 10),
    ubicacion: formData.get("ubicacion") as string,
    problemaCliente: formData.get("problemaCliente") as string,
    solucion: formData.get("solucion") as string,
    destacado: formData.get("destacado") === "true",
    publicado: formData.get("publicado") === "true",
  };

  const valid = proyectoSchema.safeParse(data);

  if (!valid.success) {
    return {
      success: false,
      error: valid.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.proyecto.update({ where: { id }, data: { ...valid.data } });
    revalidatePath("/admin/proyectos");
    revalidatePath("/proyectos");
    return { success: true };
  } catch (error) {
    console.error("Error actualizando proyecto:", error);
    return {
      success: false,
      error: {
        _form: ["Error al actualizar el proyecto. Intente nuevamente."],
      },
    };
  }
}

export async function toggleProyectoPublicado(id: string) {
  await requireAdmin();

  try {
    const proyecto = await prisma.proyecto.findUnique({
      where: { id },
      select: { publicado: true },
    });
    if (!proyecto) {
      return { success: false, error: { _form: ["Proyecto no encontrado"] } };
    }

    await prisma.proyecto.update({
      where: { id },
      data: { publicado: !proyecto.publicado },
    });
    revalidatePath("/admin/proyectos");
    revalidatePath("/proyectos");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error actualizando publicado de proyecto:", error);
    return { success: false, error: { _form: ["Error al actualizar el proyecto."] } };
  }
}

export async function toggleProyectoDestacado(id: string) {
  await requireAdmin();

  try {
    const proyecto = await prisma.proyecto.findUnique({
      where: { id },
      select: { destacado: true },
    });
    if (!proyecto) {
      return { success: false, error: { _form: ["Proyecto no encontrado"] } };
    }

    await prisma.proyecto.update({
      where: { id },
      data: { destacado: !proyecto.destacado },
    });
    revalidatePath("/admin/proyectos");
    revalidatePath("/proyectos");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error actualizando destacado de proyecto:", error);
    return { success: false, error: { _form: ["Error al actualizar el proyecto."] } };
  }
}

export async function deleteProyecto(id: string) {
  await requireAdmin();

  try {
    await prisma.proyecto.delete({ where: { id } });
    revalidatePath("/admin/proyectos");
    return { success: true };
  } catch (error) {
    console.error("Error eliminando proyecto:", error);
    return {
      success: false,
      error: {
        _form: ["Error al eliminar el proyecto. Intente nuevamente."],
      },
    };
  }
}
