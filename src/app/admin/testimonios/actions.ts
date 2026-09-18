"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function getTestimonios() {
  try {
    return await prisma.testimonio.findMany({
      orderBy: { actualizadoEn: "desc" },
    });
  } catch {
    return [];
  }
}

export async function updateTestimonio(
  id: string,
  data: {
    publicado?: boolean;
    texto?: string;
  }
) {
  await prisma.testimonio.update({ where: { id }, data });
  revalidatePath("/admin/testimonios");
}

export async function deleteTestimonio(id: string) {
  await prisma.testimonio.delete({ where: { id } });
  revalidatePath("/admin/testimonios");
}
