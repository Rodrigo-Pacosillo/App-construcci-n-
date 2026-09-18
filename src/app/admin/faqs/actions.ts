"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function getFaqs() {
  try {
    return await prisma.faq.findMany({
      orderBy: { orden: "asc" },
    });
  } catch {
    return [];
  }
}

export async function createFaq(data: {
  pregunta: string;
  respuesta: string;
}) {
  const maxOrden = await prisma.faq.aggregate({ _max: { orden: true } });
  await prisma.faq.create({
    data: { ...data, orden: (maxOrden._max.orden ?? 0) + 1 },
  });
  revalidatePath("/admin/faqs");
}

export async function updateFaq(
  id: string,
  data: { pregunta?: string; respuesta?: string; activo?: boolean }
) {
  await prisma.faq.update({ where: { id }, data });
  revalidatePath("/admin/faqs");
}

export async function deleteFaq(id: string) {
  await prisma.faq.delete({ where: { id } });
  revalidatePath("/admin/faqs");
}
