import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Ingresar",
  description: "Accedé a tu cuenta para seguir tus cotizaciones y obras.",
  robots: { index: false, follow: false },
};

function safeCallbackUrl(raw?: string): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  return "";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  const session = await auth();
  if (session) {
    redirect(session.user?.role === "admin" ? "/admin" : "/cliente");
  }

  return (
    <div className="flex items-center justify-center px-4 py-24 lg:py-32">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="section-label mb-2 text-ink-faint">MI CUENTA</p>
          <h1 className="font-heading text-3xl font-bold">Ingresar</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Accedé para seguir tus cotizaciones y el avance de tu obra.
          </p>
        </div>

        <LoginForm callbackUrl={safeCallbackUrl(callbackUrl)} />
      </div>
    </div>
  );
}
