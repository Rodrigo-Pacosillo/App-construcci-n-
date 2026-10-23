"use client";

/**
 * Búsqueda de listas (§4.2). Filtra el conjunto completo recibido,
 * no solo la página visible.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
  className,
}: {
  value: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className={`rounded border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent ${
        className ?? "w-full max-w-sm"
      }`}
    />
  );
}
