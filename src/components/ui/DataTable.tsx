import type { ReactNode } from "react";

/**
 * Contenedor de tabla con scroll horizontal en móvil (§4.2).
 * El `<thead>`/`<tbody>` los define cada lista, pero el wrapper
 * y los estilos base son únicos.
 */
export function DataTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded border border-border bg-surface">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}

export function DataTableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-border bg-ink/[0.02] text-xs uppercase text-ink-faint">
      {children}
    </thead>
  );
}

export function DataTableEmpty({
  colSpan,
  children,
}: {
  colSpan: number;
  children: ReactNode;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-ink-muted">
        {children}
      </td>
    </tr>
  );
}
