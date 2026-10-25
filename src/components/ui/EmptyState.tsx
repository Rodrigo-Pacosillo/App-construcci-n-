import type { ReactNode } from "react";

/**
 * Estado vacío útil (§4.2): explica qué aparecerá o cómo iniciar,
 * en lugar de una tabla sin filas.
 */
export function EmptyState({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string;
  descripcion: string;
  accion?: ReactNode;
}) {
  return (
    <div className="rounded border border-border bg-surface p-12 text-center">
      <p className="font-heading text-lg font-bold">{titulo}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">{descripcion}</p>
      {accion && <div className="mt-6 flex justify-center">{accion}</div>}
    </div>
  );
}
