"use client";

import { useEffect, useState, useRef } from "react";
import { useInView } from "motion/react";

function AnimatedNumber({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const duration = 2000;
    const increment = value / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {count.toLocaleString("es-AR")}{suffix}
    </span>
  );
}

export function NumerosSection() {
  const numeros = [
    { label: "Metros cuadrados", valor: 5000, sufijo: "m2" },
    { label: "Obras ejecutadas", valor: 200, sufijo: "+" },
    { label: "Dias promedio", valor: 35, sufijo: "" },
    { label: "Anos de experiencia", valor: 15, sufijo: "" },
  ];

  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <p className="section-label mb-4 text-ink/40">05 / NUMEROS</p>
        <h2 className="font-heading text-4xl font-bold md:text-5xl">
          Nuestros resultados
        </h2>

        <div className="mt-12 grid grid-cols-2 gap-8 lg:grid-cols-4">
          {numeros.map((num) => (
            <div key={num.label} className="text-center">
              <p className="font-heading text-5xl font-bold text-accent">
                <AnimatedNumber value={num.valor} suffix={num.sufijo} />
              </p>
              <p className="mt-2 section-label text-ink/40">{num.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
