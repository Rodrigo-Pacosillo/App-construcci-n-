export function ModuloPlaceholder({
  titulo,
  descripcion,
}: {
  titulo: string;
  descripcion?: string;
}) {
  return (
    <div>
      <h1 className="font-heading text-3xl font-bold">{titulo}</h1>
      <div className="mt-8 rounded border border-border bg-surface p-8 text-center">
        <p className="section-label text-ink-faint">ESTRUCTURA</p>
        <p className="mx-auto mt-3 max-w-md text-ink-muted">
          {descripcion ?? "Este módulo se implementa en el siguiente paso."}
        </p>
      </div>
    </div>
  );
}
