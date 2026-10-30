"use client";

import { useState } from "react";
import Image from "next/image";
import { getTikTokVideoId } from "@/lib/validators/media";

/**
 * Reproductor de TikTok click-to-play.
 * - Ningún <iframe> hasta el clic.
 * * aspect-[9/16] reserva el espacio: sin saltos de layout.
 * - videoUrl null o inválido → no renderiza nada.
 */
export function TikTokPlayer({
  videoUrl,
  portadaUrl,
  titulo,
}: {
  videoUrl: string;
  portadaUrl?: string | null;
  titulo: string;
}) {
  const [activo, setActivo] = useState(false);
  const id = getTikTokVideoId(videoUrl);
  if (!id) return null;

  return (
    <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-neutral-200">
      {activo ? (
        <iframe
          src={`https://www.tiktok.com/player/v1/${id}?autoplay=1`}
          title={titulo}
          allow="fullscreen"
          className="absolute inset-0 h-full w-full"
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
