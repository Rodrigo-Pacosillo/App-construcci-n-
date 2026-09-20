"use client";

import { useState, useTransition } from "react";
import { toggleTestimonioPublicado, deleteTestimonio } from "@/app/admin/(panel)/testimonios/actions";

type Testimonio = {
  id: string;
  clienteNombre: string;
  texto: string;
  puntaje: number | null;
  publicado: boolean;
};

export function TestimoniosList({ testimonios }: { testimonios: Testimonio[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar este testimonio?")) return;
    startTransition(async () => {
      const res = await deleteTestimonio(id);
      if (res && !res.success) setError("No se pudo eliminar el testimonio.");
    });
  }

  return (
    <div className="rounded border border-border bg-surface">
      {error && (
        <p className="border-b border-border px-4 py-2 text-sm text-red-500">{error}</p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 section-label text-ink/40">Cliente</th>
              <th className="px-4 py-3 section-label text-ink/40">Testimonio</th>
              <th className="px-4 py-3 section-label text-ink/40">Puntaje</th>
              <th className="px-4 py-3 section-label text-ink/40">Publicado</th>
              <th className="px-4 py-3 section-label text-ink/40">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {testimonios.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{t.clienteNombre}</td>
                <td className="max-w-xs px-4 py-3 text-ink/60 line-clamp-2">{t.texto}</td>
                <td className="px-4 py-3 text-accent">{t.puntaje ? "★".repeat(t.puntaje) : "—"}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => startTransition(async () => {
                      const res = await toggleTestimonioPublicado(t.id);
                      if (res && !res.success) setError("No se pudo actualizar el testimonio.");
                    })}
                    disabled={isPending}
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      t.publicado ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {t.publicado ? "Publicado" : "Borrador"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleDelete(t.id)}
                    disabled={isPending}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {testimonios.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink/30">
                  No hay testimonios aun
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
