"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { register } from "@/app/(public)/registro/actions";

const INPUT_CLASS =
  "mt-1 block w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await register(formData);

    if (!result.success) {
      setError(result.error || "No se pudo crear la cuenta.");
      setLoading(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirect: false,
    });

    setLoading(false);

    if (signInResult?.error) {
      router.push("/login");
      return;
    }

    router.push("/cliente");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="nombre" className="section-label block text-ink/40">
          Nombre y apellido
        </label>
        <input id="nombre" name="nombre" type="text" required className={INPUT_CLASS} />
      </div>

      <div>
        <label htmlFor="whatsapp" className="section-label block text-ink/40">
          WhatsApp
        </label>
        <input
          id="whatsapp"
          name="whatsapp"
          type="tel"
          required
          placeholder="+54 11 ..."
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label htmlFor="email" className="section-label block text-ink/40">
          Email
        </label>
        <input id="email" name="email" type="email" required className={INPUT_CLASS} />
      </div>

      <div>
        <label htmlFor="ciudad" className="section-label block text-ink/40">
          Ciudad (opcional)
        </label>
        <input id="ciudad" name="ciudad" type="text" className={INPUT_CLASS} />
      </div>

      <div>
        <label htmlFor="password" className="section-label block text-ink/40">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="section-label block text-ink/40">
          Repetir contraseña
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          className={INPUT_CLASS}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="accent-btn w-full rounded py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Creando cuenta..." : "Crear cuenta"}
      </button>

      <p className="text-center text-sm text-ink/50">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="text-accent-strong hover:underline">
          Ingresá
        </Link>
      </p>
    </form>
  );
}
