"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createUsuarioCliente } from "@/app/admin/autorizar-cuentas/actions";

type ClienteData = {
  id: string;
  nombre: string;
  apellidos: string;
  telefono: string;
  email: string | null;
  ciudad: string | null;
  usuario: { email: string } | null;
};

export default function AdminClienteAutorizarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<Record<string, string[] | undefined>>({});
  const [formData, setFormData] = useState({
    email: "",
    nombre: "",
    apellidos: "",
    password: "",
    confirmPassword: "",
  });
  const [cliente, setCliente] = useState<ClienteData | null>(null);

  async function loadCliente() {
    try {
      const { id } = await params;
      const res = await fetch(`/api/admin/clientes/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCliente(data);
        setFormData({
          email: data.email || "",
          nombre: data.nombre,
          apellidos: data.apellidos,
          password: "",
          confirmPassword: "",
        });
      }
    } catch (e) {
      console.error("Error loading cliente:", e);
    }
  }

  if (typeof window !== "undefined" && !cliente) {
    loadCliente();
  }

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error[field]) setError((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError({ confirmPassword: ["Las contraseñas no coinciden"] });
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
      const res = await createUsuarioCliente(fd);
      if (!res.success) {
        setError(res.error || { _form: ["Error al crear usuario"] });
      } else {
        router.refresh();
      }
    });
  }

  if (!cliente) {
    return <div className="flex items-center justify-center h-64"><div className="animate-pulse text-ink-muted">Cargando...</div></div>;
  }

  if (cliente.usuario) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <p className="section-label mb-1 text-ink-faint">CLIENTES</p>
          <h1 className="font-heading text-3xl font-bold">Autorizar cuenta</h1>
        </div>
        <div className="rounded border border-border bg-surface p-6 text-center">
          <p className="font-heading text-xl font-bold text-green-700">✓ Este cliente ya tiene una cuenta vinculada</p>
          <p className="mt-2 text-ink-muted">Email: {cliente.usuario.email}</p>
          <p className="mt-4 text-sm text-ink-faint">No se puede crear otra cuenta para el mismo cliente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="section-label mb-1 text-ink-faint">CLIENTES</p>
        <h1 className="font-heading text-3xl font-bold">Crear cuenta para {cliente.nombre} {cliente.apellidos}</h1>
      </div>

      <div className="rounded border border-border bg-surface p-4 mb-6">
        <div className="grid gap-2 md:grid-cols-3 text-sm">
          <div>
            <p className="text-ink-faint">Teléfono</p>
            <p>{cliente.telefono}</p>
          </div>
          <div>
            <p className="text-ink-faint">Email</p>
            <p>{cliente.email || "—"}</p>
          </div>
          <div>
            <p className="text-ink-faint">Ciudad</p>
            <p>{cliente.ciudad || "—"}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        {error._form && <div className="rounded bg-red-50 border border-red-200 p-4 text-red-700 text-sm">{error._form[0]}</div>}

        <div>
          <label className="section-label block text-ink-faint mb-1">Email *</label>
          <input type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent" required />
          {error.email && <p className="text-xs text-red-500 mt-1">{error.email[0]}</p>}
        </div>

        <div>
          <label className="section-label block text-ink-faint mb-1">Nombre *</label>
          <input value={formData.nombre} onChange={(e) => handleChange("nombre", e.target.value)} className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent" required />
          {error.nombre && <p className="text-xs text-red-500 mt-1">{error.nombre[0]}</p>}
        </div>

        <div>
          <label className="section-label block text-ink-faint mb-1">Apellidos *</label>
          <input value={formData.apellidos} onChange={(e) => handleChange("apellidos", e.target.value)} className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent" required />
          {error.apellidos && <p className="text-xs text-red-500 mt-1">{error.apellidos[0]}</p>}
        </div>

        <div>
          <label className="section-label block text-ink-faint mb-1">Contraseña * (mín. 8 caracteres)</label>
          <input type="password" value={formData.password} onChange={(e) => handleChange("password", e.target.value)} className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent" required minLength={8} />
          {error.password && <p className="text-xs text-red-500 mt-1">{error.password[0]}</p>}
        </div>

        <div>
          <label className="section-label block text-ink-faint mb-1">Confirmar contraseña *</label>
          <input type="password" value={formData.confirmPassword} onChange={(e) => handleChange("confirmPassword", e.target.value)} className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent" required minLength={8} />
          {error.confirmPassword && <p className="text-xs text-red-500 mt-1">{error.confirmPassword[0]}</p>}
        </div>

        <div className="flex gap-2 pt-4">
          <button type="submit" disabled={isPending} className="accent-btn rounded px-4 py-2 text-sm font-medium disabled:opacity-50 flex-1">
            {isPending ? "Creando..." : "Crear cuenta y vincular"}
          </button>
          <button type="button" onClick={() => router.back()} className="rounded border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-ink/5 flex-1">Cancelar</button>
        </div>
      </form>
    </div>
  );
}