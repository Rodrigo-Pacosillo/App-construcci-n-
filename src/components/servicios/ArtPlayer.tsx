"use client";
// Único código de navegador del dibujo (≈ 30 líneas).
// - El HTML llega con data-play="true": la animación arranca sola, sin esperar a JS.
// - Se repite cada 12 s SOLO mientras el dibujo está a la vista.
// - Si el dibujo estaba fuera de pantalla y entra, la animación vuelve a empezar.
// - Con "reducir movimiento" no hay bucle (el CSS ya desactiva las animaciones).
import { useEffect, useRef, type ReactNode } from "react";

const LOOP_MS = 12000;

export default function ArtPlayer({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let loop: number | undefined;
    let first = true;

    const restart = () => {
      el.dataset.play = "false";
      void el.offsetWidth; // fuerza reinicio de las animaciones CSS
      el.dataset.play = "true";
    };
    const cycle = () => {
      el.dataset.out = "true";
      window.setTimeout(() => {
        restart();
        el.dataset.out = "false";
      }, 400);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!first) restart();
          if (!reduce) loop = window.setInterval(cycle, LOOP_MS);
        } else {
          window.clearInterval(loop);
        }
        first = false;
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearInterval(loop);
    };
  }, []);

  return (
    <div ref={ref} className="art" data-play="true" data-out="false">
      {children}
    </div>
  );
}
