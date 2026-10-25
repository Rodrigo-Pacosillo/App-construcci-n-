"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createEmpleado, getEmpleados, CARGO_LABELS } from "@/app/admin/(panel)/empleados/actions";

type Empleado = {
  id: string;
  nombre: string;
  apellidos: string;
  ci: string;
  telefono: string;
  cargo: string;
  fechaIngreso: Date;
  salario: number | null;
  activo: boolean;
};

export function EmpleadosList({ empleados }: { empleados: Empleado[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<Record<string, string[] | undefined>>({});
  const [formData, setFormData] = useState({
    nombre: "",
    apellidos: "",
    ci: "",
    telefono: "",
    cargo: "albanil",
    fechaIngreso: "",
    salario: "",
    activo: true,
  });

  function handleChange(field: string, value: string | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error[field]) {
      setError((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function startCreate() {
    setFormData({
      nombre: "",
      apellidos: "",
      ci: "",
      telefono: "",
      cargo: "albanil",
      fechaIngreso: new Date().toISOString().split("T")[0],
      salario: "",
      activo: true,
    });
    setEditingId(null);
    setError({});
    setShowForm(true);
  }

  function startEdit(emp: Empleado) {
    setFormData({
      nombre: emp.nombre,
      apellidos: emp.apellidos,
      ci: emp.ci,
      telefono: emp.telefono,
      cargo: emp.cargo,
      fechaIngreso: new Date(emp.fechaIngreso).toISOString().split("T")[0],
      salario: emp.salario?.toString() || "",
      activo: emp.activo,
    });
    setEditingId(emp.id);
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
      let res;
      if (editingId) {
        const response = await fetch(`/api/admin/empleados/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: formData.nombre,
            apellidos: formData.apellidos,
            ci: formData.ci,
            telefono: formData.telefono,
            cargo: formData.cargo,
            fechaIngreso: formData.fechaIngreso,
            salario: formData.salario ? parseFloat(formData.salario) : null,
            activo: formData.activo,
          }),
        });
        res = await response.json();
      } else {
        res = await createEmpleado(fd);
      }

      if (!res.success) {
        setError(res.error || { _form: ["Error al guardar"] });
      } else {
        handleCancel();
        router.refresh();
      }
    });
  }

  // Note: We need an API route for update. Let's use the server action directly for create
  // and create an API route for update. For now, let's just use a combined approach.
  // Actually, let me create the API route separately. For now, I'll just do the create.

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-label mb-1 text-ink-faint">EMPLEADOS</p>
          <h1 className="font-heading text-3xl font-bold">Gestión de empleados</h1>
        </div>
        <button onClick={startCreate} className="accent-btn rounded px-4 py-2 text-sm font-medium">
          Nuevo empleado
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded border border-border bg-surface p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold">{editingId ? "Editar empleado" : "Nuevo empleado"}</h2>
              <button onClick={handleCancel} className="text-ink-muted hover:text-ink">✕</button>
            </div>

            {error._form && (
              <div className="rounded bg-red-50 border border-red-200 p-4 text-red-700 text-sm">{error._form[0]}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
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
                  <label className="section-label block text-ink-faint mb-1">CI *</label>
                  <input value={formData.ci} onChange={(e) => handleChange("ci", e.target.value)} className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent" required />
                  {error.ci && <p className="text-xs text-red-500 mt-1">{error.ci[0]}</p>}
                </div>
                <div>
                  <label className="section-label block text-ink-faint mb-1">Teléfono *</label>
                  <input value={formData.telefono} onChange={(e) => handleChange("telefono", e.target.value)} className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent" required />
                  {error.telefono && <p className="text-xs text-red-500 mt-1">{error.telefono[0]}</p>}
                </div>
                <div>
                  <label className="section-label block text-ink-faint mb-1">Cargo *</label>
                  <select value={formData.cargo} onChange={(e) => handleChange("cargo", e.target.value)} className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent" required>
                    <option value="ingeniero">Ingeniero</option>
                    <option value="arquitecto">Arquitecto</option>
                    <option value="maestro_obra">Maestro de obra</option>
                    <option value="albanil">Albañil</option>
                    <option value="electricista">Electricista</option>
                    <option value="plomero">Plomero</option>
                    <option value="ayudante">Ayudante</option>
                    <option value="administrativo">Administrativo</option>
                  </select>
                  {error.cargo && <p className="text-xs text-red-500 mt-1">{error.cargo[0]}</p>}
                </div>
                <div>
                  <label className="section-label block text-ink-faint mb-1">Fecha ingreso *</label>
                  <input type="date" value={formData.fechaIngreso} onChange={(e) => handleChange("fechaIngreso", e.target.value)} className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent" required />
                  {error.fechaIngreso && <p className="text-xs text-red-500 mt-1">{error.fechaIngreso[0]}</p>}
                </div>
                <div>
                  <label className="section-label block text-ink-faint mb-1">Salario</label>
                  <input type="number" step="0.01" min="0" value={formData.salario} onChange={(e) => handleChange("salario", e.target.value)} className="rounded border border-border bg-surface w-full px-3 py-2 text-sm outline-none focus:border-accent" />
                  {error.salario && <p className="text-xs text-red-500 mt-1">{error.salario[0]}</p>}
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
                <button type="button" onClick={handleCancel} className="rounded border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-ink/5 flex-1">
                  Cancelar
                </button>
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
                <th className="px-4 py-3 section-label text-ink-faint">Nombre</th>
                <th className="px-4 py-3 section-label text-ink-faint">CI</th>
                <th className="px-4 py-3 section-label text-ink-faint">Cargo</th>
                <th className="px-4 py-3 section-label text-ink-faint">Teléfono</th>
                <th className="px-4 py-3 section-label text-ink-faint">Ingreso</th>
                <th className="px-4 py-3 section-label text-ink-faint">Salario</th>
                <th className="px-4 py-3 section-label text-ink-faint">Estado</th>
                <th className="px-4 py-3 section-label text-ink-faint">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {empleados.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{e.nombre} {e.apellidos}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-muted">{e.ci}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded bg-ink/5 px-2 py-1 text-xs font-medium text-ink-muted">
                      {CARGO_LABELS[e.cargo] || e.cargo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{e.telefono}</td>
                  <td className="px-4 py-3 text-ink-muted">{new Date(e.fechaIngreso).toLocaleDateString("es-AR")}</td>
                  <td className="px-4 py-3 text-ink-muted">{e.salario ? `$${e.salario.toLocaleString("es-AR")}` : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${e.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {e.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(e)} className="text-xs text-accent-strong hover:underline">Editar</button>
                      <form action={async () => { await fetch(`/api/admin/empleados/${e.id}`, { method: "DELETE" }); router.refresh(); }}>
                        <button type="submit" className="text-xs text-red-600 hover:underline">Eliminar</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {empleados.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-ink-faint">No hay empleados registrados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}