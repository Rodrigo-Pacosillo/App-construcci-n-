"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function getProyectos() {
  try {
    return await prisma.proyecto.findMany({
      include: { fotos: true },
      orderBy: { creadoEn: "desc" },
    });
  } catch {
    return [];
  }
}

export async function createProyecto(data: {
  titulo: string;
  slug: string;
  tipoConstruccion: string;
  m2Construidos: number;
  diasEjecucion: number;
  ubicacion: string;
  problemaCliente: string;
  solucion: string;
}) {
  await prisma.proyecto.create({ data: { ...data, publicado: false } as never });
  revalidatePath("/admin/proyectos");
}

export async function updateProyecto(
  id: string,
  data: {
    titulo?: string;
    publicado?: boolean;
    destacado?: boolean;
  }
) {
  await prisma.proyecto.update({ where: { id }, data });
  revalidatePath("/admin/proyectos");
  revalidatePath("/proyectos");
}

export async function deleteProyecto(id: string) {
  await prisma.proyecto.delete({ where: { id } });
  revalidatePath("/admin/proyectos");
}
