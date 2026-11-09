"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { cloudSrc } from "@/lib/cloudinary-img";

export function PlanoDistribucion({ planoUrl, direccionObra }: { planoUrl: string; direccionObra: string }) {
  const [abierto, setAbierto] = useState(false);
  const dlg = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (abierto) dlg.current?.showModal();
  }, [abierto]);

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <p className="section-label mb-4 text-ink-faint">PLANO DE DISTRIBUCIÓN</p>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-surface shadow-md cursor-zoom-in" onClick={() => setAbierto(true)}>
        <Image
          src={cloudSrc(planoUrl, { w: 800, ar: "4:3" })}
          alt={`Plano de distribución - ${direccionObra}`}
          fill
          sizes="(max-width: 896px) 100vw, 896px"
          className="object-contain transition-transform duration-300 hover:scale-[1.02]"
        />
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          Click para ampliar
        </div>
      </div>

      <dialog
        ref={dlg}
        onClose={() => setAbierto(false)}
        onClick={(e) => { if (e.target === dlg.current) dlg.current?.close(); }}
        className="fixed inset-0 m-auto max-h-[92vh] max-w-[92vw] bg-transparent p-0 backdrop:bg-black/95"
      >
        {abierto && (
          <div className="relative">
            <img
              src={cloudSrc(planoUrl, { w: 2000 })}
              alt={`Plano de distribución - ${direccionObra}`}
              className="max-h-[85vh] max-w-[92vw] rounded object-contain"
            />
            <button onClick={() => dlg.current?.close()} aria-label="Cerrar"
                    className="absolute right-2 top-2 rounded-full bg-black/70 px-3 py-1 text-white hover:bg-black/90">
              ✕
            </button>
            <p className="mt-2 text-center text-xs text-white/70">{direccionObra}</p>
          </div>
        )}
      </dialog>
    </div>
  );
}