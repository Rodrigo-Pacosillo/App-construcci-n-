"use client";

import { useState, useEffect } from "react";
import { getCotizacionesPropias } from "@/lib/db-utils";

interface Cotizacion {
  id: string;
  tipoObra: string;
  tipoConstruccion: string;
  rangoM2: string | null;
  ubicacionObra: string | null;
  estado: string;
  origen: string;
  creadoEn: Date;
}

export default function MisCotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCotizacionesPropias()
      .then((data) => setCotizaciones(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="py-24 lg:py-32">
      <div className="mx-auto max-w-4xl px-4 lg:px-8">
        <p className="section-label mb-4 text-ink/40">MIS COTIZACIONES</p>
        <h1 className="font-heading text-4xl font-bold md:text-5xl">
          Tus presupuestos
        </h1>
        <p className="mt-4 text-ink/50">
          Seguí el estado de tus solicitudes de cotización.
        </p>

        {loading ? (
          <p className="mt-12 text-center text-ink/40">Cargando...</p>
        ) : cotizaciones.length === 0 ? (
          <div className="mt-12 rounded border border-border bg-surface p-8 text-center">
            <p className="text-ink/40">No tenés cotizaciones aún.</p>
            <a
              href="/cotizacion"
              className="accent-btn mt-4 inline-block rounded px-6 py-3 text-sm font-medium"
            >
              Pedí tu presupuesto
            </a>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {cotizaciones.map((c) => (
              <div
                key={c.id}
                className="rounded border border-border bg-surface p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      {c.tipoObra === "vivienda_nueva"
                        ? "Vivienda nueva"
                        : c.tipoObra === "ampliacion"
                          ? "Ampliación"
                          : "Otro"}{" "}
                      ·{" "}
                      {c.tipoConstruccion === "seco"
                        ? "Steel Frame"
                        : "Tradicional"}
                    </p>
                    {c.ubicacionObra && (
                      <p className="mt-1 text-sm text-ink/40">
                        📍 {c.ubicacionObra}
                      </p>
                    )}
                  </div>
                  <span
                    className={`rounded px-2 py-1 text-xs font-medium ${
                      c.estado === "ganado"
                        ? "bg-green-100 text-green-700"
                        : c.estado === "perdido"
                          ? "bg-red-100 text-red-700"
                          : "bg-accent/10 text-accent"
                    }`}
                  >
                    {c.estado === "nuevo"
                      ? "Nuevo"
                      : c.estado === "contactado"
                        ? "Contactado"
                        : c.estado === "visita_tecnica"
                          ? "Visita técnica"
                          : c.estado === "presupuestado"
                            ? "Presupuestado"
                            : c.estado === "ganado"
                              ? "Aprobado"
                              : "Cerrado"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-ink/30">
                  Solicitado el{" "}
                  {new Date(c.creadoEn).toLocaleDateString("es-AR")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
