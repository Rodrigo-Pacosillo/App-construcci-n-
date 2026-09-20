"use server";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function updatePerfil({
  nombre,
  whatsapp,
  ciudad,
}: {
  nombre: string;
  whatsapp: string;
  ciudad: string | null;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.user.id },
  });

  if (!usuario) {
    return { error: "Usuario no encontrado" };
  }

  if (usuario.clienteId) {
    const cliente = await prisma.cliente.update({
      where: { id: usuario.clienteId },
      data: {
        nombre,
        whatsapp,
        ciudad: ciudad || null,
      },
    });

    const usuarioActualizado = await prisma.usuario.update({
      where: { id: usuario.id },
      data: { nombre },
    });

    return { success: true, cliente, usuario: usuarioActualizado };
  }

  return { error: "No tenés un cliente asociado" };
}

export async function cambiarPassword(nuevaPassword: string) {
  const session = await auth();
  if (!session) redirect("/login");

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.user.id },
  });

  if (!usuario) {
    return { error: "Usuario no encontrado" };
  }

  if (!usuario.passwordHash) {
    return { error: "No tenés contraseña configurada" };
  }

  const passwordHash = await bcrypt.hash(nuevaPassword, 10);

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { passwordHash },
  });

  return { success: true };
}
