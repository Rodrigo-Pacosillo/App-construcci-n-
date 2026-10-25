"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ESTADO_HERRAMIENTA_LABELS, ESTADO_HERRAMIENTA_COLORES } from "@/app/admin/(panel)/herramientas/actions";

type Herramienta = {
  id: string;
  nombre: string;
  codigo: string;
  estado: string;
  activo: boolean;
};

export function HerramientasList({ herramientas }: { herramientas: Herramienta[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<Record<string, string[] | undefined>>({});
  const [formData, setFormData] = useState({
    nombre: "",
    codigo: "",
    estado: "disponible",
    activo: true,
  });

  function handleChange(field: string, value: string | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error[field]) {
      setError((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function startCreate() {
    setFormData({ nombre: "", codigo: "", estado: "disponible", activo: true });
    setEditingId(null);
    setError({});
    setShowForm(true);
  }

  function startEdit(h: Herramienta) {
    setFormData({ nombre: h.nombre, codigo: h.codigo, estado: h.estado, activo: h.activo });
    setEditingId(h.id);
    setError({});
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setError({});
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const url = editingId ? `/api/admin/herramientas/${editingId}` : `/api/admin/herramientas`;
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        nombre: formData.nombre,
        codigo: formData.codigo,
        estado: formData.estado,
        activo: formData.activo,
      }) });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || { _form: ["Error al guardar"] });
      } else {
        handleCancel();
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-label mb-1 text-ink-faint">HERRAMIENTAS</p>
          <h1 className="font-heading text-3xl font-bold">Gestión de herramientas</h1>
        </div>
        <button onClick={startCreate} className="accent-btn rounded px-4 py-2 text-sm font-medium">Nueva herramienta</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded border border-border bg-surface p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold">{editingId ? "Editar herramienta" : "Nueva herramienta"}</h2>
              <button onClick={handleCancel} className="text-ink-muted hover:text-ink">✕</button>
            </div>

            {error._form && <div className="rounded bg-red-50 border border-red-200 p-4 text-red-700 text-sm">{error._form[0]}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="section-label block text-ink-faint mb-1">Nombre *</label>
                  <input value={formData.nombre} onChange={(e) => handleChange("nombre", e.target.value)} className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent" required />
                  {error.nombre && <p className="text-xs text-red-500 mt-1">{error.nombre[0]}</p>}
                </div>
                <div>
                  <label className="section-label block text-ink-faint mb-1">Código *</label>
                  <input value={formData.codigo} onChange={(e) => handleChange("codigo", e.target.value)} className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent" required />
                  {error.codigo && <p className="text-xs text-red-500 mt-1">{error.codigo[0]}</p>}
                </div>
                <div>
                  <label className="section-label block text-ink-faint mb-1">Estado *</label>
                  <select value={formData.estado} onChange={(e) => handleChange("estado", e.target.value)} className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent" required>
                    <option value="disponible">Disponible</option>
                    <option value="en_uso">En uso</option>
                    <option value="mantenimiento">Mantenimiento</option>
                    <option value="baja">Baja</option>
                  </select>
                  {error.estado && <p className="text-xs text-red-500 mt-1">{error.estado[0]}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="activo" checked={formData.activo} onChange={(e) => handleChange("activo", e.target.checked)} className="h-4 w-4 rounded border-border" />
                  <label htmlFor="activo" className="text-sm text-ink-muted">Activo</label>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button type="submit" disabled={isPending} className="accent-btn rounded px-4 py-2 text-sm font-medium disabled:opacity-50 flex-1">
                  {isPending ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
                </button>
                <button type="button" onClick={handleCancel} className="rounded border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-ink/5 flex-1">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="rounded border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 section-label text-ink-faint">Herramienta</th>
                <th className="px-4 py-3 section-label text-ink-faint">Código</th>
                <th className="px-4 py-3 section-label text-ink-faint">Estado</th>
                <th className="px-4 py-3 section-label text-ink-faint">Activo</th>
                <th className="px-4 py-3 section-label text-ink-faint">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {herramientas.map((h) => (
                <tr key={h.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{h.nombre}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-muted">{h.codigo}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${ESTADO_HERRAMIENTA_COLORES[h.estado]}`}>
                      {ESTADO_HERRAMIENTA_LABELS[h.estado] || h.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${h.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {h.activo ? "Sí" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(h)} className="text-xs text-accent-strong hover:underline">Editar</button>
                      <form action={async () => { await fetch(`/api/admin/herramientas/${h.id}`, { method: "DELETE" }); router.refresh(); }}>
                        <button type="submit" className="text-xs text-red-600 hover:underline">Eliminar</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {herramientas.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-faint">No hay herramientas registradas</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}