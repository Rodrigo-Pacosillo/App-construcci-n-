"use client";

import { useState, useTransition, type ReactNode } from "react";

/**
 * Confirmación para acciones delicadas (§0.8, §7.5).
 * Reemplaza el `confirm()` nativo por un diálogo con texto explícito
 * que indica el efecto real de la acción.
 */
export function ConfirmButton({
  onConfirm,
  children,
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  variante = "danger",
  className,
}: {
  onConfirm: () => Promise<unknown> | unknown;
  children: ReactNode;
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  variante?: "danger" | "neutral";
  className?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [isPending, startTransition] = useTransition();

  function confirmar() {
    startTransition(async () => {
      await onConfirm();
      setAbierto(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className={className}
      >
        {children}
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-titulo"
        >
          <div className="w-full max-w-md rounded border border-border bg-surface p-6 shadow-lg">
            <h2 id="confirm-titulo" className="font-heading text-lg font-bold">
              {titulo}
            </h2>
            <p className="mt-2 text-sm text-ink-muted">{mensaje}</p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAbierto(false)}
                disabled={isPending}
                className="rounded border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-accent disabled:opacity-50"
              >
                {textoCancelar}
              </button>
              <button
                type="button"
                onClick={confirmar}
                disabled={isPending}
                className={`rounded px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50 ${
                  variante === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-ink hover:opacity-90"
                }`}
              >
                {isPending ? "Procesando..." : textoConfirmar}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
