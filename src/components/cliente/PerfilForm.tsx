"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { cambiarPassword } from "@/app/cliente/perfil/actions";
import { z } from "zod";

const passwordSchema = z
  .object({
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(72, "Máximo 72 caracteres"),
    confirmPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type Tab = "datos" | "password";

type PerfilInicial = {
  nombre: string;
  apellidos: string;
  telefono: string;
  ciudad: string | null;
};

export function PerfilForm({ inicial }: { inicial: PerfilInicial }) {
  const [activeTab, setActiveTab] = useState<Tab>("datos");

  const [password, setPassword] = useState("");
  const [confirmPassword, setPasswordConfirm] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const parsed = passwordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      setError("Datos inválidos");
      return;
    }

    const result = await cambiarPassword(password);
    if (result?.error) {
      const err = result.error;
      if (typeof err === "string") {
        setError(err);
      } else if ("_form" in err && err._form) {
        setError(err._form[0]);
      } else {
        setError("Error al cambiar la contraseña");
      }
      return;
    }

    setSuccess("Contraseña cambiada correctamente");
    setPassword("");
    setPasswordConfirm("");
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-label mb-2 text-ink-faint">PERFIL</p>
          <h1 className="font-heading text-3xl font-bold">Mis datos</h1>
        </div>
        <button
          onClick={handleLogout}
          className="rounded px-4 py-2 text-sm font-medium bg-ink/5 text-ink hover:bg-ink/10"
        >
          Salir
        </button>
      </div>

      <div className="rounded border border-border bg-surface p-6">
        <p className="section-label mb-4 text-ink-faint">DATOS PERSONALES</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="section-label block text-ink-faint">Nombre(s)</label>
            <p className="mt-1 text-ink">{inicial.nombre}</p>
          </div>
          <div>
            <label className="section-label block text-ink-faint">Apellidos</label>
            <p className="mt-1 text-ink">{inicial.apellidos}</p>
          </div>
          <div>
            <label className="section-label block text-ink-faint">Teléfono</label>
            <p className="mt-1 text-ink">{inicial.telefono}</p>
          </div>
          <div>
            <label className="section-label block text-ink-faint">Ciudad</label>
            <p className="mt-1 text-ink">{inicial.ciudad || "—"}</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-ink-muted">
          Para modificar sus datos personales, contacte al administrador por WhatsApp.
        </p>
      </div>

      <div className="rounded border border-border bg-surface p-6">
        <p className="section-label mb-4 text-ink-faint">SEGURIDAD</p>

        <form onSubmit={handleChangePassword} className="space-y-6">
          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <div>
            <label htmlFor="password" className="section-label block text-ink-faint">
              Nueva contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="section-label block text-ink-faint">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="mt-1 block w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <button
            type="submit"
            disabled={!password || !confirmPassword || password !== confirmPassword}
            className="accent-btn w-full rounded py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Cambiar contraseña
          </button>
        </form>
      </div>
    </div>
  );
}