import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Guard de autorización - solo admin
 * - Redirige al login si no hay sesión
 * - Redirige a la home si hay sesión pero el rol no es admin
 * - Retorna la sesión si es admin
 * - Sirve tanto para Server Components como para server actions
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session) {
    redirect("/login?callbackUrl=/admin");
  }
  if (session.user.role !== "admin") {
    redirect("/");
  }
  return session;
}

/**
 * Alias histórico de requireAdmin. Se mantiene para no romper imports
 * en páginas legacy (autorizar-cuentas).
 */
export async function requireAdminPage() {
  return requireAdmin();
}
