import Link from "next/link";

export function CtaSection() {
  return (
    <section className="block py-16 lg:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center lg:px-8">
        <p className="section-label mb-4 text-accent-strong">PRESUPUESTO</p>
        <h2 className="font-heading text-4xl font-bold text-ink md:text-5xl">
          Pedí tu presupuesto
        </h2>
        <p className="mt-4 text-lg text-ink-muted">
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
            className="inline-flex items-center justify-center rounded border border-ink/25 px-8 py-4 text-sm font-medium text-ink transition-colors hover:border-ink/40"
          >
            Estimador rápido
          </Link>
        </div>
      </div>
    </section>
  );
}
