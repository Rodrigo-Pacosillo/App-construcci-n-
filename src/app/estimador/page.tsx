"use client";

import { useState } from "react";

const PASOS = [
  {
    titulo: "Tipo de construccion",
    opciones: [
      { value: "seco", label: "Steel Frame / Seco", desc: "Estructura de acero galvanizado" },
      { value: "tradicional", label: "Tradicional", desc: "Mamposteria convencional" },
    ],
  },
  {
    titulo: "Superficie estimada",
    opciones: [
      { value: "hasta_50", label: "Hasta 50 m2", desc: "Monoambiente o ampliacion chica" },
      { value: "m50_100", label: "50 - 100 m2", desc: "Casa de 1-2 dormitorios" },
      { value: "m100_200", label: "100 - 200 m2", desc: "Casa de 3-4 dormitorios" },
      { value: "mas_200", label: "Mas de 200 m2", desc: "Casa grande o multiples ambientes" },
    ],
  },
  {
    titulo: "Resultado",
    opciones: [],
  },
];

const PRECIOS: Record<string, Record<string, { min: number; max: number }>> = {
  seco: {
    hasta_50: { min: 350000, max: 500000 },
    m50_100: { min: 300000, max: 420000 },
    m100_200: { min: 280000, max: 380000 },
    mas_200: { min: 250000, max: 350000 },
  },
  tradicional: {
    hasta_50: { min: 400000, max: 550000 },
    m50_100: { min: 350000, max: 480000 },
    m100_200: { min: 320000, max: 440000 },
    mas_200: { min: 300000, max: 400000 },
  },
};

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

export default function EstimadorPage() {
  const [paso, setPaso] = useState(0);
  const [tipo, setTipo] = useState<string | null>(null);
  const [m2, setM2] = useState<string | null>(null);

  const resultado =
    tipo && m2 && PRECIOS[tipo]?.[m2]
      ? PRECIOS[tipo][m2]
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
          {paso < 2 ? (
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
                {paso === 1 ? "Ver estimacion" : "Siguiente"}
              </button>
            </>
          ) : (
            <>
              <h2 className="font-heading text-2xl font-bold">
                Tu estimacion
              </h2>
              {resultado && (
                <div className="mt-6 rounded border border-border bg-surface p-8 text-center">
                  <p className="section-label text-ink/40">
                    {tipo === "seco" ? "STEEL FRAME" : "TRADICIONAL"} ·{" "}
                    {M2_LABELS[m2 || ""]}
                  </p>
                  <p className="mt-4 font-heading text-4xl font-bold text-accent">
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
                Esta estimacion es orientativa. El precio final depende de
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
