"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * Reproductor de video de Cloudinary (click-to-play).
 * - Ningún <video> hasta el clic.
 * - videoUrl null → no renderiza nada.
 */
export function CloudinaryVideoPlayer({
  videoUrl,
  portadaUrl,
  titulo,
}: {
  videoUrl: string;
  portadaUrl?: string | null;
  titulo: string;
}) {
  const [activo, setActivo] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-neutral-200">
      {activo ? (
        <video
          src={videoUrl}
          title={titulo}
          controls
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          poster={portadaUrl ?? undefined}
        />
      ) : (
        <button
          type="button"
          onClick={() => setActivo(true)}
          className="group absolute inset-0"
          aria-label={`Reproducir video: ${titulo}`}
        >
          {portadaUrl && (
            <Image
              src={portadaUrl}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
          )}
          <span
            className="absolute inset-0 grid place-items-center bg-black/20 transition group-hover:bg-black/30"
          >
            ▶
          </span>
        </button>
      )}
    </div>
  );
}
