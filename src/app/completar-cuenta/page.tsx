"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

function CompletarCuentaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(!token ? "Enlace inválido" : null);
  const [validando, setValidando] = useState(!token);
  const [invitacion, setInvitacion] = useState<{ id: string; cliente: { id: string; nombre: string | null; apellidos: string | null; email: string | null; telefono: string | null } } | null>(null);
  const [formData, setFormData] = useState({ email: "", password: "", confirmar: "" });

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`/api/completar-cuenta?token=${token}`);
        const data = await res.json();
        if (data.success) {
          setInvitacion(data.invitacion);
          setFormData((prev) => ({ ...prev, email: data.invitacion.cliente.email || "" }));
        } else {
          setError(data.error || "Enlace inválido o expirado");
        }
      } catch {
        setError("Error al validar el enlace");
      } finally {
        setValidando(false);
      }
    })();
  }, [token]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (formData.password !== formData.confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/completar-cuenta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email: formData.email, password: formData.password }),
        });
        const data = await res.json();
        if (data.success) {
          router.push("/login?completado=1");
        } else {
          setError(data.error || "Error al completar la cuenta");
        }
      } catch {
        setError("Error de conexión");
      }
    });
  }

  if (validando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-ink-muted">Validando enlace...</p>
      </div>
    );
  }

  if (error && !invitacion) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded border border-border bg-surface p-6 text-center">
          <h1 className="font-heading text-xl font-bold">Enlace no válido</h1>
          <p className="mt-2 text-ink-muted">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded border border-border bg-surface p-6">
        <h1 className="font-heading text-2xl font-bold">Completar cuenta</h1>
        <p className="mt-1 text-ink-muted">
          Hola {invitacion?.cliente?.nombre} {invitacion?.cliente?.apellidos}, completá tus datos para acceder al portal.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <div className="rounded bg-red-50 border border-red-200 p-3 text-red-700 text-sm">{error}</div>}
          <div>
            <label className="section-label block text-ink-faint mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
              className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent"
              required
            />
          </div>
          <div>
            <label className="section-label block text-ink-faint mb-1">Contraseña</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
              className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent"
              required
            />
          </div>
          <div>
            <label className="section-label block text-ink-faint mb-1">Confirmar contraseña</label>
            <input
              type="password"
              value={formData.confirmar}
              onChange={(e) => setFormData((p) => ({ ...p, confirmar: e.target.value }))}
              className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent"
              required
            />
          </div>
          <button type="submit" disabled={isPending} className="accent-btn rounded px-4 py-2 text-sm font-medium w-full disabled:opacity-50">
            {isPending ? "Creando cuenta..." : "Crear cuenta y acceder"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CompletarCuentaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-4">Cargando...</div>}>
      <CompletarCuentaContent />
    </Suspense>
  );
}
