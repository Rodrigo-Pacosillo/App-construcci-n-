import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description:
    "Creá tu cuenta para seguir tus cotizaciones y el avance de tu obra.",
  robots: { index: false, follow: false },
};

export default async function RegistroPage() {
  const session = await auth();
  if (session) {
    redirect(session.user?.role === "admin" ? "/admin" : "/cliente");
  }

  return (
    <div className="flex items-center justify-center px-4 py-24 lg:py-32">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="section-label mb-2 text-ink/40">MI CUENTA</p>
          <h1 className="font-heading text-3xl font-bold">Crear cuenta</h1>
          <p className="mt-2 text-sm text-ink/50">
            Registrate para seguir tus cotizaciones y el avance de tu obra.
          </p>
        </div>

        <RegisterForm />
      </div>
    </div>
  );
}
