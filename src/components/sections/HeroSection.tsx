import Link from "next/link";
import { HeroBlueprint } from "./HeroBlueprint";

export function HeroSection() {
  return (
    <section className="block relative overflow-hidden py-24 lg:py-32">
      <div className="relative z-10 mx-auto max-w-7xl px-4 lg:px-8">
        <div className="max-w-3xl">
          <p className="section-label mb-4 text-accent-strong">CONSTRUCCION EN SECO</p>
          <h1 className="font-heading text-5xl font-bold leading-tight text-ink md:text-7xl">
            Construimos tu
            <br />
            <span className="text-accent-strong">próximo proyecto</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-muted">
            Steel frame, drywall, cielorrasos, revestimientos y aislaciones.
            Rápido, eficiente y con la calidad que buscas.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/cotizacion"
              className="accent-btn inline-flex items-center justify-center rounded px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
            >
              Pedí tu presupuesto
            </Link>
            <Link
              href="/proyectos"
              className="inline-flex items-center justify-center rounded border border-ink/25 px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-ink/40"
            >
              Ver proyectos
            </Link>
          </div>
        </div>
      </div>

      {/* Blueprint animado */}
      <HeroBlueprint />

      {/* Grid overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "linear-gradient(var(--bp-grid) 1px, transparent 1px), linear-gradient(90deg, var(--bp-grid) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>
    </section>
  );
}
