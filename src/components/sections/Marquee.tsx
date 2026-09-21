"use client";

import { motion } from "motion/react";

const ESPECIALIDADES = [
  "STEEL FRAME",
  "DRYWALL",
  "CIELORRASOS",
  "REVESTIMIENTOS",
  "AISLACIONES",
  "HABILITACIONES",
  "AMPLIACIONES",
  "REFACCIONES",
];

export function Marquee() {
  return (
    <section className="border-y border-border bg-surface py-4 overflow-hidden">
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 20,
            ease: "linear",
          },
        }}
      >
        {[...ESPECIALIDADES, ...ESPECIALIDADES].map((esp, i) => (
          <span
            key={i}
            className="mx-8 section-label text-lg text-ink-muted"
          >
            {esp}
          </span>
        ))}
      </motion.div>
    </section>
  );
}
