import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getFaqs } from "./actions";
import { FaqsList } from "@/components/admin/FaqsList";

export default async function FaqsAdminPage() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/admin");

  const faqs = await getFaqs();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">FAQs</h1>
          <p className="mt-1 text-ink-muted">{faqs.length} FAQs en total</p>
        </div>
      </div>

      <div className="mt-8">
        <FaqsList faqs={faqs as never} />
      </div>
    </div>
  );
}
