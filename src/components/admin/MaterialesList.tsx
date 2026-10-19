"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Material = {
  id: string;
  nombre: string;
  unidad: string;
  stockActual: number;
  stockMinimo: number;
  precioUnitario: number;
  activo: boolean;
};

export function MaterialesList({ materiales }: { materiales: Material[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<Record<string, string[] | undefined>>({});
  const [formData, setFormData] = useState({
    nombre: "",
    unidad: "",
    stockActual: "",
    stockMinimo: "",
    precioUnitario: "",
    activo: true,
  });

  function handleChange(field: string, value: string | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error[field]) {
      setError((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function startCreate() {
    setFormData({ nombre: "", unidad: "", stockActual: "", stockMinimo: "", precioUnitario: "", activo: true });
    setEditingId(null);
    setError({});
    setShowForm(true);
  }

  function startEdit(mat: Material) {
    setFormData({
      nombre: mat.nombre,
      unidad: mat.unidad,
      stockActual: mat.stockActual.toString(),
      stockMinimo: mat.stockMinimo.toString(),
      precioUnitario: mat.precioUnitario.toString(),
      activo: mat.activo,
    });
    setEditingId(mat.id);
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
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => fd.append(k, String(v)));
      const url = editingId ? `/api/admin/materiales/${editingId}` : `/api/admin/materiales`;
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        nombre: formData.nombre,
        unidad: formData.unidad,
        stockActual: parseFloat(formData.stockActual),
        stockMinimo: parseFloat(formData.stockMinimo),
        precioUnitario: parseFloat(formData.precioUnitario),
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
          <p className="section-label mb-1 text-ink-faint">MATERIALES</p>
          <h1 className="font-heading text-3xl font-bold">Gestión de materiales</h1>
        </div>
        <button onClick={startCreate} className="accent-btn rounded px-4 py-2 text-sm font-medium">Nuevo material</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded border border-border bg-surface p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold">{editingId ? "Editar material" : "Nuevo material"}</h2>
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
                  <label className="section-label block text-ink-faint mb-1">Unidad *</label>
                  <input value={formData.unidad} onChange={(e) => handleChange("unidad", e.target.value)} className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent" required />
                  {error.unidad && <p className="text-xs text-red-500 mt-1">{error.unidad[0]}</p>}
                </div>
                <div>
                  <label className="section-label block text-ink-faint mb-1">Stock actual *</label>
                  <input type="number" step="0.01" min="0" value={formData.stockActual} onChange={(e) => handleChange("stockActual", e.target.value)} className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent" required />
                  {error.stockActual && <p className="text-xs text-red-500 mt-1">{error.stockActual[0]}</p>}
                </div>
                <div>
                  <label className="section-label block text-ink-faint mb-1">Stock mínimo *</label>
                  <input type="number" step="0.01" min="0" value={formData.stockMinimo} onChange={(e) => handleChange("stockMinimo", e.target.value)} className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent" required />
                  {error.stockMinimo && <p className="text-xs text-red-500 mt-1">{error.stockMinimo[0]}</p>}
                </div>
                <div>
                  <label className="section-label block text-ink-faint mb-1">Precio unitario *</label>
                  <input type="number" step="0.01" min="0" value={formData.precioUnitario} onChange={(e) => handleChange("precioUnitario", e.target.value)} className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent" required />
                  {error.precioUnitario && <p className="text-xs text-red-500 mt-1">{error.precioUnitario[0]}</p>}
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
                <th className="px-4 py-3 section-label text-ink-faint">Material</th>
                <th className="px-4 py-3 section-label text-ink-faint">Unidad</th>
                <th className="px-4 py-3 section-label text-ink-faint">Stock actual</th>
                <th className="px-4 py-3 section-label text-ink-faint">Stock mínimo</th>
                <th className="px-4 py-3 section-label text-ink-faint">Precio unit.</th>
                <th className="px-4 py-3 section-label text-ink-faint">Estado</th>
                <th className="px-4 py-3 section-label text-ink-faint">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {materiales.map((m) => (
                <tr key={m.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{m.nombre}</td>
                  <td className="px-4 py-3 text-ink-muted">{m.unidad}</td>
                  <td className="px-4 py-3 font-mono">{m.stockActual.toLocaleString("es-AR")}</td>
                  <td className="px-4 py-3 font-mono text-ink-muted">{m.stockMinimo.toLocaleString("es-AR")}</td>
                  <td className="px-4 py-3 font-heading font-bold text-accent-strong">${m.precioUnitario.toLocaleString("es-AR")}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${m.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {m.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(m)} className="text-xs text-accent-strong hover:underline">Editar</button>
                      <form action={async () => { await fetch(`/api/admin/materiales/${m.id}`, { method: "DELETE" }); router.refresh(); }}>
                        <button type="submit" className="text-xs text-red-600 hover:underline">Eliminar</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {materiales.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-ink-faint">No hay materiales registrados</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}