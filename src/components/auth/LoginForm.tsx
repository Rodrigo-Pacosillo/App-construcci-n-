"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";

const INPUT_CLASS =
  "mt-1 block w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    let result;
    try {
      result = await signIn("credentials", {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        redirect: false,
      });
    } catch (err) {
      console.error("signIn error:", err);
      setError("Error de conexión. Intente nuevamente.");
      setLoading(false);
      return;
    }

    if (result?.error) {
      setError("Email o contraseña incorrectos");
      setLoading(false);
      return;
    }

    if (callbackUrl) {
      setLoading(false);
      router.push(callbackUrl);
      router.refresh();
      return;
    }

    const session = await getSession();
    const destination = session?.user?.role === "admin" ? "/admin" : "/cliente";

    setLoading(false);
    router.push(destination);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="section-label block text-ink-faint">
          Email
        </label>
        <input id="email" name="email" type="email" required className={INPUT_CLASS} />
      </div>

      <div>
        <label htmlFor="password" className="section-label block text-ink-faint">
          Contraseña
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            className={`${INPUT_CLASS} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-faint hover:text-ink"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="accent-btn w-full rounded py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Accediendo..." : "Acceder"}
      </button>

      <p className="text-center text-sm text-ink-muted">
        ¿No tiene cuenta? Complete una{" "}
        <a href="/cotizacion" className="text-accent-strong hover:underline">
          cotización
        </a>
        {" y le contactaremos. Si ya firmó un contrato, el administrador le"}
        {" "}
        <br />
        creará su acceso.
      </p>

    </form>
  );
}
