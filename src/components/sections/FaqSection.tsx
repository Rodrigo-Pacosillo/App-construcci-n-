import Link from "next/link";
import { prisma } from "@/lib/db";
import { FALLBACK_FAQS } from "@/lib/fallback-data";
import { sanitizeHTML } from "@/lib/sanitize";

async function getFaqs() {
  try {
    const faqs = await prisma.faq.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
      take: 5,
    });
    return faqs.length > 0 ? faqs : FALLBACK_FAQS;
  } catch {
    return FALLBACK_FAQS;
  }
}

export async function FaqSection() {
  const faqs = await getFaqs();

  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-4 lg:px-8">
        <p className="section-label mb-4 text-ink/40">05 / PREGUNTAS FRECUENTES</p>
        <h2 className="font-heading text-4xl font-bold md:text-5xl">
          FAQ
        </h2>

        <div className="mt-12 space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.id}
              className="group rounded border border-border bg-surface"
            >
              <summary className="cursor-pointer px-6 py-4 text-sm font-medium list-none flex items-center justify-between">
                {sanitizeHTML(faq.pregunta)}
                <span className="text-ink/30 transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="border-t border-border px-6 py-4 text-sm text-ink/60">
                {sanitizeHTML(faq.respuesta)}
              </div>
            </details>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/faq"
            className="text-sm text-accent hover:underline"
          >
            Ver todas las preguntas →
          </Link>
        </div>
      </div>
    </section>
  );
}
