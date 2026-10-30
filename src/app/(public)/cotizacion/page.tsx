"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCotizacion } from "./actions";
import {
  TIPO_OBRA_LABELS,
  TIPO_CONSTRUCCION_LABELS,
  RANGO_M2_LABELS,
  PLAZO_INICIO_LABELS,
} from "@/lib/constants";

export default function CotizacionPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await createCotizacion(formData);

      if (result.success && result.data) {
        router.replace(
          `/cotizacion/exito?clienteId=${result.data.clienteId}&cotizacionId=${result.data.cotizacionId}`
        );
      } else {
        setError("Error al enviar el formulario. Por favor inténtelo nuevamente.");
      }
    } catch {
      setError("Error inesperado. Por favor inténtelo nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="py-24 lg:py-32">
      <div className="mx-auto max-w-2xl px-4 lg:px-8">
        <p className="section-label mb-4 text-ink-faint">COTIZACION</p>
        <h1 className="font-heading text-4xl font-bold md:text-5xl">
          Solicite su presupuesto
        </h1>
        <p className="mt-4 text-ink-muted">
          Complete el formulario y nos comunicamos con usted en 24 horas.
        </p>

        <form onSubmit={handleSubmit} className="mt-12 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="nombre" className="section-label block text-ink-faint">
                Nombre(s) <span className="text-accent-strong" aria-hidden="true">*</span>
              </label>
              <input
                id="nombre"
                name="nombre"
                required
                maxLength={100}
                className="mt-1 block w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              />
            </div>
            <div>
              <label htmlFor="apellidos" className="section-label block text-ink-faint">
                Apellidos <span className="text-accent-strong" aria-hidden="true">*</span>
              </label>
              <input
                id="apellidos"
                name="apellidos"
                required
                maxLength={100}
                className="mt-1 block w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="telefono" className="section-label block text-ink-faint">
                Teléfono <span className="text-accent-strong" aria-hidden="true">*</span>
              </label>
              <input
                id="telefono"
                name="telefono"
                required
                maxLength={30}
                className="mt-1 block w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              />
            </div>
            <div>
              <label htmlFor="email" className="section-label block text-ink-faint">
                Email <span className="text-ink-faint">(opcional)</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                maxLength={100}
                placeholder="correo@ejemplo.com"
                className="mt-1 block w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="tipoObra" className="section-label block text-ink-faint">
                Tipo de obra <span className="text-accent-strong" aria-hidden="true">*</span>
              </label>
              <select
                id="tipoObra"
                name="tipoObra"
                required
                className="mt-1 block w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              >
                {Object.entries(TIPO_OBRA_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tipoConstruccion" className="section-label block text-ink-faint">
                Tipo de construcción <span className="text-accent-strong" aria-hidden="true">*</span>
              </label>
              <select
                id="tipoConstruccion"
                name="tipoConstruccion"
                required
                className="mt-1 block w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              >
                {Object.entries(TIPO_CONSTRUCCION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="rangoM2" className="section-label block text-ink-faint">
                Superficie estimada <span className="text-accent-strong" aria-hidden="true">*</span>
              </label>
              <select
                id="rangoM2"
                name="rangoM2"
                required
                className="mt-1 block w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              >
                {Object.entries(RANGO_M2_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="plazoInicio" className="section-label block text-ink-faint">
                Cuándo desea empezar <span className="text-accent-strong" aria-hidden="true">*</span>
              </label>
              <select
                id="plazoInicio"
                name="plazoInicio"
                required
                className="mt-1 block w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              >
                {Object.entries(PLAZO_INICIO_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="ubicacion" className="section-label block text-ink-faint">
              Ubicación de la obra <span className="text-accent-strong" aria-hidden="true">*</span>
            </label>
            <input
              id="ubicacion"
              name="ubicacion"
              required
              placeholder="Barrio, Ciudad (ej. Sopocachi, La Paz)"
              maxLength={200}
              className="mt-1 block w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          <div>
            <label htmlFor="descripcion" className="section-label block text-ink-faint">
              Describa su proyecto <span className="text-ink-faint">(opcional)</span>
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              rows={4}
              maxLength={1000}
              placeholder="Detalles, referencias, necesidades especiales... (opcional)"
              className="mt-1 block w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="accent-btn w-full rounded py-3 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Enviando..." : "Enviar solicitud"}
          </button>
        </form>

        {error && (
          <div className="mt-6 rounded border border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
