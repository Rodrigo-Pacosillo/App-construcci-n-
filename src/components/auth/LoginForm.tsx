"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, getSession } from "next-auth/react";

const INPUT_CLASS =
  "mt-1 block w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const result = await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirect: false,
    });

    if (result?.error) {
      setError("Email o contraseña incorrectos");
      setLoading(false);
      return;
    }

    const session = await getSession();
    const role = session?.user?.role;
    setLoading(false);

    if (role === "admin") {
      router.push(callbackUrl.startsWith("/admin") ? callbackUrl : "/admin");
    } else if (role === "cliente") {
      router.push(callbackUrl.startsWith("/cliente") ? callbackUrl : "/cliente");
    } else {
      router.push("/");
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="section-label block text-ink/40">
          Email
        </label>
        <input id="email" name="email" type="email" required className={INPUT_CLASS} />
      </div>

      <div>
        <label htmlFor="password" className="section-label block text-ink/40">
          Contraseña
        </label>
        <input id="password" name="password" type="password" required className={INPUT_CLASS} />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="accent-btn w-full rounded py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>

      <p className="text-center text-sm text-ink/50">
        ¿No tenés cuenta?{" "}
        <Link href="/registro" className="text-accent hover:underline">
          Creá una
        </Link>
      </p>
    </form>
  );
}
