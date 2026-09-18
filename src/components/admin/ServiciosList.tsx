"use client";

import { useState, useTransition } from "react";
import { updateServicio, deleteServicio, createServicio } from "@/app/admin/servicios/actions";

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

  function handleToggleActivo(id: string, current: boolean) {
    startTransition(async () => {
      await updateServicio(id, { activo: !current });
    });
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar este servicio?")) return;
    startTransition(async () => {
      await deleteServicio(id);
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await createServicio(form);
      setForm({ titulo: "", slug: "", descripcion: "" });
      setShowForm(false);
    });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="accent-btn rounded px-4 py-2 text-xs font-medium"
        >
          {showForm ? "Cancelar" : "+ Nuevo servicio"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded border border-border bg-surface p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              placeholder="Titulo"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              required
              className="rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <input
              placeholder="slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
              pattern="^[a-z0-9-]+$"
              className="rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <textarea
            placeholder="Descripcion"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
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
                <th className="px-4 py-3 section-label text-ink/40">Orden</th>
                <th className="px-4 py-3 section-label text-ink/40">Titulo</th>
                <th className="px-4 py-3 section-label text-ink/40">Slug</th>
                <th className="px-4 py-3 section-label text-ink/40">Activo</th>
                <th className="px-4 py-3 section-label text-ink/40">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {servicios.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-ink/40">{s.orden}</td>
                  <td className="px-4 py-3 font-medium">{s.titulo}</td>
                  <td className="px-4 py-3 text-ink/40">{s.slug}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActivo(s.id, s.activo)}
                      disabled={isPending}
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        s.activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {s.activo ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
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
                  <td colSpan={5} className="px-4 py-8 text-center text-ink/30">
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
