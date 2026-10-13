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

export async function createUsuarioCliente(formData: FormData) {
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
    // En lugar de retornar error, redirigimos con parámetros de error
    const errores = parsed.error.flatten().fieldErrors;
    const params = new URLSearchParams();
    Object.entries(errores).forEach(([key, val]) => {
      if (val) params.append(key, val.join(", "));
    });
    redirect(`/admin/autorizar-cuentas/crear?clienteId=${rawData.clienteId}&error=1&${params.toString()}`);
  }

  const { clienteId, email, nombre, apellidos, password } = parsed.data;

  // Verificar que el cliente existe y no tiene usuario
  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    include: { usuario: true },
  });

  if (!cliente) {
    redirect(`/admin/autorizar-cuentas?error=Cliente no encontrado`);
  }

  if (cliente.usuario) {
    redirect(`/admin/autorizar-cuentas?error=Este cliente ya tiene una cuenta vinculada`);
  }

  // Verificar que el email no esté en uso
  const emailExistente = await prisma.usuario.findUnique({
    where: { email },
  });

  if (emailExistente) {
    redirect(`/admin/autorizar-cuentas/crear?clienteId=${clienteId}&error=Este email ya está registrado`);
  }

  // Hash de contraseña
  const passwordHash = await bcrypt.hash(password, 10);

  try {
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
    redirect("/admin/autorizar-cuentas?success=Cuenta creada correctamente");
  } catch (error) {
    console.error("Error creando usuario:", error);
    redirect(`/admin/autorizar-cuentas/crear?clienteId=${clienteId}&error=Error al crear la cuenta`);
  }
}