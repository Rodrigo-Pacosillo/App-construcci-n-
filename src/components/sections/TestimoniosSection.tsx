import { prisma } from "@/lib/db";
import { FALLBACK_TESTIMONIOS } from "@/lib/fallback-data";
import { TestimoniosCarousel } from "./TestimoniosCarousel";

async function getTestimonios() {
  try {
    const testimonios = await prisma.testimonio.findMany({
      where: { publicado: true },
      take: 5,
    });
    return testimonios.length > 0 ? testimonios : FALLBACK_TESTIMONIOS;
  } catch {
    return FALLBACK_TESTIMONIOS;
  }
}

export async function TestimoniosSection() {
  const testimonios = await getTestimonios();

  return (
    <section className="py-24 lg:py-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <p className="section-label mb-4 text-ink/40">04 / TESTIMONIOS</p>
        <h2 className="font-heading text-4xl font-bold md:text-5xl">
          Que dicen nuestros clientes
        </h2>
      </div>

      <TestimoniosCarousel testimonios={testimonios} />
    </section>
  );
}
