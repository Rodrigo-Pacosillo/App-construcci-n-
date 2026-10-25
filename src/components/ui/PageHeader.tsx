import type { ReactNode } from "react";

/**
 * Encabezado estándar de página del panel admin (§4.2).
 * Título + descripción breve + acciones opcionales.
 */
export function PageHeader({
  label,
  titulo,
  descripcion,
  acciones,
}: {
  label?: string;
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        {label && <p className="section-label mb-1 text-ink-faint">{label}</p>}
        <h1 className="font-heading text-3xl font-bold">{titulo}</h1>
        {descripcion && <p className="mt-1 text-ink-muted">{descripcion}</p>}
      </div>
      {acciones && <div className="flex items-center gap-2">{acciones}</div>}
    </div>
  );
}
