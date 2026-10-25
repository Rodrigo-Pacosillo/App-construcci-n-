"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import bcrypt from "bcryptjs";
import { z } from "zod";

const crearUsuarioSchema = z.object({
  clienteId: z.string().cuid(),
  email: z.string().email("Email inválido"),
  nombre: z.string().min(1, "Nombre requerido").max(100),
  apellidos: z.string().min(1, "Apellidos requeridos").max(100),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
});

type CreateUsuarioResult =
  | { success: true }
  | { success: false; error: Record<string, string[]> };

async function createUsuarioClienteInternal(
  clienteId: string,
  email: string,
  nombre: string,
  apellidos: string,
  password: string
): Promise<CreateUsuarioResult> {
  // Verificar que el cliente existe y no tiene usuario
  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    include: { usuario: true },
  });

  if (!cliente) {
    return { success: false, error: { _form: ["Cliente no encontrado"] } };
  }

  if (cliente.usuario) {
    return { success: false, error: { _form: ["Este cliente ya tiene una cuenta vinculada"] } };
  }

  // Verificar que el email no esté en uso
  const emailExistente = await prisma.usuario.findUnique({
    where: { email },
  });

  if (emailExistente) {
    return { success: false, error: { email: ["Este email ya está registrado"] } };
  }

  // Hash de contraseña
  const passwordHash = await bcrypt.hash(password, 10);

  // Crear usuario y vincular al cliente
  await prisma.usuario.create({
    data: {
      nombre,
      apellidos,
      email,
      passwordHash,
      rol: "cliente",
      clienteId,
      activo: true,
    },
  });

  revalidatePath("/admin/autorizar-cuentas");
  return { success: true };
}

export async function createUsuarioCliente(formData: FormData): Promise<CreateUsuarioResult> {
  await requireAdmin();

  const rawData = {
    clienteId: formData.get("clienteId") as string,
    email: formData.get("email") as string,
    nombre: formData.get("nombre") as string,
    apellidos: formData.get("apellidos") as string,
    password: formData.get("password") as string,
  };

  const parsed = crearUsuarioSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  return createUsuarioClienteInternal(
    parsed.data.clienteId,
    parsed.data.email,
    parsed.data.nombre,
    parsed.data.apellidos,
    parsed.data.password
  );
}