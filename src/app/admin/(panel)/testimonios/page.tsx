import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTestimonios } from "./actions";
import { TestimoniosList } from "@/components/admin/TestimoniosList";

export default async function TestimoniosPage() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/admin");

  const testimonios = await getTestimonios();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Testimonios</h1>
          <p className="mt-1 text-ink-muted">{testimonios.length} testimonios en total</p>
        </div>
      </div>

      <div className="mt-8">
        <TestimoniosList testimonios={testimonios as never} />
      </div>
    </div>
  );
}
