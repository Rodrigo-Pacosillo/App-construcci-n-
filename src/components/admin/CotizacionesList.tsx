"use client";

import { useState, useTransition } from "react";
import { updateCotizacionEstado } from "@/app/admin/(panel)/cotizaciones/actions";
import { ESTADOS_COTIZACION, ESTADO_LABELS } from "@/lib/constants";

type Cotizacion = {
  id: string;
  estado: string;
  tipoObra: string;
  tipoConstruccion: string;
  rangoM2: string;
  origen: string;
  ubicacionObra: string | null;
  montoEstimado: number | null;
  creadoEn: Date;
  cliente: { nombre: string; whatsapp: string; email: string | null } | null;
};

export function CotizacionesList({ cotizaciones }: { cotizaciones: Cotizacion[] }) {
  const [filtro, setFiltro] = useState<string>("todos");
  const [isPending, startTransition] = useTransition();

  const filtradas = filtro === "todos"
    ? cotizaciones
    : cotizaciones.filter((c) => c.estado === filtro);

  function handleEstadoChange(id: string, nuevoEstado: string) {
    startTransition(async () => {
      await updateCotizacionEstado(id, nuevoEstado);
    });
  }

  return (
    <div>
      {/* Filtros */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFiltro("todos")}
          className={`rounded px-3 py-1 text-xs font-medium ${
            filtro === "todos" ? "bg-ink text-white" : "bg-ink/5 text-ink/50"
          }`}
        >
          Todos ({cotizaciones.length})
        </button>
        {ESTADOS_COTIZACION.map((estado) => {
          const count = cotizaciones.filter((c) => c.estado === estado).length;
          return (
            <button
              key={estado}
              onClick={() => setFiltro(estado)}
              className={`rounded px-3 py-1 text-xs font-medium ${
                filtro === estado ? "bg-ink text-white" : "bg-ink/5 text-ink/50"
              }`}
            >
              {ESTADO_LABELS[estado]} ({count})
            </button>
          );
        })}
      </div>

      {/* Tabla */}
      <div className="rounded border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 section-label text-ink/40">Cliente</th>
                <th className="px-4 py-3 section-label text-ink/40">Tipo</th>
                <th className="px-4 py-3 section-label text-ink/40">M2</th>
                <th className="px-4 py-3 section-label text-ink/40">Origen</th>
                <th className="px-4 py-3 section-label text-ink/40">Estado</th>
                <th className="px-4 py-3 section-label text-ink/40">Monto</th>
                <th className="px-4 py-3 section-label text-ink/40">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{c.cliente?.nombre || "—"}</p>
                    <p className="text-xs text-ink/40">{c.cliente?.whatsapp}</p>
                  </td>
                  <td className="px-4 py-3 capitalize text-ink/60">{c.tipoObra.replace("_", " ")}</td>
                  <td className="px-4 py-3 text-ink/60">{c.rangoM2.replace("m", "").replace("_", "-").replace("mas", "+")} m2</td>
                  <td className="px-4 py-3 capitalize text-ink/60">{c.origen}</td>
                  <td className="px-4 py-3">
                    <select
                      value={c.estado}
                      onChange={(e) => handleEstadoChange(c.id, e.target.value)}
                      disabled={isPending}
                      className="rounded border border-border bg-surface px-2 py-1 text-xs outline-none"
                    >
                      {ESTADOS_COTIZACION.map((e) => (
                        <option key={e} value={e}>{ESTADO_LABELS[e]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-ink/60">
                    {c.montoEstimado
                      ? `$${c.montoEstimado.toLocaleString("es-AR")}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-ink/30">{c.ubicacionObra || "—"}</span>
                  </td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-ink/30">
                    No hay cotizaciones
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
