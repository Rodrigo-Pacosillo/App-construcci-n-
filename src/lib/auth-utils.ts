import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Middleware de autenticación
 * - Redirige al login si no hay sesión
 * - Retorna la sesión si hay sesión
 * - Es un server action helper
 */
export async function requireAuth() {
  const session = await auth();
  if (!session) {
    redirect("/login?callbackUrl=/admin");
  }
  return session;
}

/**
 * Middleware de autorización - solo admin
 * - Lanza error si el usuario NO es admin
 * - Retorna la sesión si es admin
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    throw new Error("No autorizado");
  }
  return session;
}

// Si el usuario está logueado pero el rol no es admin, lanzamos error
export async function requireClienteOrThrow() {
  const session = await auth();
  if (!session || session.user.role !== "cliente") {
    throw new Error("No autorizado");
  }
  return session;
}
