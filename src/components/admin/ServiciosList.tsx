"use client";

import { useState, useTransition } from "react";
import { toggleServicioActivo, deleteServicio, createServicio } from "@/app/admin/(panel)/servicios/actions";

type Servicio = {
  id: string;
  titulo: string;
  slug: string;
  descripcion: string;
  orden: number;
  activo: boolean;
};

export function ServiciosList({ servicios }: { servicios: Servicio[] }) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titulo: "", slug: "", descripcion: "" });
  const [error, setError] = useState("");

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createServicio(formData);
      if (!res.success) {
        setError("No se pudo crear el servicio.");
        return;
      }
      setForm({ titulo: "", slug: "", descripcion: "" });
      setShowForm(false);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar este servicio?")) return;
    startTransition(async () => {
      const res = await deleteServicio(id);
      if (res && !res.success) setError("No se pudo eliminar el servicio.");
    });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="accent-btn rounded px-4 py-2 text-xs font-medium"
        >
          {showForm ? "Cancelar" : "+ Nuevo servicio"}
        </button>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-500">{error}</p>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded border border-border bg-surface p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="titulo"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Titulo"
              required
              className="rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <input
              name="slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="slug"
              required
              pattern="^[a-z0-9-]+$"
              className="rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <input
            name="orden"
            type="hidden"
            value={servicios.length}
            className="rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Descripcion"
            required
            rows={2}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button type="submit" disabled={isPending} className="accent-btn rounded px-4 py-2 text-xs font-medium">
            Crear
          </button>
        </form>
      )}

      <div className="rounded border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 section-label text-ink-faint">Orden</th>
                <th className="px-4 py-3 section-label text-ink-faint">Titulo</th>
                <th className="px-4 py-3 section-label text-ink-faint">Slug</th>
                <th className="px-4 py-3 section-label text-ink-faint">Activo</th>
                <th className="px-4 py-3 section-label text-ink-faint">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {servicios.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-ink-faint">{s.orden}</td>
                  <td className="px-4 py-3 font-medium">{s.titulo}</td>
                  <td className="px-4 py-3 text-ink-faint">{s.slug}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => startTransition(async () => {
                        const res = await toggleServicioActivo(s.id);
                        if (res && !res.success) setError("No se pudo actualizar el servicio.");
                      })}
                      disabled={isPending}
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        s.activo ? "bg-accent text-ink" : "border border-border bg-surface text-ink-faint"
                      }`}
                    >
                      {s.activo ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleDelete(s.id)}
                      disabled={isPending}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {servicios.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-ink-faint">
                    No hay servicios aun
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
