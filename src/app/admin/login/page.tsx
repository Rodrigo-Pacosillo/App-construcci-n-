import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Ingreso",
  robots: { index: false, follow: false },
};

function safeCallbackUrl(raw?: string): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  return "/admin";
}

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-2xl font-bold">ADMIN</h1>
          <p className="mt-1 text-sm text-ink/50">
            Ingresá tus credenciales para acceder
          </p>
        </div>

        <LoginForm callbackUrl={safeCallbackUrl(callbackUrl)} />
      </div>
    </div>
  );
}
