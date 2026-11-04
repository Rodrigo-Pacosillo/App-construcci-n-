"use client";

import { useState, useTransition } from "react";
import { createProyecto } from "./actions";

type FormFields = {
  slug: string;
  titulo: string;
  tipoConstruccion: string;
  ubicacion: string;
  orden: string;
  destacado: boolean;
  m2Construidos: string;
  diasEjecucion: string;
};

const TIPO_OPTIONS: { value: string; label: string }[] = [
  { value: "tradicional", label: "Tradicional" },
  { value: "seco", label: "Steel Frame (seco)" },
  { value: "no_sabe", label: "No sabe / otro" },
  { value: "integral", label: "Integral" },
];

export function ProyectoForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormFields>({
    slug: "",
    titulo: "",
    tipoConstruccion: "tradicional",
    ubicacion: "",
    orden: "0",
    destacado: false,
    m2Construidos: "",
    diasEjecucion: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked as unknown as string) : value,
    }));
  }

  function handleCheckbox(name: string, checked: boolean) {
    setForm((prev) => ({ ...prev, [name]: checked }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const formData = new FormData();
    formData.append("slug", form.slug);
    formData.append("titulo", form.titulo);
    formData.append("tipoConstruccion", form.tipoConstruccion);
    formData.append("ubicacion", form.ubicacion);
    formData.append("orden", form.orden);
    formData.append("destacado", form.destacado ? "true" : "false");
    formData.append("publicado", "false");
    formData.append("m2Construidos", form.m2Construidos);
    formData.append("diasEjecucion", form.diasEjecucion);

    // Archivos
    const portadaInput = document.getElementById(
      "portada"
    ) as HTMLInputElement | null;
    const galeriaInput = document.getElementById(
      "galeria"
    ) as HTMLInputElement | null;
    const videoInput = document.getElementById(
      "video"
    ) as HTMLInputElement | null;

    if (portadaInput?.files?.[0]) formData.append("portada", portadaInput.files[0]);
    if (galeriaInput?.files) {
      for (let i = 0; i < galeriaInput.files.length; i++) {
        formData.append("galeria", galeriaInput.files[i]);
      }
    }
    if (videoInput?.files?.[0]) formData.append("video", videoInput.files[0]);

    startTransition(async () => {
      const res = await createProyecto(formData);
      if (!res.success) {
        const formError = res.error as { _form?: string[] } | undefined;
        setError(
          formError?._form?.join(", ") ||
            "No se pudo crear el proyecto. Intente nuevamente."
        );
        return;
      }
      setForm({
        slug: "",
        titulo: "",
        tipoConstruccion: "tradicional",
        ubicacion: "",
        orden: "0",
        destacado: false,
        m2Construidos: "",
        diasEjecucion: "",
      });
      // Limpiar inputs de archivo
      if (portadaInput) portadaInput.value = "";
      if (galeriaInput) galeriaInput.value = "";
      if (videoInput) videoInput.value = "";
    });
  }

  return (
    <div className="mb-8 rounded border border-border bg-surface p-6">
      <h2 className="mb-4 text-lg font-semibold">Nuevo proyecto</h2>
      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="section-label block mb-1 text-ink-faint">
              Slug
            </label>
            <input
              name="slug"
              value={form.slug}
              onChange={handleChange}
              placeholder="mi-proyecto"
              required
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="section-label block mb-1 text-ink-faint">
              Título
            </label>
            <input
              name="titulo"
              value={form.titulo}
              onChange={handleChange}
              placeholder="Nombre del proyecto"
              required
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="section-label block mb-1 text-ink-faint">
              Tipo de construcción
            </label>
            <select
              name="tipoConstruccion"
              value={form.tipoConstruccion}
              onChange={handleChange}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            >
              {TIPO_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="section-label block mb-1 text-ink-faint">
              Ubicación
            </label>
            <input
              name="ubicacion"
              value={form.ubicacion}
              onChange={handleChange}
              placeholder="Ciudad, dirección"
              required
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="section-label block mb-1 text-ink-faint">
              Portada (imagen)
            </label>
            <input
              type="file"
              id="portada"
              accept="image/*"
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="section-label block mb-1 text-ink-faint">
              Galería (imágenes, varias)
            </label>
            <input
              type="file"
              id="galeria"
              accept="image/*"
              multiple
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="section-label block mb-1 text-ink-faint">
              Video de obra
            </label>
            <input
              type="file"
              id="video"
              accept="video/*"
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="section-label block mb-1 text-ink-faint">
              Orden
            </label>
            <input
              name="orden"
              type="number"
              value={form.orden}
              onChange={handleChange}
              defaultValue="0"
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="section-label block mb-1 text-ink-faint">
              M2 construidos
            </label>
            <input
              name="m2Construidos"
              type="number"
              value={form.m2Construidos}
              onChange={handleChange}
              placeholder="150"
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="section-label block mb-1 text-ink-faint">
              Días ejecución
            </label>
            <input
              name="diasEjecucion"
              type="number"
              value={form.diasEjecucion}
              onChange={handleChange}
              placeholder="90"
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              name="destacado"
              checked={form.destacado}
              onChange={(e) => handleCheckbox("destacado", e.target.checked)}
              className="mt-1"
            />
            <label className="text-sm text-ink-muted">Destacado</label>
          </div>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="accent-btn rounded px-4 py-2 text-sm font-medium"
        >
          {isPending ? "Guardando..." : "Crear proyecto"}
        </button>
      </form>
    </div>
  );
}
