"use client";

import { motion } from "motion/react";

type Testimonio = {
  id: string;
  clienteNombre: string;
  texto: string;
  puntaje: number | null;
};

export function TestimoniosCarousel({ testimonios }: { testimonios: Testimonio[] }) {
  return (
    <div className="mt-12 overflow-x-auto pb-4 scrollbar-hide">
      <div className="flex gap-6 px-4 lg:px-[calc((100vw-80rem)/2+1rem)]">
        {testimonios.map((t, i) => (
          <motion.blockquote
            key={t.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="min-w-[300px] max-w-[400px] shrink-0 rounded border border-border bg-surface p-6"
          >
            <p className="text-sm text-ink/70">&ldquo;{t.texto}&rdquo;</p>
            <footer className="mt-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/5 text-sm font-bold text-ink/40">
                {t.clienteNombre.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium">{t.clienteNombre}</p>
                {t.puntaje && (
                  <p className="text-xs text-accent-strong">
                    {"★".repeat(t.puntaje)}
                  </p>
                )}
              </div>
            </footer>
          </motion.blockquote>
        ))}
      </div>
    </div>
  );
}
