// src/components/proyecto/VideoSlot.tsx
// Espacio vacío del video (server component, 0 JS)
export function VideoSlot() {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-3
                    rounded-xl border border-dashed border-border bg-surface/40 text-center">
      <span aria-hidden="true"
            className="grid h-12 w-12 place-items-center rounded-full border border-border text-ink-faint">
        ▶
      </span>
      <p className="text-sm font-medium text-ink-muted">Recorrido en video — próximamente</p>
      <p className="max-w-sm text-xs text-ink-faint">
        Estamos preparando el video de esta obra. Mientras tanto, explore la galería de fotos.
      </p>
    </div>
  );
}