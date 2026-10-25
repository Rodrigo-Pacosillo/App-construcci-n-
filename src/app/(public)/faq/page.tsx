import { prisma } from "@/lib/db";
import { FALLBACK_FAQS } from "@/lib/fallback-data";
import { sanitizeHTML } from "@/lib/sanitize";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preguntas Frecuentes",
  description:
    "Resolvemos sus dudas sobre construcción en seco, steel frame, construcción tradicional, plazos, costos, garantía y cobertura nacional.",
  openGraph: {
    images: [
      {
        url: "/og?title=Preguntas%20Frecuentes&subtitle=Dudas%20sobre%20construcci%C3%B3n%20en%20Bolivia&type=dark",
        width: 1200,
        height: 630,
        alt: "FAQ CONSTR-ART",
      },
    ],
  },
};

export const dynamic = "force-dynamic";

async function getFaqs() {
  try {
    const faqs = await prisma.faq.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    });
    return faqs.length > 0 ? faqs : FALLBACK_FAQS;
  } catch {
    return FALLBACK_FAQS;
  }
}

export default async function FaqPage() {
  const faqs = await getFaqs();

  return (
    <div className="py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-4 lg:px-8">
        <p className="section-label mb-4 text-ink-faint">FAQ</p>
        <h1 className="font-heading text-4xl font-bold md:text-5xl">
          Preguntas frecuentes
        </h1>
        <p className="mt-4 text-ink-muted">
          Resolvemos las dudas más comunes sobre construcción en seco.
        </p>

        <div className="mt-12 space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.id}
              className="group rounded border border-border bg-surface"
            >
              <summary className="cursor-pointer px-6 py-4 text-sm font-medium list-none flex items-center justify-between">
                {sanitizeHTML(faq.pregunta)}
                <span className="text-ink-faint transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="border-t border-border px-6 py-4 text-sm text-ink-muted">
                {sanitizeHTML(faq.respuesta)}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
