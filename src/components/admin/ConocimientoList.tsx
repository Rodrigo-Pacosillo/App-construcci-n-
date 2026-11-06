"use client";

import { useState, useTransition } from "react";
import {
  createConocimiento,
  updateConocimiento,
  alternarConocimiento,
  deleteConocimiento,
} from "@/app/admin/(panel)/conocimiento/actions";

type Conocimiento = {
  id: string;
  titulo: string;
  categoria: string;
  audiencia: string;
  contenido: string;
  activo: boolean;
};

export function ConocimientoList({
  conocimiento,
}: {
  conocimiento: Conocimiento[];
}) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    titulo: "",
    categoria: "",
    audiencia: "publico",
    contenido: "",
    activo: true,
  });
  const [error, setError] = useState("");

  function resetForm() {
    setForm({
      titulo: "",
      categoria: "",
      audiencia: "publico",
      contenido: "",
      activo: true,
    });
    setEditingId(null);
    setShowForm(false);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = editingId
        ? await updateConocimiento(editingId, formData)
        : await createConocimiento(formData);
      if (!res.success) {
        setError(
          editingId
            ? "No se pudo actualizar el documento."
            : "No se pudo crear el documento."
        );
        return;
      }
      resetForm();
    });
  }

  function handleEdit(c: Conocimiento) {
    setEditingId(c.id);
    setForm({
      titulo: c.titulo,
      categoria: c.categoria,
      audiencia: c.audiencia,
      contenido: c.contenido,
      activo: c.activo,
    });
    setShowForm(true);
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar este documento de conocimiento?")) return;
    startTransition(async () => {
      const res = await deleteConocimiento(id);
      if (res && !res.success) setError("No se pudo eliminar el documento.");
    });
  }

  const CATEGORIAS = [
    "sitio_web",
    "servicios",
    "faq",
    "tecnico",
    "proceso",
    "politica",
    "otro",
  ];
  const AUDIENCIAS = ["publico", "cliente", "admin"];

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          className="accent-btn rounded px-4 py-2 text-xs font-medium"
        >
          {showForm ? "Cancelar" : "+ Nuevo documento"}
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 space-y-3 rounded border border-border bg-surface p-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="titulo"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Título"
              required
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <select
              name="categoria"
              value={form.categoria}
              onChange={(e) =>
                setForm({ ...form, categoria: e.target.value })
              }
              required
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="">Categoría</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              name="audiencia"
              value={form.audiencia}
              onChange={(e) => setForm({ ...form, audiencia: e.target.value })}
              required
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="">Audiencia</option>
              {AUDIENCIAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <input
                name="activo"
                type="checkbox"
                checked={form.activo}
                onChange={(e) =>
                  setForm({ ...form, activo: e.target.checked })
                }
                className="rounded border-border bg-background text-accent-strong focus:ring-accent"
              />
              <label className="text-xs text-ink-muted">Activo</label>
            </div>
          </div>
          <textarea
            name="contenido"
            value={form.contenido}
            onChange={(e) =>
              setForm({ ...form, contenido: e.target.value })
            }
            placeholder="Contenido del documento"
            required
            rows={6}
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
                <th className="px-4 py-3 section-label text-ink-faint">
                  Título
                </th>
                <th className="px-4 py-3 section-label text-ink-faint">
                  Categoría
                </th>
                <th className="px-4 py-3 section-label text-ink-faint">
                  Audiencia
                </th>
                <th className="px-4 py-3 section-label text-ink-faint">
                  Contenido
                </th>
                <th className="px-4 py-3 section-label text-ink-faint">
                  Activo
                </th>
                <th className="px-4 py-3 section-label text-ink-faint">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {conocimiento.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="max-w-xs px-4 py-3 font-medium line-clamp-1">
                    {c.titulo}
                  </td>
                  <td className="px-4 py-3 text-ink-muted text-xs uppercase">
                    {c.categoria}
                  </td>
                  <td className="px-4 py-3 text-ink-muted text-xs uppercase">
                    {c.audiencia}
                  </td>
                  <td className="max-w-md px-4 py-3 text-ink-muted line-clamp-2">
                    {c.contenido}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() =>
                        startTransition(async () => {
                          // Toggle con booleano explícito: no pasa por FormData
                          const res = await alternarConocimiento(
                            c.id,
                            !c.activo
                          );
                          if (res && !res.success)
                            setError("No se pudo actualizar el documento.");
                        })
                      }
                      disabled={isPending}
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        c.activo
                          ? "bg-accent text-ink"
                          : "border border-border bg-surface text-ink-faint"
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
              {conocimiento.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-ink-faint"
                  >
                    No hay documentos de conocimiento aún
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
