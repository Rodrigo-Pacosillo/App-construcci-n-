import { prisma } from "@/lib/db";
import { FALLBACK_FAQS } from "@/lib/fallback-data";
import { sanitizeHTML } from "@/lib/sanitize";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preguntas Frecuentes",
  description:
    "Resolvemos tus dudas sobre construccion en seco, steel frame, plazos, costos y mas.",
};

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
        <p className="section-label mb-4 text-ink/40">FAQ</p>
        <h1 className="font-heading text-4xl font-bold md:text-5xl">
          Preguntas frecuentes
        </h1>
        <p className="mt-4 text-ink/50">
          Resolvemos las dudas mas comunes sobre construccion en seco.
        </p>

        <div className="mt-12 space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.id}
              className="group rounded border border-border bg-surface"
            >
              <summary className="cursor-pointer px-6 py-4 text-sm font-medium list-none flex items-center justify-between">
                {sanitizeHTML(faq.pregunta)}
                <span className="text-ink/30 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="border-t border-border px-6 py-4 text-sm text-ink/60">
                {sanitizeHTML(faq.respuesta)}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
