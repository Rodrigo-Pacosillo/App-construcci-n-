"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { registroSchema } from "@/lib/validators";

export async function register(formData: FormData) {
  const parsed = registroSchema.safeParse({
    nombre: formData.get("nombre"),
    whatsapp: formData.get("whatsapp"),
    email: formData.get("email"),
    ciudad: formData.get("ciudad"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message;
    return {
      success: false,
      error: first || "Datos inválidos. Revisá el formulario.",
    };
  }

  const { nombre, whatsapp, email, ciudad, password } = parsed.data;

  const existing = await prisma.usuario.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    return {
      success: false,
      error: "Ya existe una cuenta con ese email.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await prisma.$transaction(async (tx) => {
      // Reusar el lead existente: si esta persona ya cotizó como visitante,
      // hay un `cliente` con su email. Crear otro duplicaría el lead y
      // dejaría sus cotizaciones anteriores sin vínculo con la cuenta.
      const clienteExistente = email
        ? await tx.cliente.findUnique({ where: { email } })
        : null;

      const cliente =
        clienteExistente ??
        (await tx.cliente.create({
          data: {
            nombre,
            whatsapp,
            email,
            ciudad: ciudad || null,
          },
        }));

      await tx.usuario.create({
        data: {
          nombre,
          email,
          passwordHash,
          rol: "cliente",
          clienteId: cliente.id,
        },
      });
    });
  } catch {
    return {
      success: false,
      error: "No se pudo crear la cuenta. Intentá de nuevo.",
    };
  }

  return { success: true };
}
