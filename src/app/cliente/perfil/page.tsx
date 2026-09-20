"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { updatePerfil, cambiarPassword } from "@/app/cliente/perfil/actions";
import { z } from "zod";

const perfilSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres"),
  whatsapp: z.string().min(1, "El WhatsApp es requerido").max(30, "Máximo 30 caracteres"),
  ciudad: z.string().max(100, "Máximo 100 caracteres").optional().or(z.literal("")),
});

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

export default function ClientePerfilPage() {
  const [activeTab, setActiveTab] = useState<Tab>("datos");

  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [ciudad, setCiudad] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setPasswordConfirm] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleUpdatePerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const parsed = perfilSchema.safeParse({ nombre, whatsapp, ciudad });
    if (!parsed.success) {
      setError("Datos inválidos");
      return;
    }

    const result = await updatePerfil({ nombre, whatsapp, ciudad: ciudad || null });
    if (result?.error) {
      setError(result.error);
      return;
    }

    setSuccess("Datos actualizados correctamente");
  };

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
      setError(result.error);
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
          <p className="section-label mb-2 text-ink/40">PERFIL</p>
          <h1 className="font-heading text-3xl font-bold">Mis datos</h1>
        </div>
        <button
          onClick={handleLogout}
          className="rounded px-4 py-2 text-sm font-medium bg-ink/5 text-ink hover:bg-ink/10"
        >
          Salir
        </button>
      </div>

      <div className="flex gap-4 border-b border-border bg-surface p-4">
        {["datos", "password"].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab as Tab);
              setError("");
              setSuccess("");
            }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-ink/5 text-ink"
                : "text-ink/60 hover:bg-ink/5 hover:text-ink"
            }`}
          >
            {tab === "datos" ? "Datos personales" : "Cambiar contraseña"}
          </button>
        ))}
      </div>

      {activeTab === "datos" && (
        <form onSubmit={handleUpdatePerfil} className="space-y-6">
          <div>
            <label htmlFor="nombre" className="section-label block text-ink/40">
              Nombre y apellido
            </label>
            <input
              id="nombre"
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="mt-1 block w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          <div>
            <label htmlFor="whatsapp" className="section-label block text-ink/40">
              WhatsApp
            </label>
            <input
              id="whatsapp"
              type="tel"
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+54 11 ..."
              className="mt-1 block w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          <div>
            <label htmlFor="ciudad" className="section-label block text-ink/40">
              Ciudad (opcional)
            </label>
            <input
              id="ciudad"
              type="text"
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              className="mt-1 block w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <button
            type="submit"
            disabled={!nombre || !whatsapp}
            className="accent-btn w-full rounded py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Guardar cambios
          </button>
        </form>
      )}

      {activeTab === "password" && (
        <form onSubmit={handleChangePassword} className="space-y-6">
          <div>
            <label htmlFor="password" className="section-label block text-ink/40">
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
            <label htmlFor="confirmPassword" className="section-label block text-ink/40">
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
      )}
    </div>
  );
}
