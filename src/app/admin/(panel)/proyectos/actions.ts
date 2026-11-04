"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { uploadFile, deleteFile } from "@/lib/cloudinary";

/** Solo los campos de texto y URLs; los archivos se procesan aparte (File -> Cloudinary). */
const proyectoTextoSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Slug solo puede contener letras, números y guiones"),
  titulo: z.string().min(1, "El título es requerido"),
  tipoConstruccion: z
    .enum(["tradicional", "seco", "no_sabe", "integral"])
    .optional(),
  ubicacion: z.string().min(1, "La ubicación es requerida"),
  orden: z.coerce.number().int().min(0).default(0),
  destacado: z
    .preprocess((v) => v === true || v === "true" || v === "on", z.boolean())
    .default(false),
  publicado: z
    .preprocess((v) => v === true || v === "true" || v === "on", z.boolean())
    .default(false),
  m2Construidos: z.coerce.number().int().positive().nullable().optional(),
  diasEjecucion: z.coerce.number().int().positive().nullable().optional(),
});

export async function getProyectos() {
  await requireAdmin();

  try {
    return await prisma.proyectoPortafolio.findMany({
      orderBy: { creadoEn: "desc" },
      take: 50,
    });
  } catch (error) {
    console.error("Error en getProyectos:", error);
    return [];
  }
}

async function subirPortada(formData: FormData): Promise<{
  url: string | null;
  publicId: string | null;
}> {
  const file = formData.get("portada") as File | null;
  if (!file) return { url: null, publicId: null };
  try {
    const bytes = await file.arrayBuffer();
    const uploaded = await uploadFile(Buffer.from(bytes), {
      folder: "constr-art/proyectos/portadas",
      resourceType: "image",
      filename: file.name,
    });
    return { url: uploaded.secureUrl, publicId: uploaded.publicId };
  } catch (error) {
    console.error("Error subiendo portada:", error);
    return { url: null, publicId: null };
  }
}

async function subirGaleria(formData: FormData): Promise<{
  urls: string[];
  publicIds: string[];
}> {
  const files = formData.getAll("galeria") as File[];
  if (!files || files.length === 0) return { urls: [], publicIds: [] };

  const urls: string[] = [];
  const publicIds: string[] = [];

  for (const file of files) {
    try {
      const bytes = await file.arrayBuffer();
      const uploaded = await uploadFile(Buffer.from(bytes), {
        folder: "constr-art/proyectos/galeria",
        resourceType: "image",
        filename: file.name,
      });
      urls.push(uploaded.secureUrl);
      publicIds.push(uploaded.publicId);
    } catch (error) {
      console.error("Error subiendo imagen de galería:", error);
    }
  }

  return { urls, publicIds };
}

async function subirVideo(formData: FormData): Promise<{
  url: string | null;
  publicId: string | null;
}> {
  const file = formData.get("video") as File | null;
  if (!file) return { url: null, publicId: null };
  try {
    const bytes = await file.arrayBuffer();
    const uploaded = await uploadFile(Buffer.from(bytes), {
      folder: "constr-art/proyectos/videos",
      resourceType: "video",
      filename: file.name,
    });
    return { url: uploaded.secureUrl, publicId: uploaded.publicId };
  } catch (error) {
    console.error("Error subiendo video:", error);
    return { url: null, publicId: null };
  }
}

