"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";

const passwordSchema = z.object({
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(72, "Máximo 72 caracteres"),
});

export async function cambiarPassword(password: string) {
  const session = await auth();
  if (!session || session.user.role !== "cliente") {
    return { error: "No autorizado" };
  }

  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    await prisma.usuario.update({
      where: { id: session.user.id },
      data: { passwordHash },
    });
    revalidatePath("/cliente/perfil");
    return { success: true };
  } catch (error) {
    console.error("Error cambiando contraseña:", error);
    return { error: { _form: ["Error al cambiar la contraseña"] } };
  }
}