"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function getServicios() {
  try {
    return await prisma.servicio.findMany({
      orderBy: { orden: "asc" },
    });
  } catch {
    return [];
  }
}

export async function createServicio(data: {
  titulo: string;
  slug: string;
  descripcion: string;
}) {
  const maxOrden = await prisma.servicio.aggregate({ _max: { orden: true } });
  await prisma.servicio.create({
    data: { ...data, orden: (maxOrden._max.orden ?? 0) + 1 },
  });
  revalidatePath("/admin/servicios");
}

export async function updateServicio(
  id: string,
  data: { titulo?: string; descripcion?: string; activo?: boolean; orden?: number }
) {
  await prisma.servicio.update({ where: { id }, data });
  revalidatePath("/admin/servicios");
}

export async function deleteServicio(id: string) {
  await prisma.servicio.delete({ where: { id } });
  revalidatePath("/admin/servicios");
}
