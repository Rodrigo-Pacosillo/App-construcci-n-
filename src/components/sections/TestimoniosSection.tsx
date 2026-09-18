"use client";

import { motion } from "motion/react";
import { prisma } from "@/lib/db";
import { FALLBACK_TESTIMONIOS } from "@/lib/fallback-data";

async function getTestimonios() {
  try {
    const testimonios = await prisma.testimonio.findMany({
      where: { publicado: true },
      take: 5,
    });
    return testimonios.length > 0 ? testimonios : FALLBACK_TESTIMONIOS;
  } catch {
    return FALLBACK_TESTIMONIOS;
  }
}

export async function TestimoniosSection() {
  const testimonios = await getTestimonios();

  return (
    <section className="py-24 lg:py-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="section-label mb-4 text-ink/40"
        >
          03 / TESTIMONIOS
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="font-heading text-4xl font-bold md:text-5xl"
        >
          Que dicen nuestros clientes
        </motion.h2>
      </div>

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
                    <p className="text-xs text-accent">
                      {"★".repeat(t.puntaje)}
                    </p>
                  )}
                </div>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
