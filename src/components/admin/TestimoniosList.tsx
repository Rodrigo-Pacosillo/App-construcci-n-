"use client";

import { useMemo, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import {
  toggleTestimonioPublicado,
  deleteTestimonio,
} from "@/app/admin/(panel)/testimonios/actions";

type Testimonio = {
  id: string;
  clienteNombre: string;
  texto: string;
  fotoUrl: string | null;
  puntaje: number | null;
  publicado: boolean;
};

const PUNTAJES = [5, 4, 3, 2, 1];

export function TestimoniosList({ testimonios }: { testimonios: Testimonio[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [puntajeFiltro, setPuntajeFiltro] = useState<number | null>(null);
  const [soloPublicados, setSoloPublicados] = useState(false);

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    return testimonios.filter((t) => {
      if (puntajeFiltro !== null && t.puntaje !== puntajeFiltro) return false;
      if (soloPublicados && !t.publicado) return false;
      if (!q) return true;
      return (
        t.clienteNombre.toLowerCase().includes(q) ||
        t.texto.toLowerCase().includes(q)
      );
    });
  }, [testimonios, query, puntajeFiltro, soloPublicados]);

  return (
    <div className="rounded border border-border bg-surface">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full max-w-sm items-center gap-2 rounded border border-border bg-background px-3 focus-within:border-accent">
          <Search className="h-4 w-4 shrink-0 text-ink-faint" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por cliente o testimonio..."
            className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-ink-faint"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-ink-faint hover:text-ink"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            {PUNTAJES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() =>
                  setPuntajeFiltro(puntajeFiltro === p ? null : p)
                }
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  puntajeFiltro === p
                    ? "bg-accent text-ink"
                    : "border border-border bg-surface text-ink-muted hover:border-accent"
                }`}
              >
                {p}★
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSoloPublicados(!soloPublicados)}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              soloPublicados
                ? "bg-accent text-ink"
                : "border border-border bg-surface text-ink-muted hover:border-accent"
            }`}
          >
            Solo publicados
          </button>
        </div>
      </div>

      {error && (
        <p className="border-b border-border px-4 py-2 text-sm text-red-500">{error}</p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 section-label text-ink-faint">Cliente</th>
              <th className="px-4 py-3 section-label text-ink-faint">Testimonio</th>
              <th className="px-4 py-3 section-label text-ink-faint">Puntaje</th>
              <th className="px-4 py-3 section-label text-ink-faint">Publicado</th>
              <th className="px-4 py-3 section-label text-ink-faint">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{t.clienteNombre}</td>
                <td className="max-w-xs px-4 py-3 text-ink-muted line-clamp-2">{t.texto}</td>
                <td className="px-4 py-3 text-accent-strong">
                  {t.puntaje ? "★".repeat(t.puntaje) : "—"}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      startTransition(async () => {
                        const res = await toggleTestimonioPublicado(t.id);
                        if (res && !res.success) setError("No se pudo actualizar el testimonio.");
                      })
                    }
                    disabled={isPending}
                    className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                      t.publicado ? "bg-accent text-ink" : "border border-border text-ink-faint"
                    }`}
                  >
                    {t.publicado ? "Publicado" : "Borrador"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (!confirm("¿Eliminar este testimonio?")) return;
                      startTransition(async () => {
                        const res = await deleteTestimonio(t.id);
                        if (res && !res.success) setError("No se pudo eliminar el testimonio.");
                      });
                    }}
                    disabled={isPending}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-faint">
                  No hay testimonios que coincidan con la búsqueda
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
