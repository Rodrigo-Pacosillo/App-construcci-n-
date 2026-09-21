"use client";

import { useState, useTransition } from "react";
import {
  createCertificacion,
  toggleCertificacionActivo,
  updateCertificacion,
  deleteCertificacion,
} from "@/app/admin/(panel)/certificaciones/actions";

type Certificacion = {
  id: string;
  titulo: string;
  descripcion: string;
  activo: boolean;
};

export function CertificacionesList({
  certificaciones,
}: {
  certificaciones: Certificacion[];
}) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ titulo: "", descripcion: "" });
  const [error, setError] = useState("");

  function resetForm() {
    setForm({ titulo: "", descripcion: "" });
    setEditingId(null);
    setShowForm(false);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = editingId
        ? await updateCertificacion(editingId, formData)
        : await createCertificacion(formData);
      if (!res.success) {
        setError(
          editingId
            ? "No se pudo actualizar la certificación."
            : "No se pudo crear la certificación."
        );
        return;
      }
      resetForm();
    });
  }

  function handleEdit(c: Certificacion) {
    setEditingId(c.id);
    setForm({ titulo: c.titulo, descripcion: c.descripcion });
    setShowForm(true);
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta certificación?")) return;
    startTransition(async () => {
      const res = await deleteCertificacion(id);
      if (res && !res.success) setError("No se pudo eliminar la certificación.");
    });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          className="accent-btn rounded px-4 py-2 text-xs font-medium"
        >
          {showForm ? "Cancelar" : "+ Nueva certificación"}
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 space-y-3 rounded border border-border bg-surface p-4"
        >
          <input
            name="titulo"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            placeholder="Título"
            required
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={(e) =>
              setForm({ ...form, descripcion: e.target.value })
            }
            placeholder="Descripción"
            required
            rows={3}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={isPending}
            className="accent-btn rounded px-4 py-2 text-xs font-medium"
          >
            {editingId ? "Guardar" : "Crear"}
          </button>
        </form>
      )}

      <div className="rounded border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 section-label text-ink-faint">Título</th>
                <th className="px-4 py-3 section-label text-ink-faint">
                  Descripción
                </th>
                <th className="px-4 py-3 section-label text-ink-faint">Activo</th>
                <th className="px-4 py-3 section-label text-ink-faint">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {certificaciones.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="max-w-xs px-4 py-3 font-medium line-clamp-1">
                    {c.titulo}
                  </td>
                  <td className="max-w-md px-4 py-3 text-ink-muted line-clamp-2">
                    {c.descripcion}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() =>
                        startTransition(async () => {
                          const res = await toggleCertificacionActivo(c.id);
                          if (res && !res.success)
                            setError("No se pudo actualizar la certificación.");
                        })
                      }
                      disabled={isPending}
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        c.activo
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {c.activo ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleEdit(c)}
                      disabled={isPending}
                      className="mr-3 text-xs text-accent-strong hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      disabled={isPending}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {certificaciones.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-ink-faint"
                  >
                    No hay certificaciones aún
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