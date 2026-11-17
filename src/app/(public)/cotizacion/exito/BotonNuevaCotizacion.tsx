"use client";

import { useRouter } from "next/navigation";
import { limpiarSesionExito } from "@/lib/chat/sesionPublicaExito";

/**
 * Cierra la pantalla de exito y lleva al formulario vacio de cotizacion.
 * Limpia el puntero guardado para que la proxima cotizacion empiece de cero.
 */
export function BotonNuevaCotizacion({ className = "" }: { className?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        limpiarSesionExito();
        router.push("/cotizacion");
      }}
      className={`inline-flex w-full items-center justify-center gap-2 rounded border border-border bg-surface px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent-strong sm:w-auto ${className}`}
    >
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 5v14M5 12h14"
        />
      </svg>
      Realizar otra cotización
    </button>
  );
}
