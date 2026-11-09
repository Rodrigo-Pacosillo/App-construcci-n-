"use client";

import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

interface Opcion {
  etiqueta: string;
}

interface TarjetaOpcionesProps {
  titulo: string;
  opciones: { etiqueta: string }[];
  onElegir: (etiqueta: string) => void;
}

export function TarjetaOpciones({ titulo, opciones, onElegir }: TarjetaOpcionesProps) {
  const [seleccionando, setSeleccionando] = useState<string | null>(null);

  const manejarClick = async (etiqueta: string) => {
    setSeleccionando(etiqueta);
    try {
      await onElegir(etiqueta);
    } finally {
      setSeleccionando(null);
    }
  };

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 p-3 shadow-sm">
      <h4 className="font-medium text-sm text-amber-800 dark:text-amber-200 mb-2">{titulo}</h4>
      <div className="flex flex-wrap gap-2">
        {opciones.map((opcion, i) => (
          <button
            key={i}
            onClick={() => manejarClick(opcion.etiqueta)}
            disabled={!!seleccionando}
            className="text-sm px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-neutral-800 hover:bg-amber-50 dark:hover:bg-amber-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {seleccionando === opcion.etiqueta ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            )}
            <span className="truncate">{opcion.etiqueta}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default TarjetaOpciones;