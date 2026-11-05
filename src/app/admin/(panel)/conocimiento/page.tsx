import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getConocimiento } from "./actions";
import { ConocimientoList } from "@/components/admin/ConocimientoList";

export default async function ConocimientoAdminPage() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/admin");

  const conocimiento = await getConocimiento();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">
            Conocimiento del chat
          </h1>
          <p className="mt-1 text-ink-muted">
            {conocimiento.length} documentos en total
          </p>
        </div>
      </div>

      <div className="mt-8">
        <ConocimientoList conocimiento={conocimiento} />
      </div>
    </div>
  );
}
