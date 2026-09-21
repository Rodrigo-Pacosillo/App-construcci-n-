"use client";

import { useState } from "react";
import { ESTADOS_COTIZACION, ESTADO_LABELS, type EstadoCotizacion } from "@/lib/constants";

type Cotizacion = {
  id: string;
  tipoObra: string;
  tipoConstruccion: string;
  rangoM2: string;
  ubicacionObra: string | null;
  estado: string;
  montoCerrado: number | null;
};

type Filtro = "todos" | EstadoCotizacion;

export function CotizacionesLista({ cotizaciones }: { cotizaciones: Cotizacion[] }) {
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const filtradas =
    filtro === "todos"
      ? cotizaciones
      : cotizaciones.filter((c) => c.estado === filtro);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="section-label mb-2 text-ink/40">COTIZACIONES</p>
          <h1 className="font-heading text-3xl font-bold">Mis cotizaciones</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["todos", ...ESTADOS_COTIZACION] as Filtro[]).map((filtroActual) => (
            <button
              key={filtroActual}
              onClick={() => setFiltro(filtroActual)}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                filtro === filtroActual
                  ? "bg-ink text-white"
                  : "bg-ink/5 text-ink/50"
              }`}
            >
              {filtroActual === "todos"
                ? "Todas"
                : ESTADO_LABELS[filtroActual as EstadoCotizacion]}
            </button>
          ))}
        </div>
      </div>

      {filtradas.length === 0 ? (
        <p className="py-12 text-center text-ink/50">
          No tenés cotizaciones registradas.
        </p>
      ) : (
        <div className="space-y-4">
          {filtradas.map((c) => (
            <div
              key={c.id}
              className="rounded border border-border bg-surface p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="section-label text-ink/40">COTIZACIÓN</p>
                  <h2 className="mt-1 font-heading text-lg font-bold">
                    {c.tipoObra.replace(/_/g, " ")}
                  </h2>
                  <p className="mt-1 text-sm text-ink/50">
                    {c.tipoConstruccion.replace(/_/g, " ")} ·{" "}
                    {c.rangoM2.replace(/_/g, " ")}
                  </p>
                  <p className="mt-1 text-sm text-ink/50">
                    {c.ubicacionObra || "Ubicación no especificada"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="section-label text-accent-strong">{ESTADO_LABELS[c.estado as EstadoCotizacion]}</p>
                  {c.montoCerrado && (
                    <p className="mt-1 font-heading text-lg font-bold">
                      ${c.montoCerrado.toLocaleString("es-AR")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}