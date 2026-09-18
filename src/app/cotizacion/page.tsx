"use client";

import { useState } from "react";
import { createCotizacion } from "./actions";

export default function CotizacionPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await createCotizacion(formData);

      if (result.success) {
        setSubmitted(true);
      } else {
        setError("Error al enviar el formulario. Por favor inténtelo nuevamente.");
      }
    } catch (err) {
      setError("Error inesperado. Por favor inténtelo nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="py-24 text-center lg:py-32">
        <div className="mx-auto max-w-md px-4">
          <p className="section-label mb-4 text-accent">MUCHAS GRACIAS</p>
          <h1 className="font-heading text-3xl font-bold">
            Tu solicitud fue enviada
          </h1>
          <p className="mt-4 text-ink/50">
            Te contactamos en menos de 24 horas para coordinar una visita técnica.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-24 lg:py-32">
      <div className="mx-auto max-w-2xl px-4 lg:px-8">
        <p className="section-label mb-4 text-ink/40">COTIZACION</p>
        <h1 className="font-heading text-4xl font-bold md:text-5xl">
          Pedí tu presupuesto
        </h1>
        <p className="mt-4 text-ink/50">
          Completá el formulario y te contactamos en 24 horas.
        </p>

        <form onSubmit={handleSubmit} className="mt-12 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="nombre" className="section-label block text-ink/40">
                Nombre
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
              <label htmlFor="whatsapp" className="section-label block text-ink/40">
                WhatsApp
              </label>
              <input
                id="whatsapp"
                name="whatsapp"
                required
                maxLength={20}
                className="mt-1 block w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="section-label block text-ink/40">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              maxLength={100}
              className="mt-1 block w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="tipoObra" className="section-label block text-ink/40">
                Tipo de obra
              </label>
              <select
                id="tipoObra"
                name="tipoObra"
                className="mt-1 block w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              >
                <option value="vivienda_nueva">Vivienda nueva</option>
                <option value="ampliacion">Ampliacion</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label htmlFor="tipoConstruccion" className="section-label block text-ink/40">
                Tipo de construccion
              </label>
              <select
                id="tipoConstruccion"
                name="tipoConstruccion"
                className="mt-1 block w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              >
                <option value="seco">Steel frame / Seco</option>
                <option value="tradicional">Tradicional</option>
                <option value="no_sabe">No sabe</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="ubicacion" className="section-label block text-ink/40">
              Ubicacion de la obra
            </label>
            <input
              id="ubicacion"
              name="ubicacion"
              placeholder="Barrio, Ciudad"
              maxLength={200}
              className="mt-1 block w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          <div>
            <label htmlFor="descripcion" className="section-label block text-ink/40">
              Cuéntanos sobre tu proyecto
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              rows={4}
              maxLength={1000}
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
        </form>
      </div>
    </div>
  );
}
