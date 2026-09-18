"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { prisma } from "@/lib/db";
import { FALLBACK_SERVICIOS } from "@/lib/fallback-data";

async function getServicios() {
  try {
    const servicios = await prisma.servicio.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    });
    return servicios.length > 0 ? servicios : FALLBACK_SERVICIOS;
  } catch {
    return FALLBACK_SERVICIOS;
  }
}

export async function ServiciosSection() {
  const servicios = await getServicios();

  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="section-label mb-4 text-ink/40"
        >
          01 / SERVICIOS
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="font-heading text-4xl font-bold md:text-5xl"
        >
          Lo que hacemos
        </motion.h2>

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
                {/* Spotlight effect */}
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
                <span className="relative mt-4 inline-block text-xs text-accent opacity-0 transition-opacity group-hover:opacity-100">
                  Ver mas →
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