export async function createProyecto(formData: FormData) {
  await requireAdmin();

  const data = {
    slug: formData.get("slug") as string,
    titulo: formData.get("titulo") as string,
    tipoConstruccion: formData.get("tipoConstruccion") as string,
    ubicacion: formData.get("ubicacion") as string,
    orden: formData.get("orden") as string,
    destacado: formData.get("destacado") === "true",
    publicado: false,
    m2Construidos: formData.get("m2Construidos") as string,
    diasEjecucion: formData.get("diasEjecucion") as string,
  };

  const valid = proyectoTextoSchema.safeParse(data);

  if (!valid.success) {
    return {
      success: false,
      error: valid.error.flatten().fieldErrors,
    };
  }

  // Subir archivos a Cloudinary
  const [portada, galeria, video] = await Promise.all([
    subirPortada(formData),
    subirGaleria(formData),
    subirVideo(formData),
  ]);

  try {
    await prisma.proyectoPortafolio.create({
      data: {
        slug: valid.data.slug,
        titulo: valid.data.titulo,
        tipoConstruccion: valid.data.tipoConstruccion,
        ubicacion: valid.data.ubicacion,
        orden: valid.data.orden,
        destacado: valid.data.destacado,
        publicado: valid.data.publicado,
        m2Construidos: valid.data.m2Construidos,
        diasEjecucion: valid.data.diasEjecucion,
        portadaUrl: portada.url,
        portadaPublicId: portada.publicId,
        videoUrl: video.url,
        videoPublicId: video.publicId,
        galeriaUrls: galeria.urls,
        galeriaPublicIds: galeria.publicIds,
      },
    });
    revalidatePath("/admin/proyectos");
    revalidatePath("/proyectos");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    // Si falla la BD, borrar lo ya subido a Cloudinary para no dejar basura.
    if (portada.publicId) await deleteFile(portada.publicId, "image");
    if (video.publicId) await deleteFile(video.publicId, "video");
    for (const pid of galeria.publicIds) await deleteFile(pid, "image");

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

  const existing = await prisma.proyectoPortafolio.findUnique({
    where: { id },
    select: {
      portadaUrl: true,
      portadaPublicId: true,
      videoUrl: true,
      videoPublicId: true,
      galeriaUrls: true,
      galeriaPublicIds: true,
    },
  });
  if (!existing) {
    return { success: false, error: { _form: ["Proyecto no encontrado"] } };
  }

  const data = {
    slug: formData.get("slug") as string,
    titulo: formData.get("titulo") as string,
    tipoConstruccion: formData.get("tipoConstruccion") as string,
    ubicacion: formData.get("ubicacion") as string,
    orden: formData.get("orden") as string,
    destacado: formData.get("destacado") === "true",
    publicado: formData.get("publicado") === "true",
    m2Construidos: formData.get("m2Construidos") as string,
    diasEjecucion: formData.get("diasEjecucion") as string,
  };

  const valid = proyectoTextoSchema.safeParse(data);

  if (!valid.success) {
    return {
      success: false,
      error: valid.error.flatten().fieldErrors,
    };
  }

  // Subir nuevos archivos (solo si se envían nuevos).
  const [portada, galeria, video] = await Promise.all([
    subirPortada(formData),
    subirGaleria(formData),
    subirVideo(formData),
  ]);

  // Determinar URLs finales: usar las nuevas si se subieron, si no las existentes.
  const portadaUrl = portada.url ?? existing.portadaUrl ?? null;
  const portadaPublicId = portada.publicId ?? existing.portadaPublicId ?? null;
  const videoUrl = video.url ?? existing.videoUrl ?? null;
  const videoPublicId = video.publicId ?? existing.videoPublicId ?? null;
  const galeriaUrls =
    galeria.urls.length > 0 ? galeria.urls : (existing.galeriaUrls ?? []);
  const galeriaPublicIds =
    galeria.publicIds.length > 0
      ? galeria.publicIds
      : (existing.galeriaPublicIds ?? []);

  // Borrar archivos de Cloudinary que ya no se usan.
  const filesToDelete: Array<{ publicId: string; type: "image" | "video" }> = [];

  if (portada.publicId && existing.portadaPublicId && portada.publicId !== existing.portadaPublicId) {
    filesToDelete.push({ publicId: existing.portadaPublicId, type: "image" });
  }
  if (video.publicId && existing.videoPublicId && video.publicId !== existing.videoPublicId) {
    filesToDelete.push({ publicId: existing.videoPublicId, type: "video" });
  }
  const oldGaleriaIds = (existing.galeriaPublicIds ?? []).filter(
    (pid) => !galeriaPublicIds.includes(pid)
  );
  for (const pid of oldGaleriaIds) {
    filesToDelete.push({ publicId: pid, type: "image" });
  }

  try {
    await prisma.proyectoPortafolio.update({
      where: { id },
      data: {
        slug: valid.data.slug,
        titulo: valid.data.titulo,
        tipoConstruccion: valid.data.tipoConstruccion,
        ubicacion: valid.data.ubicacion,
        orden: valid.data.orden,
        destacado: valid.data.destacado,
        publicado: valid.data.publicado,
        m2Construidos: valid.data.m2Construidos,
        diasEjecucion: valid.data.diasEjecucion,
        portadaUrl,
        portadaPublicId,
        videoUrl,
        videoPublicId,
        galeriaUrls,
        galeriaPublicIds,
      },
    });

    // Borrar archivos viejos de Cloudinary tras actualizar la BD.
    for (const f of filesToDelete) {
      await deleteFile(f.publicId, f.type);
    }

    revalidatePath("/admin/proyectos");
    revalidatePath("/proyectos");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    // Si falla la BD, borrar los nuevos archivos subidos para no dejar basura.
    if (portada.publicId && portada.publicId !== existing.portadaPublicId) {
      await deleteFile(portada.publicId, "image");
    }
    if (video.publicId && video.publicId !== existing.videoPublicId) {
      await deleteFile(video.publicId, "video");
    }
    for (const pid of galeria.publicIds) {
      if (!existing.galeriaPublicIds?.includes(pid)) {
        await deleteFile(pid, "image");
      }
    }

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
    const proyecto = await prisma.proyectoPortafolio.findUnique({
      where: { id },
      select: { publicado: true },
    });
    if (!proyecto) {
      return { success: false, error: { _form: ["Proyecto no encontrado"] } };
    }

    await prisma.proyectoPortafolio.update({
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
    const proyecto = await prisma.proyectoPortafolio.findUnique({
      where: { id },
      select: { destacado: true },
    });
    if (!proyecto) {
      return { success: false, error: { _form: ["Proyecto no encontrado"] } };
    }

    await prisma.proyectoPortafolio.update({
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
    const existente = await prisma.proyectoPortafolio.findUnique({
      where: { id },
      select: {
        portadaPublicId: true,
        videoPublicId: true,
        galeriaPublicIds: true,
      },
    });
    if (!existente) {
      return {
        success: false,
        error: { _form: ["Proyecto no encontrado"] },
      };
    }

    // Borrar archivos de Cloudinary.
    if (existente.portadaPublicId) {
      await deleteFile(existente.portadaPublicId, "image");
    }
    if (existente.videoPublicId) {
      await deleteFile(existente.videoPublicId, "video");
    }
    for (const pid of existente.galeriaPublicIds) {
      await deleteFile(pid, "image");
    }

    await prisma.proyectoPortafolio.delete({ where: { id } });
    revalidatePath("/admin/proyectos");
    revalidatePath("/proyectos");
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
