import Link from "next/link";

export function CtaSection() {
  return (
    <section className="block-dark py-16 lg:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center lg:px-8">
        <p className="section-label mb-4 text-accent">PRESUPUESTO</p>
        <h2 className="font-heading text-4xl font-bold text-white md:text-5xl">
          Pedí tu presupuesto
        </h2>
        <p className="mt-4 text-lg text-white/50">
          Contanos tu proyecto y te damos una estimación en 24 horas.
          Sin compromiso.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/cotizacion"
            className="accent-btn inline-flex items-center justify-center rounded px-8 py-4 text-sm font-medium transition-opacity hover:opacity-90"
          >
            Cotización online
          </Link>
          <Link
            href="/estimador"
            className="inline-flex items-center justify-center rounded border border-white/20 px-8 py-4 text-sm font-medium text-white transition-colors hover:border-white/40"
          >
            Estimador rápido
          </Link>
        </div>
      </div>
    </section>
  );
}
