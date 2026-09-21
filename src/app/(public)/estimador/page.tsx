"use client";

import { useState, useEffect } from "react";
import { getPreciosReferencia } from "./actions";
import type { PrecioReferencia } from "./actions";

const PASOS = [
  {
    titulo: "Tipo de construcción",
    opciones: [
      { value: "seco", label: "Steel Frame / Seco", desc: "Estructura de acero galvanizado" },
      { value: "tradicional", label: "Tradicional", desc: "Mampostería convencional" },
    ],
  },
  {
    titulo: "Superficie estimada",
    opciones: [
      { value: "hasta_50", label: "Hasta 50 m2", desc: "Monoambiente o ampliación chica" },
      { value: "m50_100", label: "50 - 100 m2", desc: "Casa de 1-2 dormitorios" },
      { value: "m100_200", label: "100 - 200 m2", desc: "Casa de 3-4 dormitorios" },
      { value: "mas_200", label: "Más de 200 m2", desc: "Casa grande o múltiples ambientes" },
    ],
  },
  {
    titulo: "Resultado",
    opciones: [],
  },
];

const M2_LABELS: Record<string, string> = {
  hasta_50: "50 m2",
  m50_100: "75 m2",
  m100_200: "150 m2",
  mas_200: "250 m2",
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

function buildPreciosMap(data: PrecioReferencia[]): Record<string, Record<string, { min: number; max: number }>> {
  const map: Record<string, Record<string, { min: number; max: number }>> = {};
  for (const p of data) {
    if (!map[p.tipoConstruccion]) map[p.tipoConstruccion] = {};
    map[p.tipoConstruccion][p.rangoM2] = { min: p.precioMin, max: p.precioMax };
  }
  return map;
}

export default function EstimadorPage() {
  const [paso, setPaso] = useState(0);
  const [tipo, setTipo] = useState<string | null>(null);
  const [m2, setM2] = useState<string | null>(null);
  const [precios, setPrecios] = useState<Record<string, Record<string, { min: number; max: number }>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPreciosReferencia().then((data) => {
      setPrecios(buildPreciosMap(data));
      setLoading(false);
    });
  }, []);

  const resultado =
    tipo && m2 && precios[tipo]?.[m2]
      ? precios[tipo][m2]
      : null;

  const m2Num =
    m2 === "hasta_50"
      ? 50
      : m2 === "m50_100"
        ? 75
        : m2 === "m100_200"
          ? 150
          : 250;

  return (
    <div className="py-24 lg:py-32">
      <div className="mx-auto max-w-2xl px-4 lg:px-8">
        <p className="section-label mb-4 text-ink/40">ESTIMADOR</p>
        <h1 className="font-heading text-4xl font-bold md:text-5xl">
          Estimá tu obra
        </h1>
        <p className="mt-4 text-ink/50">
          En 3 pasos tenés una referencia de costo por metro cuadrado.
        </p>

        {/* Progress */}
        <div className="mt-8 flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded ${
                i <= paso ? "bg-accent" : "bg-ink/10"
              }`}
            />
          ))}
        </div>

        <div className="mt-12">
          {loading ? (
            <p className="text-center text-ink/40">Cargando precios...</p>
          ) : paso < 2 ? (
            <>
              <h2 className="font-heading text-2xl font-bold">
                {PASOS[paso].titulo}
              </h2>
              <div className="mt-6 space-y-3">
                {PASOS[paso].opciones.map((opt) => {
                  const selected =
                    (paso === 0 ? tipo : m2) === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        if (paso === 0) setTipo(opt.value);
                        else setM2(opt.value);
                      }}
                      className={`w-full rounded border p-4 text-left transition-colors ${
                        selected
                          ? "border-accent bg-accent/5"
                          : "border-border hover:border-ink/20"
                      }`}
                    >
                      <p className="font-medium">{opt.label}</p>
                      <p className="text-sm text-ink/40">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPaso(paso + 1)}
                disabled={paso === 0 ? !tipo : !m2}
                className="mt-8 accent-btn w-full rounded py-3 text-sm font-medium disabled:opacity-30"
              >
                {paso === 1 ? "Ver estimación" : "Siguiente"}
              </button>
            </>
          ) : (
            <>
              <h2 className="font-heading text-2xl font-bold">
                Tu estimación
              </h2>
              {resultado && (
                <div className="mt-6 rounded border border-border bg-surface p-8 text-center">
                  <p className="section-label text-ink/40">
                    {tipo === "seco" ? "STEEL FRAME" : "TRADICIONAL"} ·{" "}
                    {M2_LABELS[m2 || ""]}
                  </p>
                  <p className="mt-4 font-heading text-4xl font-bold text-accent-strong">
                    {formatCurrency(resultado.min)} - {formatCurrency(resultado.max)}
                  </p>
                  <p className="mt-2 text-sm text-ink/40">
                    Por metro cuadrado (referencia)
                  </p>
                  <p className="mt-1 text-sm text-ink/40">
                    Total estimado:{" "}
                    {formatCurrency(resultado.min * m2Num)} -{" "}
                    {formatCurrency(resultado.max * m2Num)}
                  </p>
                </div>
              )}
              <p className="mt-6 text-center text-sm text-ink/40">
                Esta estimación es orientativa. El precio final depende de
                la complejidad, acabados y condiciones del terreno.
              </p>
              <div className="mt-8 flex gap-4">
                <button
                  onClick={() => setPaso(0)}
                  className="flex-1 rounded border border-border py-3 text-sm font-medium"
                >
                  Empezar de nuevo
                </button>
                <a
                  href="/cotizacion"
                  className="accent-btn flex-1 rounded py-3 text-center text-sm font-medium"
                >
                  Pedí presupuesto real
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
