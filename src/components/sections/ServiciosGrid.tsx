"use client";

import Link from "next/link";
import { motion } from "motion/react";

type Servicio = {
  id: string;
  titulo: string;
  slug: string;
  descripcion: string;
};

export function ServiciosGrid({ servicios }: { servicios: Servicio[] }) {
  return (
    <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {servicios.map((servicio, i) => (
        <motion.div
          key={servicio.id}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
        >
          <Link
            href={`/servicios/${servicio.slug}`}
            className="group relative block overflow-hidden rounded border border-border bg-surface p-6 transition-colors hover:border-accent"
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(255,179,0,0.06)_0%,transparent_50%)]" />
            </div>

            <span className="relative section-label text-ink/20">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="relative mt-3 font-heading text-xl font-bold">
              {servicio.titulo}
            </h3>
            <p className="relative mt-2 text-sm text-ink/50 line-clamp-3">
              {servicio.descripcion}
            </p>
            <span className="relative mt-4 inline-block text-xs text-accent-strong opacity-0 transition-opacity group-hover:opacity-100">
              Ver más →
            </span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
