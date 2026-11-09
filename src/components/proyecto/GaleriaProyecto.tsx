// src/components/proyecto/GaleriaProyecto.tsx
"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cloudSrc } from "@/lib/cloudinary-img";

export function GaleriaProyecto({ urls, titulo }: { urls: string[]; titulo: string }) {
  const [abierta, setAbierta] = useState<number | null>(null);
  const dlg = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (abierta !== null) dlg.current?.showModal();
  }, [abierta]);

  if (urls.length === 0) return null;

  const mover = (delta: number) =>
    setAbierta((a) => (a === null ? a : (a + delta + urls.length) % urls.length));

  return (
    <section className="mt-12">
      <div className="mb-4 flex items-center justify-between">
        <p className="section-label text-ink-faint">
          GALERÍA <span className="ml-1 text-ink-faint/60">({urls.length} FOTOS)</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {urls.map((url, i) => (
          <button
            key={url}
            onClick={() => setAbierta(i)}
            aria-label={`Abrir foto ${i + 1} de ${titulo}`}
            className="group relative aspect-[4/3] cursor-zoom-in overflow-hidden rounded-lg bg-surface shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
          >
            <Image
              src={cloudSrc(url, { w: 900, ar: "4:3" })}
              alt={`${titulo} — foto ${i + 1} de ${urls.length}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 384px"
              loading={i < 6 ? "eager" : "lazy"}
              className="object-cover transition-transform duration-300 motion-safe:group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      <dialog
        ref={dlg}
        onClose={() => setAbierta(null)}
        onClick={(e) => { if (e.target === dlg.current) dlg.current?.close(); }}
        className="fixed inset-0 m-auto max-h-[92vh] max-w-[92vw] bg-transparent p-0 backdrop:bg-black/90"
      >
        {abierta !== null && (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cloudSrc(urls[abierta], { w: 1600 })}
              alt={`${titulo} — foto ${abierta + 1}`}
              className="max-h-[85vh] max-w-[92vw] rounded object-contain"
            />
            <button onClick={() => mover(-1)} aria-label="Foto anterior"
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 text-white">‹</button>
            <button onClick={() => mover(1)} aria-label="Foto siguiente"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 text-white">›</button>
            <button onClick={() => dlg.current?.close()} aria-label="Cerrar"
                    className="absolute right-2 top-2 rounded-full bg-black/60 px-3 py-1 text-white">✕</button>
            <p className="mt-2 text-center text-xs text-white/70">{abierta + 1} / {urls.length}</p>
          </div>
        )}
      </dialog>
    </section>
  );
}